/* ------------------------------------------------------------------
   La pagina: una sola.

   In cima l'orologio che riposa da più tempo, con i due gesti per
   rispondergli. Sotto, tutta la collezione ordinata allo stesso modo:
   il più dimenticato per primo, chi è al polso oggi in fondo.
   Ogni riga apre la scheda del suo orologio, nel foglio.
   ------------------------------------------------------------------ */

function testata() {
  const h = el("header", "testata");
  const marchio = el("div", "marchio");
  marchio.append(document.createTextNode(NOME_APP), el("span", "marchio-punto", "."));
  const azioni = el("div", "testata-azioni");

  /* La pillola dell'ora: dice in che fascia siamo e, toccata, spiega
     che i colori seguono l'ora del giorno. È il posto dove la regola
     si legge senza cercarla. */
  const ora = document.documentElement.dataset.ora || oraCorrente();
  const pillola = bottone("pillola", t("ora." + ora), ora, () => apriAspetto());
  pillola.setAttribute("aria-label", t("aspetto.spiega", { ora: t("ora." + ora) }));

  const imp = el("button", "tondo");
  imp.innerHTML = icona("impostazioni", 22);
  imp.setAttribute("aria-label", t("imp.titolo"));
  imp.onclick = () => apriFoglio("impostazioni");

  azioni.append(pillola, imp);
  h.append(marchio, azioni);
  return h;
}

/* L'anello del riposo: si riempie man mano che i giorni si avvicinano
   alla soglia. Arrivato in cima cambia colore: è ora di farlo girare. */
function anelloRiposo(g) {
  const quota = Math.min(1, g / soglia);
  const r = 50, giro = 2 * Math.PI * r;
  const pieno = g >= soglia;
  const box = el("div", "anello-riposo" + (pieno ? " pieno" : ""));
  box.innerHTML =
    '<svg viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle class="traccia" cx="60" cy="60" r="' + r + '"/>' +
    '<circle class="arco" cx="60" cy="60" r="' + r + '" stroke-dasharray="' +
    (giro * quota).toFixed(1) + " " + giro.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg>';
  const centro = el("div", "anello-centro");
  centro.append(el("span", "anello-numero", String(g)),
                el("span", "anello-sotto", t(g === 1 ? "eroe.giornoRiposo" : "eroe.giorniRiposo")));
  box.append(centro);
  return box;
}

function eroe(o) {
  const s = el("section", "eroe riquadro");
  const g = giorniRiposo(o);
  const oggi = alPolsoOggi(o);

  const alto = el("div", "eroe-alto");
  alto.append(anelloRiposo(oggi ? 0 : g));
  const testo = el("div", "eroe-testo");
  testo.append(el("span", "etichetta",
    t(oggi ? "eroe.alPolso" : daFarGirare(o) ? "eroe.daGirare" : "eroe.riposo")));
  /* Un nome lungo scende di corpo invece di spezzarsi a metà parola:
     «Speedmas-ter» su due righe si legge peggio di un carattere più piccolo. */
  const parolaLunga = Math.max(...o.nome.split(/\s+/).map((w) => w.length));
  testo.append(el("h1", "eroe-nome" + (parolaLunga >= 10 || o.nome.length > 20 ? " lungo" : ""), o.nome));
  testo.append(el("p", "eroe-calibro", nomeCorto(o.calibroNome)));
  alto.append(testo);
  s.append(alto);

  /* La frase dice solo da quanti giorni non lo indossi: nessun
     consiglio tecnico, non siamo orologiai. */
  const gs = giorniSenzaPolso(o);
  const frase = oggi ? t("eroe.fraseOggi")
    : o.ultimoPolso == null ? (gs < 1 ? t("eroe.fraseNuovo") : t("eroe.fraseMai", { g: plurale(gs, "giorno_", "giorniPl") }))
    : gs === 1 ? t("eroe.fraseIeri")
    : t("eroe.frase", { g: riposoDetto(gs) });
  s.append(el("p", "eroe-frase", frase));

  const sc = statoCarica(o);
  const riga = el("p", "eroe-carica");
  riga.style.color = sc.colore;
  riga.textContent = sc.testo;
  s.append(riga);

  s.addEventListener("click", (e) => { if (!e.target.closest("button")) apriFoglio("orologio", { id: o.id }); });
  return s;
}

/* I due gesti. «Indossato» è il gesto pieno, «Caricato» quello
   secondario, e compare solo se la corona carica davvero la molla. */
function azioniGiorno(o) {
  const fila = el("div", "fila-azioni");
  const puoCaricare = o.mano || o.tipo === "manuale";
  if (alPolsoOggi(o)) {
    fila.append(bottone("bottone secondario largo", t("annullaOggi"), null, () => annullaOggi(o)));
    return fila;
  }
  if (puoCaricare) {
    fila.append(bottone("bottone secondario", t("caricato"), "corona", () => segnaCarica(o)));
  }
  const p = el("button", "bottone primario" + (puoCaricare ? "" : " largo"));
  p.innerHTML = icona("polso", 18) + "<span class=\"bottone-testo\"></span>";
  p.querySelector(".bottone-testo").textContent = t("indossato");
  if (daFarGirare(o)) p.append(el("span", "bottone-sotto", t("consigliato")));
  p.onclick = () => segna(o);
  fila.append(p);
  return fila;
}

/* ------------------------------------------------------------------
   Il mazzo.
   Quando più di un orologio chiede attenzione, le carte si scorrono di
   lato, una alla volta: si vede un pezzo della successiva, così si
   capisce che ce n'è un'altra. Massimo cinque carte: oltre, l'ultima
   dice quanti ne restano e porta all'elenco.

   I due bottoni stanno fuori dal mazzo e valgono per la carta che si
   vede. Si rifanno mentre scorri, appena una carta prende più di metà
   dello spazio: quello che tocchi è sempre per l'orologio davanti a te.

   La pagina si ridisegna da capo (un gesto, il cambio d'ora): la carta
   che stavi guardando si ricorda per id, e se non c'è più (l'hai
   appena indossata) si resta allo stesso posto del mazzo.
   ------------------------------------------------------------------ */
const MAZZO_MAX = 5;
let mazzoVisto = null;          /* { id, indice } della carta davanti */
let mazzoArrivo = false;        /* la carta precedente è appena uscita */

function mazzo(chiedono) {
  const carte = chiedono.length > MAZZO_MAX ? chiedono.slice(0, MAZZO_MAX - 1) : chiedono;
  const resto = chiedono.length - carte.length;

  const sc = el("div", "mazzo");
  carte.forEach((o) => {
    const c = eroe(o);
    c.classList.add("carta");
    c.dataset.id = o.id;
    sc.append(c);
  });
  if (resto > 0) {
    const a = el("button", "eroe riquadro carta carta-altri");
    a.dataset.id = "altri";
    a.append(el("span", "etichetta", t("eroe.daGirare")),
             el("span", "eroe-nome", t("mazzo.altri", { n: resto })));
    const f = el("span", "carta-freccia");
    f.innerHTML = icona("avanti", 22);
    a.append(f);
    a.onclick = () => {
      const capo = q(".capo-sezione");
      if (capo) capo.scrollIntoView({ behavior: movimentoRidotto() ? "auto" : "smooth", block: "start" });
    };
    sc.append(a);
  }

  const tutte = [...sc.children];
  const punti = el("div", "mazzo-punti");
  punti.setAttribute("aria-hidden", "true");
  tutte.forEach(() => punti.append(el("span", "punto")));

  /* La fila dei gesti: si sostituisce quando cambia la carta davanti.
     Sulla carta «altri» non c'è un orologio: la fila resta al suo posto
     ma spenta, così niente sotto salta. */
  let fila = el("div", "fila-azioni");
  const metti = (i) => {
    const c = tutte[i];
    const o = c && orologi.find((x) => x.id === c.dataset.id);
    const nuova = o ? azioniMazzo(o, c) : azioniGiorno(carte[carte.length - 1]);
    if (!o) nuova.classList.add("spenta");
    fila.replaceWith(nuova);
    fila = nuova;
    [...punti.children].forEach((p, k) => p.classList.toggle("acceso", k === i));
    mazzoVisto = { id: c.dataset.id, indice: i };
  };

  let davanti = -1;
  const guarda = () => {
    const i = cartaDavanti(sc, tutte);
    if (i !== davanti) { davanti = i; metti(i); }
  };
  let attesa = 0;
  sc.addEventListener("scroll", () => {
    if (attesa) return;
    attesa = requestAnimationFrame(() => { attesa = 0; guarda(); });
  }, { passive: true });

  /* Dove ripartire: la stessa carta di prima, o lo stesso posto. */
  let inizio = 0;
  if (mazzoVisto) {
    const k = tutte.findIndex((c) => c.dataset.id === mazzoVisto.id);
    inizio = k >= 0 ? k : Math.min(mazzoVisto.indice, tutte.length - 1);
  }
  if (mazzoArrivo && tutte[inizio]) tutte[inizio].classList.add("arriva");
  mazzoArrivo = false;
  davanti = inizio;
  metti(inizio);

  /* La posizione si dà dopo che la pagina è nel documento, ma prima che
     il browser la dipinga: nessun salto visibile dalla prima carta. */
  queueMicrotask(() => {
    if (!sc.isConnected || !inizio) return;
    const bordo = sc.getBoundingClientRect().left + parseFloat(getComputedStyle(sc).scrollPaddingLeft || 0);
    sc.scrollLeft += tutte[inizio].getBoundingClientRect().left - bordo;
  });

  return [sc, punti, fila];
}

/* La carta davanti è quella col bordo sinistro più vicino al punto
   d'aggancio. A fine corsa l'ultima non arriva fino a lì, ma resta
   comunque la più vicina. */
function cartaDavanti(sc, tutte) {
  const aggancio = sc.getBoundingClientRect().left + parseFloat(getComputedStyle(sc).scrollPaddingLeft || 0);
  let migliore = 0, distanza = Infinity;
  tutte.forEach((c, i) => {
    const d = Math.abs(c.getBoundingClientRect().left - aggancio);
    if (d < distanza) { distanza = d; migliore = i; }
  });
  return migliore;
}

/* Gli stessi due gesti della carta singola. Nel mazzo, prima di segnare,
   la carta esce: dopo il gesto non chiede più attenzione e lascia il
   posto alla successiva. */
function azioniMazzo(o, carta) {
  const fila = azioniGiorno(o);
  fila.querySelectorAll("button").forEach((b) => {
    const gesto = b.onclick;
    b.onclick = () => {
      if (carta.classList.contains("esce")) return;
      fila.querySelectorAll("button").forEach((x) => { x.disabled = true; });
      carta.classList.add("esce");
      mazzoArrivo = true;
      setTimeout(gesto, movimentoRidotto() ? 0 : 240);
    };
  });
  return fila;
}

const movimentoRidotto = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

function rigaOrologio(o) {
  const r = el("button", "riga-orologio");
  const oggi = alPolsoOggi(o);
  const g = giorniSenzaPolso(o);
  const corpo = el("div", "riga-corpo");
  corpo.append(el("span", "riga-nome", o.nome),
               el("span", "riga-sotto", nomeCorto(o.calibroNome)));
  const lato = el("div", "riga-lato");
  if (oggi) {
    lato.append(el("span", "riga-giorni oro", t("r.oggi")));
  } else if (o.ultimoPolso == null && g < 1) {
    lato.append(el("span", "riga-giorni", t("r.nuovo")));
  } else {
    const n = el("span", "riga-numero" + (daFarGirare(o) ? " alto" : ""), String(g));
    lato.append(n, el("span", "riga-unita", t(g === 1 ? "r.giornoSenza" : "r.giorniSenza")));
  }
  r.append(corpo, lato);
  r.setAttribute("aria-label", o.nome + ", " + (oggi ? t("r.oggi") : riposoDetto(g)));
  r.onclick = () => apriFoglio("orologio", { id: o.id });
  return r;
}

function costruisciPagina() {
  const d = el("div", "pagina");
  d.append(testata());

  d.append(el("p", "data-oggi", new Date().toLocaleDateString(locale(),
    { weekday: "long", day: "numeric", month: "long" })));

  if (!orologi.length) {
    const v = el("section", "vuoto riquadro");
    v.append(el("h1", "vuoto-titolo", t("vuoto.titolo")),
             el("p", "prosa", t("vuoto.testo")));
    v.append(bottone("bottone primario largo", t("aggiungiPrimo"), "piu", () => apriFoglio("modulo", {})));
    d.append(v);
    return d;
  }

  const ordinati = ordinaPerRiposo(orologi);
  const chiedono = ordinati.filter(daFarGirare);
  if (chiedono.length > 1) {
    d.append(...mazzo(chiedono));
  } else {
    mazzoVisto = null; mazzoArrivo = false;
    const primo = chiedono[0] || ordinati.find((o) => !alPolsoOggi(o)) || ordinati[0];
    d.append(eroe(primo), azioniGiorno(primo));
  }

  const capo = el("div", "capo-sezione");
  capo.append(el("h2", "etichetta", t("coll.titolo") + " · " + orologi.length));
  capo.append(bottone("chip", t("agg.breve"), "piu", () => apriFoglio("modulo", {})));
  d.append(capo);

  const elenco = el("div", "elenco");
  ordinati.forEach((o) => elenco.append(rigaOrologio(o)));
  d.append(elenco);

  d.append(el("p", "piede-soglia", t("piede.soglia", { g: plurale(soglia, "giorno_", "giorniPl") })));
  return d;
}

/* La regola dei colori, detta dove la si cerca: toccando la pillola. */
function apriAspetto() {
  apriInfo(t("aspetto.titolo"), [t("aspetto.testo"), elencoFasce()]);
}
function elencoFasce() {
  const dl = el("dl", "spec fasce");
  FASCE.forEach((f) => {
    const dt = el("dt");
    dt.innerHTML = icona(f.id, 16);
    dt.append(document.createTextNode(" " + t("ora." + f.id)));
    dl.append(dt, el("dd", null, t("aspetto.dalle", { da: f.da, a: f.a })));
  });
  return dl;
}
