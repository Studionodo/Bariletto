/* ------------------------------------------------------------------
   Cronocomparatore: il nucleo di analisi.
   Copiato senza modifiche dal prototipo collaudato (cronocomparatore-
   prova.html): funzioni pure, nessun accesso a pagina o microfono, così
   si collaudano con segnali sintetici. La parte che ascolta sta in
   misura.js.
   ------------------------------------------------------------------ */

const BPH_STANDARD = [14400, 18000, 19800, 21600, 25200, 28800, 36000];

function mediana(a) {
  if (!a.length) return 0;
  const b = Float64Array.from(a).sort();
  const m = b.length >> 1;
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}

/* Inviluppo del segnale: passa-alto (toglie ronzii e rumore ambientale grave),
   raddrizzamento, poi lisciatura a costante di tempo breve. */
function inviluppo(x, sr) {
  const n = x.length;
  const e = new Float32Array(n);
  const fc = 1500;
  const a = Math.exp((-2 * Math.PI * fc) / sr);
  const k = 1 - Math.exp(-1 / (0.0004 * sr)); // tau 0,4 ms
  let y = 0, xp = 0, env = 0;
  for (let i = 0; i < n; i++) {
    y = a * (y + x[i] - xp);
    xp = x[i];
    const r = y < 0 ? -y : y;
    env += k * (r - env);
    e[i] = env;
  }
  return e;
}

/* Trova l'attacco di ogni battito. Tra un attacco e il successivo lascia una
   pausa fissa di 45 ms, indipendente dalle alternanze scelte: il battito più
   veloce (36000/h) ha 100 ms fra un tic e l'altro, quindi non se ne perde nessuno. */
function trovaAttacchi(e, sr) {
  const n = e.length;
  // pavimento di rumore e dispersione robusta, su campioni sottocampionati
  const passo = Math.max(1, Math.floor(sr / 2000));
  const camp = [];
  for (let i = 0; i < n; i += passo) camp.push(e[i]);
  const pav = mediana(camp);
  const mad = mediana(camp.map((v) => Math.abs(v - pav))) || 1e-9;
  // livello tipico di un battito: mediana dei massimi in blocchi da mezzo secondo
  const blocco = Math.floor(0.5 * sr);
  const massimi = [];
  for (let s = 0; s + blocco <= n; s += blocco) {
    let m = 0;
    for (let j = s; j < s + blocco; j++) if (e[j] > m) m = e[j];
    massimi.push(m);
  }
  const alto = Math.max(mediana(massimi) - pav, 1e-9);
  const soglia = pav + Math.max(0.12 * alto, 8 * mad);
  const minPicco = pav + Math.max(0.35 * alto, 15 * mad);
  const finestra = Math.floor(0.008 * sr);
  const pausa = Math.floor(0.045 * sr);
  const attacchi = [];
  let i = 0;
  while (i < n - finestra) {
    if (e[i] > soglia) {
      let picco = 0;
      for (let j = i; j < i + finestra; j++) if (e[j] > picco) picco = e[j];
      if (picco >= minPicco) {
        const livello = pav + 0.25 * (picco - pav);
        let m = i;
        while (m < i + finestra && e[m] < livello) m++;
        attacchi.push(m / sr);
        i = m + pausa;
      } else {
        i += finestra; // rumore: salta oltre
      }
      continue;
    }
    i++;
  }
  return attacchi;
}

function bphPiuVicino(bph) {
  let best = BPH_STANDARD[0], bd = Infinity;
  for (const s of BPH_STANDARD) {
    const d = Math.abs(Math.log(bph / s));
    if (d < bd) { bd = d; best = s; }
  }
  return { bph: best, scarto: bd };
}

/* Regressione lineare con scarto iterativo dei valori anomali. */
function regressione(nn, tt) {
  let idx = tt.map((_, i) => i);
  let a = 0, b = 0;
  for (let giro = 0; giro < 3; giro++) {
    const N = idx.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const i of idx) { sx += nn[i]; sy += tt[i]; sxx += nn[i] * nn[i]; sxy += nn[i] * tt[i]; }
    const den = N * sxx - sx * sx;
    if (Math.abs(den) < 1e-12) break;
    b = (N * sxy - sx * sy) / den;
    a = (sy - b * sx) / N;
    const res = tt.map((t, i) => t - (a + b * nn[i]));
    const s = 1.4826 * mediana(idx.map((i) => Math.abs(res[i]))) || 1e-6;
    const nuovo = tt.map((_, i) => i).filter((i) => Math.abs(res[i]) < Math.max(3 * s, 0.0004));
    if (nuovo.length === idx.length || nuovo.length < 8) break;
    idx = nuovo;
  }
  // errore standard della pendenza
  const N = idx.length;
  let sxx = 0, sx = 0, ss = 0;
  for (const i of idx) sx += nn[i];
  const mx = sx / N;
  for (const i of idx) { sxx += (nn[i] - mx) ** 2; const r = tt[i] - (a + b * nn[i]); ss += r * r; }
  const seB = N > 2 ? Math.sqrt(ss / (N - 2) / sxx) : NaN;
  return { a, b, seB, usati: N };
}

/* Forza della periodicita' a periodo T: 1 = tutti i battiti in fase, ~0 = a caso. */
function forzaPeriodo(t, T) {
  let c = 0, s = 0;
  const w = (2 * Math.PI) / T;
  for (let i = 0; i < t.length; i++) { const f = w * t[i]; c += Math.cos(f); s += Math.sin(f); }
  return { R: Math.hypot(c, s) / t.length, fase: Math.atan2(s, c) };
}

/* Per ogni frequenza standard cerca lo scarto di marcia (fino a +-1%) che mette
   i battiti piu' in fase. I colpi spuri non sono periodici e non contano. */
function cercaReticolo(t, candidati) {
  const risultati = [];
  for (const bph of candidati) {
    const T0 = 3600 / bph;
    let best = { R: 0, T: T0, fase: 0 };
    for (let k = -50; k <= 50; k++) {
      const T = T0 * (1 + k * 0.0002);
      const f = forzaPeriodo(t, T);
      if (f.R > best.R) best = { R: f.R, T, fase: f.fase };
    }
    risultati.push({ bph, ...best });
  }
  return risultati;
}

/* bphForzato: se nullo, le alternanze si stimano dalla periodicita' dei battiti. */
function analizza(x, sr, bphForzato) {
  const durata = x.length / sr;
  const e = inviluppo(x, sr);
  const t = trovaAttacchi(e, sr);
  if (t.length < 12) return { ok: false, motivo: "segnale", battiti: t.length, durata };

  const candidati = bphForzato ? [bphForzato] : BPH_STANDARD;
  const ret = cercaReticolo(t, candidati);
  const max = Math.max(...ret.map((r) => r.R));
  if (max < 0.3) return { ok: false, motivo: "battito", battiti: t.length, durata, R: max };
  // fra le frequenze compatibili (armoniche l'una dell'altra) vince la piu' bassa
  const scelta = ret.filter((r) => r.R >= 0.75 * max).sort((a, b) => a.bph - b.bph)[0];
  const bph = scelta.bph;
  const Tnom = 3600 / bph;

  // tiene solo i battiti che cadono sul reticolo, scarta il resto
  const tol = 0.08 * scelta.T;
  const ref = (scelta.fase / (2 * Math.PI)) * scelta.T;
  const tt = [], nn = [];
  let n0 = null;
  for (const v of t) {
    let m = Math.round((v - ref) / scelta.T);
    if (Math.abs(v - (ref + m * scelta.T)) > tol) continue;
    if (n0 === null) n0 = m;
    tt.push(v); nn.push(m - n0);
  }
  if (tt.length < 12) return { ok: false, motivo: "battito", battiti: t.length, durata };

  const r = regressione(nn, tt);
  const Tmis = r.b;
  const marcia = (Tnom / Tmis - 1) * 86400; // + anticipa, - ritarda (s/giorno)
  const incertezza = 1.5 * (r.seB / Tmis) * 86400; // 1,5x: la stima grezza e' un po' ottimista

  // errore di battuta: scarto medio fra battiti pari e dispari rispetto alla retta
  const pari = [], dispari = [];
  for (let i = 0; i < tt.length; i++) {
    const res = tt[i] - (r.a + Tmis * nn[i]);
    if (Math.abs(res) > tol) continue;
    (((nn[i] % 2) + 2) % 2 ? dispari : pari).push(res);
  }
  const battuta = pari.length > 4 && dispari.length > 4
    ? Math.abs(mediana(pari) - mediana(dispari)) * 1000 : NaN; // ms

  const attesi = Math.floor(durata / Tnom);
  const copertura = Math.min(1, tt.length / attesi);
  return {
    ok: true, bph, bphAuto: !bphForzato, marcia, incertezza, battuta,
    battiti: tt.length, attesi, copertura, durata, R: scelta.R,
  };
}
