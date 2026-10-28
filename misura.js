/* ------------------------------------------------------------------
   Il cronocomparatore, dentro la scheda di un orologio. Beta.

   Il calcolo sta in crono.js, copiato senza modifiche dal prototipo
   collaudato. Qui c'è solo la parte che ascolta e mostra: microfono,
   tela col battito, risultato, salvataggio nella storia dell'orologio.

   La differenza col prototipo è una: le alternanze arrivano dal
   calibro. Indovinarle dal suono era il punto più debole della misura;
   quando il calibro le dichiara, non serve indovinare. Se il calibro è
   dichiarato a mano e non sono certe, si torna al riconoscimento.

   Il microfono si apre con cancellazione d'eco, riduzione del rumore e
   guadagno automatico spenti: sono filtri pensati per la voce, e sul
   battito di uno scappamento fanno danni. Non è mai stato provato con un
   orologio e un telefono veri: per questo resta Beta.
   ------------------------------------------------------------------ */

const POSIZIONI = ["qsu", "qgiu", "csu", "cgiu", "csx", "cdx"];
const DURATE = [20, 30, 60];

/* Lo stato dell'ascolto vive fuori dal disegno: ridisegnare il foglio
   mentre il microfono è aperto perderebbe la tela e i campioni. */
const ascolto = { attivo: false, ctx: null, stream: null, nodo: null, dati: null, pos: 0, sr: 0,
                  durata: 30, picco: 0, timer: 0, esito: null };

COSTRUTTORI.misura = {
  classe: "alto",
  occupato: () => ascolto.attivo,
  chiudi: () => fermaAscolto(true),
  disegna(d, f) {
    const o = trovaOrologio(d.id);
    if (!o) return false;
    if (!d.posizione) d.posizione = "qsu";
    if (!d.durata) d.durata = 30;
    if (d.bph === undefined) d.bph = BPH_STANDARD.includes(o.ah) ? o.ah : null;

    const corpo = capoFoglio(f, t("mis.titolo"));
    const capo = el("div", "scheda-capo");
    const h = el("h1", "scheda-nome", o.nome);
    capo.append(h, el("span", "beta grande", "Beta"));
    corpo.append(capo);
    corpo.append(el("p", "prosa", t("mis.istruzioni")));

    /* Le tre scelte, in pastiglie: niente menu a tendina. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("mis.posizione")));
    corpo.append(scelte(POSIZIONI, d.posizione, (p) => t("pos." + p), (p) => { d.posizione = p; disegnaFoglio(); }));
    corpo.append(el("h2", "etichetta sezione-titolo", t("mis.durata")));
    corpo.append(scelte(DURATE, d.durata, (n) => t("mis.secondi", { n }), (n) => { d.durata = n; disegnaFoglio(); }));
    corpo.append(el("h2", "etichetta sezione-titolo", t("mis.alternanze")));
    corpo.append(scelte([null, ...BPH_STANDARD], d.bph,
      (n) => (n == null ? t("mis.riconosci") : n.toLocaleString(locale()) + (n === o.ah ? " · " + t("mis.dalCalibro") : "")),
      (n) => { d.bph = n; disegnaFoglio(); }));

    const via = bottone("bottone primario largo", t("mis.ascolta"), "microfono", () => avviaAscolto(d, o));
    via.id = "mis-via";
    corpo.append(via);

    const tela = el("canvas", "tela");
    tela.id = "mis-tela"; tela.width = 920; tela.height = 192;
    corpo.append(tela);
    const stato = el("p", "mis-stato", t("mis.pronto"));
    stato.id = "mis-stato";
    stato.setAttribute("aria-live", "polite");
    const barra = el("div", "barra"); const riemp = el("i"); riemp.id = "mis-barra"; barra.append(riemp);
    corpo.append(stato, barra);

    if (ascolto.esito && ascolto.esito.orologio === o.id) corpo.append(esitoMisura(ascolto.esito, o, d));

    corpo.append(el("p", "nota", t("mis.nota")));
  },
};

function scelte(valori, attuale, etichetta, scegli) {
  const fila = el("div", "scelte");
  valori.forEach((v) => {
    const b = el("button", "scelta" + (v === attuale ? " accesa" : ""), etichetta(v));
    b.setAttribute("aria-pressed", String(v === attuale));
    b.onclick = () => { if (!ascolto.attivo) scegli(v); };
    fila.append(b);
  });
  return fila;
}

const $m = (id) => document.getElementById(id);
function statoMisura(testo) { const s = $m("mis-stato"); if (s) s.textContent = testo; }

async function avviaAscolto(d, o) {
  if (ascolto.attivo) return;
  ascolto.esito = null;
  const vecchio = q(".esito-misura"); if (vecchio) vecchio.remove();
  try {
    ascolto.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
  } catch (e) {
    statoMisura(t("mis.noMicrofono")); return;
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  ascolto.ctx = ctx;
  await ctx.resume();
  ascolto.sr = ctx.sampleRate;
  ascolto.durata = d.durata;
  ascolto.dati = new Float32Array(Math.ceil((d.durata + 1) * ascolto.sr));
  ascolto.pos = 0; ascolto.picco = 0; ascolto.attivo = true;
  ascolto.d = d; ascolto.o = o;
  document.querySelectorAll(".foglio .scelta").forEach((b) => (b.disabled = true));
  const via = $m("mis-via"); if (via) via.disabled = true;

  const src = ctx.createMediaStreamSource(ascolto.stream);
  const riceve = (c) => {
    if (!ascolto.attivo) return;
    const n = Math.min(c.length, ascolto.dati.length - ascolto.pos);
    ascolto.dati.set(c.subarray(0, n), ascolto.pos); ascolto.pos += n;
    let m = 0; for (let i = 0; i < c.length; i++) { const a = c[i] < 0 ? -c[i] : c[i]; if (a > m) m = a; }
    ascolto.picco = Math.max(m, ascolto.picco * 0.9);
    if (ascolto.pos >= ascolto.durata * ascolto.sr) concludiAscolto();
  };
  try {
    const codice = "class R extends AudioWorkletProcessor{process(i){const c=i[0][0];if(c)this.port.postMessage(c.slice(0));return true;}}registerProcessor('reg',R);";
    const url = URL.createObjectURL(new Blob([codice], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    ascolto.nodo = new AudioWorkletNode(ctx, "reg", { numberOfInputs: 1, numberOfOutputs: 1 });
    ascolto.nodo.port.onmessage = (e) => riceve(e.data);
  } catch (e) {
    ascolto.nodo = ctx.createScriptProcessor(2048, 1, 1);
    ascolto.nodo.onaudioprocess = (e) => riceve(e.inputBuffer.getChannelData(0));
  }
  const muto = ctx.createGain(); muto.gain.value = 0;
  src.connect(ascolto.nodo); ascolto.nodo.connect(muto); muto.connect(ctx.destination);
  statoMisura(t("mis.ascolto"));
  ascolto.timer = setInterval(aggiornaAscolto, 400);
}

function aggiornaAscolto() {
  if (!ascolto.attivo) return;
  const b = $m("mis-barra");
  if (b) b.style.width = Math.min(100, (ascolto.pos / (ascolto.durata * ascolto.sr)) * 100) + "%";
  const sec = ascolto.pos / ascolto.sr;
  disegnaTela();
  if (sec > 2 && ascolto.picco < 0.004) statoMisura(t("mis.silenzio"));
  else if (ascolto.picco > 0.97) statoMisura(t("mis.forte"));
  else statoMisura(t("mis.restano", { n: Math.max(0, Math.ceil(ascolto.durata - sec)) }));
}

function disegnaTela() {
  const cv = $m("mis-tela"); if (!cv) return;
  const g = cv.getContext("2d"), W = cv.width, H = cv.height, sr = ascolto.sr;
  g.clearRect(0, 0, W, H);
  const n = Math.min(ascolto.pos, Math.floor(2 * sr));
  if (n < sr / 4) return;
  const seg = ascolto.dati.subarray(ascolto.pos - n, ascolto.pos);
  const e = inviluppo(seg, sr);
  const att = trovaAttacchi(e, sr);
  let mx = 1e-9; for (let i = 0; i < e.length; i += 8) if (e[i] > mx) mx = e[i];
  const stile = getComputedStyle(document.documentElement);
  g.fillStyle = stile.getPropertyValue("--viola").trim() || "#9E89EC";
  const per = e.length / W;
  for (let x = 0; x < W; x++) {
    let m = 0; const a = Math.floor(x * per), b = Math.min(e.length, Math.floor((x + 1) * per));
    for (let i = a; i < b; i++) if (e[i] > m) m = e[i];
    const h = Math.max(1, (m / mx) * (H - 8));
    g.fillRect(x, H - h, 1, h);
  }
  g.fillStyle = stile.getPropertyValue("--oro").trim() || "#C9A96A";
  for (const tt of att) g.fillRect(Math.round((tt * sr) / per), 0, 3, 10);
}

/* Chiude microfono e contesto. «abbandona» vuol dire che il foglio si
   sta chiudendo: niente analisi, niente esito. */
function fermaAscolto(abbandona) {
  if (!ascolto.attivo && !abbandona) return;
  const eraAttivo = ascolto.attivo;
  ascolto.attivo = false;
  clearInterval(ascolto.timer);
  try { ascolto.stream && ascolto.stream.getTracks().forEach((x) => x.stop()); } catch (e) {}
  try { ascolto.ctx && ascolto.ctx.close(); } catch (e) {}
  ascolto.stream = null; ascolto.ctx = null; ascolto.nodo = null;
  if (abbandona) { ascolto.esito = null; return false; }
  return eraAttivo;
}

function concludiAscolto() {
  if (!fermaAscolto(false)) return;
  const b = $m("mis-barra"); if (b) b.style.width = "100%";
  const x = ascolto.dati.subarray(0, Math.min(ascolto.pos, ascolto.dati.length));
  const r = analizza(x, ascolto.sr, ascolto.d.bph || null);
  ascolto.esito = { ...r, orologio: ascolto.o.id, posizione: ascolto.d.posizione, salvato: false };
  window.__crono = { ultimo: r };
  statoMisura(r.ok ? t("mis.fatto") : t("mis.riprova"));
  disegnaFoglio(true);
}

function esitoMisura(r, o, d) {
  const box = el("section", "esito-misura riquadro");
  if (!r.ok) {
    box.append(el("p", "mis-grande", t("mis.nessuna")));
    box.append(el("p", "prosa piccola", t(r.motivo === "battito" ? "mis.noBattito" : "mis.noSegnale")));
    return box;
  }
  const v = r.marcia;
  const grande = el("p", "mis-grande");
  grande.append(el("span", v >= 0 ? "avanti" : "indietro", segnoMarcia(v)),
                el("small", null, " " + t("mis.sg") + ", " + t(v >= 0 ? "mis.anticipa" : "mis.ritarda")));
  box.append(grande);

  const qualita = r.copertura >= 0.85 ? "buona" : r.copertura >= 0.6 ? "media" : "scarsa";
  const dl = el("dl", "spec");
  const riga = (k, val) => dl.append(el("dt", null, k), el("dd", null, val));
  const uno = (n) => n.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  riga(t("mis.incertezza"), "±" + uno(r.incertezza) + " " + t("mis.sg"));
  riga(t("mis.battuta"), Number.isFinite(r.battuta) ? uno(r.battuta) + " ms" : t("mis.nd"));
  riga(t("mis.alternanze"), r.bph.toLocaleString(locale()) + (r.bphAuto ? " · " + t("mis.riconosciute") : ""));
  riga(t("mis.battiti"), t("mis.battitiSu", { n: r.battiti, a: r.attesi }) + " · " + t("mis.q." + qualita));
  box.append(dl);
  if (qualita === "scarsa") box.append(el("p", "nota", t("mis.pocoAffidabile")));

  if (r.salvato) {
    box.append(el("p", "nota salvato", t("mis.salvata")));
  } else {
    box.append(bottone("bottone primario largo", t("mis.salva"), null, async () => {
      r.salvato = true;
      await salvaMisura(o, r, r.posizione);
    }));
  }
  return box;
}
