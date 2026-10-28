/* ------------------------------------------------------------------
   La pagina: una sola.

   Al centro la pila: tutta la collezione, una carta per orologio,
   ordinata dal più dimenticato a chi porti oggi. La carta davanti è
   grande e dice tutto; le altre stanno di lato, ruotate, con il nome e
   il numero. Sotto, i due gesti per la carta davanti e una riga sola
   che riassume e apre l'elenco completo, nel foglio.
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

/* Un nome lungo scende di corpo invece di spezzarsi a metà parola:
   «Speedmas-ter» su due righe si legge peggio di un carattere più piccolo. */
function classeNome(base, nome) {
  const parolaLunga = Math.max(...nome.split(/\s+/).map((w) => w.length));
  return base + (parolaLunga >= 10 || nome.length > 20 ? " lungo" : "");
}

/* La frase dice solo da quanti giorni non lo indossi: nessun consiglio
   tecnico, non siamo orologiai. */
function fraseRiposo(o) {
  const gs = giorniSenzaPolso(o);
  if (alPolsoOggi(o)) return t("eroe.fraseOggi");
  if (o.ultimoPolso == null) return gs < 1 ? t("eroe.fraseNuovo") : t("eroe.fraseMai", { g: plurale(gs, "giorno_", "giorniPl") });
  if (gs === 1) return t("eroe.fraseIeri");
  return t("eroe.frase", { g: riposoDetto(gs) });
}

/* Una carta della pila. Due facce sovrapposte: quella piena (anello,
   nome, frase) per quando è davanti, quella di sintesi (nome e numero)
   per quando sta di lato. Lo scorrimento le dissolve l'una nell'altra. */
function cartaPila(o, i) {
  const oggi = alPolsoOggi(o);
  const gs = giorniSenzaPolso(o);
  const carta = el("div", "carta");
  carta.dataset.id = o.id;
  const volto = el("div", "carta-volto");

  const piena = el("div", "carta-piena");
  const etichetta = oggi ? "eroe.alPolso" : daFarGirare(o) ? "eroe.daGirare" : i === 0 ? "eroe.riposo" : "eroe.aRiposo";
  piena.append(el("span", "etichetta piccola", t(etichetta)));
  piena.append(anelloRiposo(oggi ? 0 : giorniRiposo(o)));
  piena.append(el("h2", classeNome("carta-nome", o.nome), o.nome));
  piena.append(el("p", "carta-calibro", nomeCorto(o.calibroNome)));
  piena.append(el("p", "carta-frase", fraseRiposo(o)));
  const sc = statoCarica(o);
  const riga = el("p", "carta-carica", sc.testo);
  riga.style.color = sc.colore;
  piena.append(riga);

  const sintesi = el("div", "carta-sintesi");
  sintesi.setAttribute("aria-hidden", "true");
  sintesi.append(el("span", classeNome("carta-nome", o.nome), o.nome));
  if (oggi) sintesi.append(el("span", "sintesi-oggi", t("r.oggi")));
  else if (o.ultimoPolso == null && gs < 1) sintesi.append(el("span", "sintesi-oggi", t("r.nuovo")));
  else sintesi.append(el("span", "sintesi-numero" + (daFarGirare(o) ? " alto" : ""), String(gs)));

  volto.append(piena, sintesi, el("div", "carta-ombra"));
  carta.append(volto);
  return carta;
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
   La pila.

   Il motore è lo scorrimento nativo del telefono: inerzia, aggancio
   alla carta, accessibilità vengono da lì. Ogni carta sta in un posto
   largo PASSO; uno spazio vuoto a ciascun capo lascia centrare anche
   la prima e l'ultima. Così la carta i è al centro esattamente quando
   lo scorrimento vale i × PASSO, e la posizione si ritrova con un
   conto, senza misurare niente.

   Sopra lo scorrimento, a ogni fotogramma, ogni carta si sposta, ruota
   e rimpicciolisce secondo la sua distanza dal centro. Si toccano solo
   trasformazioni e opacità: lavoro della scheda grafica, non del
   processore. Le carte lontane non si disegnano.

   La pagina si ridisegna da capo dopo ogni gesto e al cambio d'ora: si
   ricorda il posto (l'indice), non l'orologio. Dopo «Indossato» quel
   pezzo scivola in fondo e al suo posto arriva il prossimo da far
   girare, che è proprio quello che serve. Un orologio appena aggiunto
   invece si porta al centro (pilaVerso).
   ------------------------------------------------------------------ */
const PASSO = 112;
let pilaIndice = 0;
let pilaPunta = null;
let pilaArrivo = false;
const pilaVerso = (id) => { pilaPunta = id; };
/* Un solo ascoltatore per tutta la vita della pagina: la pila si
   ridisegna spesso, e uno nuovo a ogni ridisegno si accumulerebbe. */
let pilaRidisponi = () => {};
addEventListener("resize", () => pilaRidisponi(), { passive: true });

const movimentoRidotto = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

function pilaCarte(ordinati) {
  const sc = el("div", "pila");
  sc.tabIndex = 0;
  sc.setAttribute("role", "group");
  sc.setAttribute("aria-label", t("pila.etichetta"));
  sc.append(el("div", "pila-spazio"));
  const carte = ordinati.map((o, i) => {
    const posto = el("div", "pila-posto");
    const c = cartaPila(o, i);
    posto.append(c);
    sc.append(posto);
    c.addEventListener("click", () => {
      if (i === centro) apriFoglio("orologio", { id: o.id });
      else vai(i);
    });
    return c;
  });
  sc.append(el("div", "pila-spazio"));

  /* Dove sei: puntini finché si contano a occhio, poi un numero. */
  const dove = el("div", "pila-dove");
  dove.setAttribute("aria-hidden", "true");
  const conPunti = ordinati.length > 1 && ordinati.length <= 12;
  if (conPunti) ordinati.forEach(() => dove.append(el("span", "punto")));

  /* Per chi usa un lettore di schermo: la carta davanti, detta a voce. */
  const voce = el("span", "sr");
  voce.setAttribute("aria-live", "polite");

  let fila = el("div", "fila-azioni");
  let centro = -1;

  function davanti(i) {
    if (i === centro) return;
    centro = i;
    pilaIndice = i;
    const o = ordinati[i];
    const nuova = azioniPila(o);
    fila.replaceWith(nuova);
    fila = nuova;
    if (conPunti) [...dove.children].forEach((p, k) => p.classList.toggle("acceso", k === i));
    else if (ordinati.length > 1) dove.textContent = (i + 1) + " / " + ordinati.length;
    voce.textContent = o.nome + ", " + (alPolsoOggi(o) ? t("r.oggi") : riposoDetto(giorniSenzaPolso(o)));
    carte.forEach((c, k) => c.classList.toggle("davanti", k === i));
  }

  /* Le misure della carta si leggono una volta: la larghezza viene dal
     foglio di stile, che la adatta allo schermo. */
  let larga = 0;
  function disponi() {
    if (!larga) larga = carte[0].offsetWidth || 256;
    const piano = movimentoRidotto();
    const x = sc.scrollLeft / PASSO;
    carte.forEach((c, k) => {
      const d = k - x, a = Math.abs(d), s = Math.sign(d);
      if (a > 3.6) { c.style.visibility = "hidden"; return; }
      c.style.visibility = "";
      const n = Math.min(a, 1), r = Math.max(a - 1, 0), rr = Math.min(r, 3);
      /* La prima vicina si affaccia oltre il bordo della carta davanti;
         le altre si accostano strette dietro di lei. */
      const voluto = s * (n * larga * 0.5 + rr * larga * 0.13);
      /* Il bordo esterno si allontana: la carta sfugge verso il lato. */
      const giro = piano ? 0 : s * (n * 52 + rr * 4);
      const scala = 1 - n * 0.14 - rr * 0.08;
      c.style.transform = "translateX(" + (voluto - d * PASSO).toFixed(1) + "px) perspective(1000px) rotateY(" +
        giro.toFixed(1) + "deg) scale(" + scala.toFixed(3) + ")";
      c.style.zIndex = String(1000 - Math.round(a * 100));
      /* Di una carta a destra si vede il lato destro: nome e numero
         vanno da quella parte, dove restano leggibili. */
      const destra = d > 0.5;
      if (c.classList.contains("a-destra") !== destra) c.classList.toggle("a-destra", destra);
      c.style.setProperty("--piena", Math.max(0, 1 - a * 1.8).toFixed(3));
      c.style.setProperty("--sintesi", Math.min(1, Math.max(0, (a - 0.3) * 2)).toFixed(3));
      c.style.setProperty("--ombra", (n * 0.3 + rr * 0.15).toFixed(3));
    });
    davanti(Math.max(0, Math.min(carte.length - 1, Math.round(x))));
  }

  function vai(i, subito) {
    i = Math.max(0, Math.min(carte.length - 1, i));
    sc.scrollTo({ left: i * PASSO, behavior: subito || movimentoRidotto() ? "auto" : "smooth" });
  }

  let attesa = 0;
  sc.addEventListener("scroll", () => {
    if (attesa) return;
    attesa = requestAnimationFrame(() => { attesa = 0; disponi(); });
  }, { passive: true });
  sc.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); vai(centro + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); vai(centro - 1); }
    else if (e.key === "Home") { e.preventDefault(); vai(0); }
    else if (e.key === "End") { e.preventDefault(); vai(carte.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); apriFoglio("orologio", { id: ordinati[centro].id }); }
  });

  /* Da dove ripartire. */
  let inizio = Math.min(pilaIndice, carte.length - 1);
  if (pilaPunta) {
    const k = ordinati.findIndex((o) => o.id === pilaPunta);
    if (k >= 0) inizio = k;
    pilaPunta = null;
  }
  if (pilaArrivo) carte[inizio].classList.add("arriva");
  pilaArrivo = false;
  davanti(inizio);

  /* La posizione si dà quando la pagina è già nel documento ma il
     browser non l'ha ancora dipinta: nessun salto visibile. */
  queueMicrotask(() => {
    if (!sc.isConnected) return;
    sc.scrollLeft = inizio * PASSO;
    disponi();
  });
  pilaRidisponi = () => { if (sc.isConnected) { larga = 0; disponi(); } };

  return [sc, dove, fila, voce];
}

/* I gesti della carta davanti. Dopo il gesto la pagina si ridisegna:
   la carta che arriva al centro entra con un piccolo movimento, così
   si capisce che è un'altra. */
function azioniPila(o) {
  const fila = azioniGiorno(o);
  fila.querySelectorAll("button").forEach((b) => {
    const gesto = b.onclick;
    b.onclick = () => { pilaArrivo = true; gesto(); };
  });
  return fila;
}

/* Il solo riassunto della pagina: quanti chiedono attenzione e quanti
   sono in tutto. Toccato, apre l'elenco completo con la ricerca. */
function riassunto() {
  const n = orologi.length;
  const girare = orologi.filter(daFarGirare).length;
  const b = el("button", "riassunto");
  if (girare) {
    b.append(el("span", "riassunto-girare", t("pila.daGirare", { n: girare })), el("span", "riassunto-punto", "·"));
  }
  b.append(el("span", null, plurale(n, "orologio_", "orologiPl")));
  const f = el("span", "riassunto-freccia");
  f.innerHTML = icona("su", 16);
  b.append(f);
  b.onclick = () => apriFoglio("elenco", {});
  const box = el("div", "riassunto-box");
  box.append(b);
  return box;
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

  d.append(...pilaCarte(ordinaPerRiposo(orologi)), riassunto());
  return d;
}


/* ------------------------------------------------------------------
   L'elenco, nel foglio.
   La pila serve a decidere cosa mettere; l'elenco a trovare un
   orologio preciso quando sono tanti. In ordine alfabetico, con la
   ricerca, e da qui si aggiunge. La ricerca filtra le righe in posto:
   il campo non perde il fuoco mentre scrivi.
   ------------------------------------------------------------------ */
const senzaAccenti = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

COSTRUTTORI.elenco = {
  classe: "alto",
  disegna(d, f) {
    const corpo = capoFoglio(f, t("coll.titolo") + " · " + orologi.length,
      bottone("chip", t("agg.breve"), "piu", () => avantiFoglio("modulo", {})));

    const cerca = el("input", "campo");
    cerca.type = "search";
    cerca.placeholder = t("el.cerca");
    cerca.setAttribute("aria-label", t("el.cerca"));
    cerca.value = d.filtro || "";
    corpo.append(cerca);

    corpo.append(el("h3", "etichetta piccola elenco-capo", t("el.ordine")));
    const box = el("div", "elenco");
    const righe = [...orologi]
      .sort((a, b) => a.nome.localeCompare(b.nome, locale()))
      .map((o) => {
        const r = rigaOrologio(o);
        r.dataset.cerca = senzaAccenti(o.nome + " " + (o.linea || "") + " " + (o.calibroNome || ""));
        box.append(r);
        return r;
      });
    const nulla = el("p", "nota", t("el.nulla"));
    corpo.append(box, nulla);
    corpo.append(el("p", "piede-soglia", t("piede.soglia", { g: plurale(soglia, "giorno_", "giorniPl") })));

    function filtra() {
      d.filtro = cerca.value;
      const q0 = senzaAccenti(cerca.value.trim());
      let visti = 0;
      righe.forEach((r) => { const si = !q0 || r.dataset.cerca.includes(q0); r.hidden = !si; if (si) visti++; });
      nulla.hidden = visti > 0;
    }
    cerca.oninput = filtra;
    filtra();
  },
};

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
