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
  testo.append(el("h1", "eroe-nome", o.nome));
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
  const primo = ordinati.find((o) => !alPolsoOggi(o)) || ordinati[0];
  d.append(eroe(primo), azioniGiorno(primo));

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
