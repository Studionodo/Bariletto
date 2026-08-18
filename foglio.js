/* ------------------------------------------------------------------
   Il foglio — aggiungere, modificare, eliminare un orologio
   Sale dal basso ed è l'unico posto da cui si scrive un orologio.
   ------------------------------------------------------------------ */

/* ====================== pannello informativo ======================= */
/* Un'iconcina "i" accanto a una voce che ha bisogno di una riga in più
   di quanto lo spazio in pagina permetta. Riusa #velo/#foglio — stessa
   apparizione, stessa chiusura (chiudiScheda, il tasto Esc, il tocco
   fuori) — ma con la classe "corto": nessun modulo, nessuna azione,
   solo un titolo e due o tre righe di spiegazione. */
function apriInfo(titolo, testi) {
  const uscente = q("#velo");
  if (uscente) { if (uscente.classList.contains("su")) return; uscente.remove(); }
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div", "corto"); foglio.id = "foglio";
  const capo = el("div", "capo");
  capo.append(el("span", "capo-titolo", titolo));
  const azioni = el("div", "capo-azioni");
  const x = el("button", "chiudi", t("chiudi")); x.onclick = chiudiScheda;
  azioni.append(x);
  capo.append(azioni);
  foglio.append(capo);
  const corpo = el("div", "foglio-corpo");
  (Array.isArray(testi) ? testi : [testi]).forEach((riga) => {
    corpo.append(el("p", "info-testo", riga));
  });
  foglio.append(corpo);
  velo.append(foglio); document.body.append(velo);
  inerte(true);
  requestAnimationFrame(() => velo.classList.add("su"));
  velo.addEventListener("click", (e) => { if (e.target === velo) chiudiScheda(); });
  addEventListener("keydown", tastoScheda);
}

/* La fabbrica dell'iconcina stessa: un bottone piccolo, sempre uguale,
   che apre il pannello con il titolo e il testo passati. Usata da più
   pagine — costruirla una volta sola evita che ogni schermata reinventi
   la stessa mezza dozzina di righe. */
function infoTocco(titolo, testi, classeExtra) {
  const b = el("button", "info-tocco" + (classeExtra ? " " + classeExtra : ""), "i");
  b.setAttribute("aria-label", t("info.apri", { v: titolo }));
  b.onclick = (e) => { e.stopPropagation(); apriInfo(titolo, testi); };
  return b;
}


/* Stessa impalcatura dell'archivio: una riga in pagina apre tutto qui.
   Il diario cresce di una voce al giorno per sempre — dentro un foglio
   non pesa più sulla lunghezza della pagina due. */
function apriRegistro() {
  const uscente = q("#velo");
  if (uscente) { if (uscente.classList.contains("su")) return; uscente.remove(); }
  modoFoglio = "registro"; bozza = null;
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div"); foglio.id = "foglio";
  velo.append(foglio); document.body.append(velo);
  inerte(true);
  requestAnimationFrame(() => velo.classList.add("su"));
  velo.addEventListener("click", (e) => { if (e.target === velo) chiudiScheda(); });
  addEventListener("keydown", tastoScheda);
  disegnaRegistro();
}

function disegnaRegistro() {
  const f = q("#foglio"); if (!f) return;
  f.innerHTML = "";
  const capo = el("div", "capo");
  capo.append(el("span", "capo-titolo", t("registro")));
  const azioni = el("div", "capo-azioni");
  const chiudi = el("button", "chiudi", t("chiudi"));
  chiudi.onclick = chiudiScheda; azioni.append(chiudi); capo.append(azioni);
  f.append(capo);

  const corpo = el("div", "foglio-corpo");
  const tutte = [...registro].sort((a, b) => b.quando - a.quando);
  if (!tutte.length) {
    corpo.append(el("p", "nota", t("reg.vuoto")));
    f.append(corpo);
    return;
  }
  corpo.append(el("p", "sotto-parete", t("reg.periodo", {
    n: plurale(tutte.length, "voci", "vociPl"),
    da: quando(tutte[tutte.length - 1].quando) })));

  let giorno = null;
  tutte.forEach((v) => {
    const g = new Date(v.quando).toDateString();
    if (g !== giorno) { giorno = g; corpo.append(el("div", "giorno-diario", quando(v.quando))); }

    const r = el("div", "riga fra voce-diario");
    const testo = el("div", "voce-corpo");
    testo.append(el("span", "voce-nome", v.nome || "\u2014"),
                 el("span", "etichetta mini", t(v.azione)));

    /* Il cestino appare solo al secondo tocco: la prima × dice «questa
       riga», il cestino dice «sto per cancellarla davvero». */
    const x = el("button", "togli" + (voceArmata === v.id ? " armato" : ""));
    x.innerHTML = voceArmata === v.id
      ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>'
      : "\u00D7";
    x.setAttribute("aria-label", t(voceArmata === v.id ? "reg.confermaRimuovi" : "reg.rimuovi"));
    x.onclick = () => {
      if (voceArmata !== v.id) {
        voceArmata = v.id; disegnaRegistro();
        setTimeout(() => { if (voceArmata === v.id) { voceArmata = null; disegnaRegistro(); } }, 4000);
        return;
      }
      voceArmata = null;
      togliVoce(v);
    };
    r.append(testo, x);
    corpo.append(r);
  });
  f.append(corpo);
}


/* =================== la collezione: a colpo d'occhio =============== */
/* Il carosello di Oggi ordina per urgenza e scorre di lato: risponde a
   «di chi mi devo occupare», non a «cosa possiedo». Qui è l'opposto —
   alfabetico, tutto scorre in verticale, pensato per scorrere con
   l'occhio invece che per agire. Riusa cartaOrologio(), la stessa carta
   del carosello: stesso linguaggio visivo, un'altra disposizione. */
function apriCollezione() {
  const uscente = q("#velo");
  if (uscente) { if (uscente.classList.contains("su")) return; uscente.remove(); }
  modoFoglio = "collezione"; bozza = null;
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div"); foglio.id = "foglio";
  velo.append(foglio); document.body.append(velo);
  inerte(true);
  requestAnimationFrame(() => velo.classList.add("su"));
  velo.addEventListener("click", (e) => { if (e.target === velo) chiudiScheda(); });
  addEventListener("keydown", tastoScheda);
  disegnaCollezione();
}

function disegnaCollezione() {
  const f = q("#foglio"); if (!f) return;
  f.innerHTML = "";
  const capo = el("div", "capo");
  capo.append(el("span", "capo-titolo", t("coll.titolo")));
  const azioni = el("div", "capo-azioni");
  const agg = el("button", "chiudi forte", t("aggiungi"));
  agg.onclick = () => apriScheda();
  azioni.append(agg);
  const chiudi = el("button", "chiudi", t("chiudi"));
  chiudi.onclick = chiudiScheda; azioni.append(chiudi); capo.append(azioni);
  f.append(capo);

  const corpo = el("div", "foglio-corpo");
  if (!orologi.length) {
    corpo.append(el("p", "nota", t("vuoto.oggi")));
    f.append(corpo);
    return;
  }
  /* Lista verticale, una riga per orologio — lo stesso schema già usato
     per l'archivio dei movimenti, non una griglia a due colonne. Ogni
     altra lista dell'app è impilata; la griglia era l'unica eccezione,
     e leggeva come un'altra cosa invece che come un'altra vista sugli
     stessi dati. */
  const elenco = el("div", "elenco");
  const oggiTs = Date.now();
  ordinaPerBisogno(orologi)
    .slice()
    .sort((a, b) => a.o.nome.localeCompare(b.o.nome))
    .forEach(({ o, b }) => {
      const alPolso = o.ultimoPolso && sameDay(o.ultimoPolso, oggiTs);
      const r = el("button", "lastra riga-piena");
      const pallino = el("span", "pallino");
      pallino.style.background = COLORE[b.stato];
      const c = el("div", "corpo-lastra");
      c.append(el("div", "titolo-lastra", o.nome));
      const sotto = el("div", "sotto-lastra");
      sotto.append(el("span", "etichetta mini", nomeCorto(o.calibroNome)));
      sotto.append(el("span", "punto-sep", "\u00B7"));
      const stato = el("span", "etichetta mini stato");
      stato.textContent = alPolso ? t("oggi.giaMesso") : nomeStato(b.stato);
      stato.style.color = alPolso ? "var(--oro)" : COLORE[b.stato];
      sotto.append(stato);
      c.append(sotto);
      r.append(pallino, c, el("span", "freccia", "\u203A"));
      /* apriScheda si rifiuta di aprirsi sopra un foglio già visibile:
         il tocco non farebbe niente, in silenzio. Si chiude questo,
         poi si apre il dettaglio. */
      r.onclick = () => { chiudiScheda(); setTimeout(() => apriScheda(o, "dettaglio"), 60); };
      elenco.append(r);
    });
  corpo.append(elenco);
  f.append(corpo);
}


/* ====================== la scheda: aggiungere ===================== */
/* Sale dal basso sopra la pagina. Due strade: cerchi il calibro,
   oppure lo dichiari a mano — perché nessun elenco sarà mai completo. */

let bozza = null;

/* Una scheda sola per aggiungere e per modificare: sono la stessa cosa,
   cambia solo se l'orologio esiste già. */
let modoFoglio = "modifica";
/* Quale voce dell'archivio è aperta in questo momento, se c'è. Serve solo
   a ridisegnaTutto() per sapere cosa ridisegnare quando cambia la lingua
   con la scheda già aperta — non è un dato, è un puntatore temporaneo. */
let voceArchivioAperta = null;
let vociArchivio = null;   /* ricerca dentro l'archivio: null = nessun filtro */

/* Il diario intero in un foglio, non in pagina: cresce di una riga al
   giorno per sempre, e in fondo alla pagina unica l'avrebbe allungata
   senza limite. Qui è a un tocco e non pesa su nient'altro. */
/* Sceglie il testo nella lingua corrente, con l'italiano come rete di
   sicurezza finché una scheda non è tradotta. Un solo punto per questa
   regola: ogni posto che legge l'archivio la usa, invece di ripetere lo
   stesso "LINGUA === 'en' ? v.x_en || v.x : v.x" in quattro punti diversi
   e rischiare che uno resti indietro quando arriva la traduzione. */
function fogliaTesto(v, campo) {
  if (LINGUA === "en" && v[campo + "_en"]) return v[campo + "_en"];
  return v[campo];
}
function fogliaPaese(v) {
  return LINGUA === "en" ? v.paese_en : v.paese;
}

/* L'archivio: stessa impalcatura del registro, elenco più scheda. */
function apriArchivio(filtro) {
  const uscente = q("#velo");
  if (uscente) { if (uscente.classList.contains("su")) return; uscente.remove(); }
  modoFoglio = "archivio"; bozza = null; vociArchivio = filtro || null;
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div"); foglio.id = "foglio";
  velo.append(foglio); document.body.append(velo);
  inerte(true);
  requestAnimationFrame(() => velo.classList.add("su"));
  velo.addEventListener("click", (e) => { if (e.target === velo) chiudiScheda(); });
  addEventListener("keydown", tastoScheda);
  disegnaArchivio();
}

function disegnaArchivio() {
  const f = q("#foglio"); if (!f) return;
  f.innerHTML = "";
  const capo = el("div", "capo");
  capo.append(el("span", "capo-titolo", t("arch.titolo")));
  const azioni = el("div", "capo-azioni");
  const chiudi = el("button", "chiudi", t("chiudi"));
  chiudi.onclick = chiudiScheda; azioni.append(chiudi); capo.append(azioni);
  f.append(capo);

  const corpo = el("div", "foglio-corpo");
  const cerca = el("input", "campo");
  cerca.type = "search"; cerca.placeholder = t("arch.cerca");
  cerca.value = vociArchivio || "";
  cerca.addEventListener("input", () => { vociArchivio = cerca.value; ridisegnaListaArchivio(); });
  corpo.append(cerca);
  corpo.append(el("div", "elenco archivio-elenco"));
  f.append(corpo);
  ridisegnaListaArchivio();
  /* Niente focus automatico. Prima il campo prendeva il fuoco da solo
     260ms dopo l'apertura, e su telefono questo tira su la tastiera
     subito — nel modale centrato, che deve stare fermo al centro, la
     tastiera che si apre da sola sposta tutto senza che l'utente
     l'abbia chiesto. Ora il fuoco arriva solo quando l'utente tocca
     il campo, come dovrebbe essere in un popup di lettura. */
}

function ridisegnaListaArchivio() {
  const box = q(".archivio-elenco"); if (!box) return;
  box.innerHTML = "";
  const q0 = (vociArchivio || "").trim().toLowerCase();
  const filtrate = ARCHIVIO.filter((v) =>
    !q0 || v.nome.toLowerCase().includes(q0) || v.marca.toLowerCase().includes(q0)
    || v.paese.toLowerCase().includes(q0) || v.paese_en.toLowerCase().includes(q0));
  if (!filtrate.length) { box.append(el("p", "nota", t("arch.nulla"))); return; }
  let paese = null;
  filtrate
    .sort((a, b) => fogliaPaese(a).localeCompare(fogliaPaese(b)) || a.nome.localeCompare(b.nome))
    .forEach((v) => {
      const pv = fogliaPaese(v);
      if (pv !== paese) { paese = pv; box.append(el("div", "giorno-diario", pv)); }
      const r = el("button", "lastra riga-piena");
      const c = el("div", "corpo-lastra");
      c.append(el("div", "titolo-lastra", v.nome), el("span", "etichetta mini", v.marca));
      r.append(el("span", "pallino archivio-pallino"), c, el("span", "freccia", "\u203A"));
      r.onclick = () => apriVoceArchivio(v.id);
      box.append(r);
    });
}

function apriVoceArchivio(id) {
  const v = ARCHIVIO.find((x) => x.id === id); if (!v) return;
  const f = q("#foglio"); if (!f) return;
  modoFoglio = "voce-archivio";
  voceArchivioAperta = id;
  f.innerHTML = "";
  const capo = el("div", "capo");
  /* Il nome del calibro sta nel capo, non solo nel corpo: scorrendo una
     scheda lunga si perdeva di vista quale si stava leggendo. */
  capo.append(el("span", "capo-titolo", v.nome));
  const azioni = el("div", "capo-azioni");
  const indietro = el("button", "chiudi forte", t("arch.indietro"));
  indietro.onclick = () => { modoFoglio = "archivio"; voceArchivioAperta = null; disegnaArchivio(); };
  azioni.append(indietro);
  const chiudi = el("button", "chiudi", t("chiudi"));
  chiudi.onclick = chiudiScheda; azioni.append(chiudi);
  capo.append(azioni);
  f.append(capo);

  const corpo = el("div", "foglio-corpo voce-archivio-corpo");
  corpo.append(el("h2", "dett-nome", v.nome));
  corpo.append(el("p", "dett-linea", v.marca + " \u00B7 " + fogliaPaese(v)));

  const sezione = (etichetta, testo) => {
    corpo.append(el("span", "gruppo", etichetta));
    corpo.append(el("p", "prosa-archivio", testo));
  };
  sezione(t("arch.fatto"), fogliaTesto(v, "fatto"));
  sezione(t("arch.cura"), fogliaTesto(v, "cura"));
  sezione(t("arch.normale"), fogliaTesto(v, "normale"));

  corpo.append(el("span", "gruppo", t("arch.fonti")));
  const lf = el("div", "fonti-archivio");
  v.fonti.forEach((u) => {
    const a = el("a", "quieta fonte-link", new URL(u).hostname.replace("www.",""));
    a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
    lf.append(a);
  });
  corpo.append(lf);
  f.append(corpo);
}

/* Il registro non è più un foglio a comparsa: ha una pagina sua,
   la seconda, dove può crescere senza limite. Le funzioni che lo
   disegnavano qui sono passate in altro.js. */

function apriScheda(esistente, modo) {
  /* Due tocchi rapidi aprivano due fogli sovrapposti. Ma se il foglio
     precedente sta già scomparendo non c'è niente da proteggere: lo tolgo
     subito, altrimenti resta una finestra morta di 380ms in cui il tocco
     non fa niente. */
  const uscente = q("#velo");
  if (uscente) {
    if (uscente.classList.contains("su")) return;
    uscente.remove();
  }
  /* Se il calibro salvato non esiste più nel database — record di una
     versione precedente, o voce rimossa — la scheda passa alla
     dichiarazione a mano riempita con quello che l'orologio già sa.
     Prima cercava un calibro inesistente e la scheda si bloccava. */
  const noto = esistente && esistente.calibro !== "manuale"
    && (risolviCalibro(esistente.calibro) || risolviFamiglia(esistente.calibro));

  const suoi = esistente ? {
    tipo: esistente.tipo, mano: esistente.mano, arresto: esistente.arresto,
    data: esistente.data, giorno: esistente.giorno, indiretti: esistente.indiretti,
    crono: !!esistente.crono, tourbillon: !!esistente.tourbillon,
    riserva: esistente.riserva, ah: esistente.ah,
  } : null;

  /* Due modi nello stesso foglio: «dettaglio» legge, «modifica» scrive.
     Toccando una riga si entra in lettura; da lì si passa alla modifica. */
  modoFoglio = modo === "dettaglio" ? "dettaglio" : "modifica";

  bozza = esistente
    ? { id: esistente.id, nome: esistente.nome, linea: esistente.linea,
        calibro: noto ? esistente.calibro : null,
        manuale: noto ? null : suoi,
        conferma: false }
    : { nome: "", linea: "", calibro: null, manuale: null, conferma: false };
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div"); foglio.id = "foglio";
  velo.append(foglio);
  document.body.append(velo);
  requestAnimationFrame(() => velo.classList.add("su"));
  velo.addEventListener("pointerdown", (e) => { if (e.target === velo) chiudiScheda(); });

  /* Con la scheda aperta, tutto il resto esce dal percorso di tabulazione:
     è il modo più semplice di trattenere il fuoco, e non serve altro codice. */
  inerte(true);
  addEventListener("keydown", tastoScheda);

  disegnaScheda();
  const primo = foglio.querySelector(".campo");
  if (primo && !esistente) setTimeout(() => primo.focus(), 420);
}

/* Con il foglio aperto, tutto il resto esce dal percorso di tabulazione.
   Prima erano #pareti e #indici, che con la pagina unica non esistono
   più: un solo posto da aggiornare invece di quattro chiamate sparse. */
function inerte(si) {
  ["#ponte", "#testata", "#indice"].forEach((s) => {
    const n = q(s); if (!n) return;
    if (si) n.setAttribute("inert", ""); else n.removeAttribute("inert");
  });
}

function tastoScheda(e) {
  if (e.key === "Escape") { e.preventDefault(); chiudiScheda(); }
}

function chiudiScheda() {
  const v = q("#velo"); if (!v) return;
  removeEventListener("keydown", tastoScheda);
  inerte(false);
  v.classList.remove("su");
  /* Due chiusure ravvicinate schedulavano due azzeramenti, e il secondo
     cadeva addosso alla bozza di una scheda appena riaperta. Azzero solo
     se nel frattempo non ne è nata un'altra. */
  setTimeout(() => { v.remove(); if (!q("#velo")) { bozza = null; voceArchivioAperta = null; } }, 380);
}

function disegnaScheda(filtro = "") {
  const f = q("#foglio"); if (!f) return;
  f.innerHTML = "";

  const capo = el("div", "capo");
  /* Terzo stato oltre a dettaglio/titolo: la ricerca dedicata, raggiunta
     da dentro il modulo. Stesso schema già usato per «indietro» dentro
     l'archivio — un secondo schermo nello stesso foglio, non un nuovo
     popup che si apre sopra. */
  capo.append(el("span", "capo-titolo",
    t(modoFoglio === "dettaglio" ? "s.dettaglio"
      : modoFoglio === "cerca-calibro" ? "s.titoloRicerca"
      : bozza.id ? "s.modifica" : "s.titolo")));
  const azioni = el("div", "capo-azioni");
  if (modoFoglio === "dettaglio") {
    /* «Modifica» porta da qualche parte, «Chiudi» no: l'oro distingue
       il comando che apre da quello che se ne va. */
    const m = el("button", "chiudi forte", t("s.modificaVoce"));
    m.onclick = () => { modoFoglio = "modifica"; disegnaScheda(); };
    azioni.append(m);
  }
  if (modoFoglio === "cerca-calibro") {
    const ind = el("button", "chiudi forte", t("arch.indietro"));
    ind.onclick = () => { modoFoglio = "modifica"; disegnaScheda(); };
    azioni.append(ind);
  }
  const x = el("button", "chiudi", t("chiudi")); x.onclick = chiudiScheda;
  azioni.append(x);
  capo.append(azioni);
  f.append(capo);

  const corpo = el("div", "foglio-corpo");
  f.append(corpo);

  if (modoFoglio === "dettaglio") { schedaDettaglio(corpo); f.append(piedeDettaglio()); return; }
  if (modoFoglio === "cerca-calibro") { schedaCercaCalibro(corpo, filtro); return; }

  corpo.append(el("span", "gruppo", t("s.identita")));
  corpo.append(campo(t("s.nome"), t("s.nomeAiuto"), bozza.nome, 60,
                     (v) => { bozza.nome = v; aggiornaSalva(); }));
  corpo.append(campo(t("s.linea"), t("s.lineaAiuto"), bozza.linea, 60,
                     (v) => { bozza.linea = v; }, t("s.facoltativo")));

  if (bozza.manuale) { schedaManuale(corpo); }
  else if (bozza.calibro) { schedaScelto(corpo); }
  else { schedaRicerca(corpo, filtro); }

  /* Il salvataggio sta in un piede fisso: con la tastiera aperta e un
     elenco lungo, un bottone in fondo al foglio non si raggiunge più. */
  const piede = el("div", "foglio-piede");
  piede.append(bottoneSalva());
  f.append(piede);
}

/* ---------- il modo lettura: gesti, storia e azione del giorno --------
   Era una schermata a sé, ferma sull'ultimo orologio toccato: arrivandoci
   con uno scorrimento non sapevi mai cosa avresti trovato. Qui è sempre
   l'orologio che hai appena toccato. */
function schedaDettaglio(corpo) {
  const o = orologi.find((x) => x.id === bozza.id);
  if (!o) { chiudiScheda(); return; }
  const b = bisogno(o);

  const capo = el("div", "dett-capo");
  capo.append(el("h2", "dett-nome", o.nome));
  if (o.linea) capo.append(el("p", "dett-linea", o.linea));
  const st = el("span", "etichetta mini stato dett-stato", nomeStato(b.stato));
  st.style.color = COLORE[b.stato];
  capo.append(st);
  corpo.append(capo);

  const dl = el("dl", "spec");
  const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
  riga(t("st.dati"), nomeCorto(o.calibroNome));
  riga(t("st.riserva"), etichettaRiserva(o, true));
  if (o.ah) riga(t("ah"), o.ah.toLocaleString(locale()));
  corpo.append(dl);

  /* Il ponte fra la scheda dell'orologio e l'archivio: le istruzioni brevi
     che l'app dà ogni giorno sono un riassunto, l'archivio è dove si va
     quando quel riassunto fa venire una domanda. */
  const voce = trovaVoceArchivio(o.calibro);
  if (voce) {
    const link = el("button", "quieta link-centro archivio-rimando", t("arch.leggi"));
    link.onclick = () => apriVoceArchivio(voce.id);
    corpo.append(link);
  }

  corpo.append(el("span", "gruppo", t("st.gesti")));
  const box = el("div");
  gesti(o).forEach((testo, i) => {
    const r = el("div", "riga");
    r.append(el("span", "etichetta mini num-gesto", String(i + 1).padStart(2, "0")),
             el("p", null, testo));
    box.append(r);
  });
  corpo.append(box);

  corpo.append(el("span", "gruppo", t("g.storia")));
  const ult = el("div", "riga fra senza-filo");
  ult.append(el("span", "etichetta mini", t("g.storia")),
             el("span", "etichetta mini", quando(o.ultimoPolso)));
  corpo.append(ult);
  const suo = [...registro].filter((v) => v.orologio === o.id)
                           .sort((a, b) => b.quando - a.quando);
  suo.slice(0, 5).forEach((v) => {
    const r = el("div", "riga fra");
    r.append(el("span", "etichetta mini", t(v.azione)),
             el("span", "etichetta mini", quando(v.quando)));
    corpo.append(r);
  });
}

function piedeDettaglio() {
  const involucro = el("div");
  const piede = el("div", "foglio-piede due");
  const o = orologi.find((x) => x.id === bozza.id);

  /* L'azione del giorno vive anche qui: fusa Collezione dentro Oggi, la
     riga apre la scheda, e da lì si deve poter registrare — altrimenti
     ogni orologio che non sia il proposto diventa irraggiungibile. */
  const messoOggi = o && o.ultimoPolso && sameDay(o.ultimoPolso, Date.now());
  const mod = el("button", "azione" + (messoOggi ? " secondaria" : ""),
                 t(messoOggi ? "annulla" : "messo"));
  mod.onclick = () => {
    if (!o) return;
    chiudiScheda();
    setTimeout(() => (messoOggi ? annullaOggi(o) : segna(o)), 60);
  };
  const eli = el("button", "quieta pericolo-quieto", t("elimina"));
  eli.onclick = () => {
    if (!bozza.conferma) { bozza.conferma = true; disegnaScheda(); return; }
    eliminaOrologio();
  };
  if (bozza.conferma) {
    eli.textContent = t("elimina.conferma"); eli.classList.add("armato");
    /* Chi elimina dal dettaglio — il percorso vero, non quello di
       modifica — non vedeva mai questo avviso: la conferma scattava
       muta. Ora la cascata sul registro si dice prima del secondo
       tocco, non solo nel modulo di modifica dove quasi nessuno passa
       per eliminare. */
    piede.append(el("p", "nota nota-elimina", t("elimina.nota")));
  }
  piede.append(eli, mod);
  involucro.append(piede);
  return involucro;
}

/* Etichetta sopra, non solo dentro: il segnaposto sparisce appena scrivi
   e resti senza sapere cosa stavi compilando. */
function campo(etichetta, aiuto, valore, max, onCambia, nota) {
  const w = el("label", "campo-blocco");
  const cap = el("span", "campo-etichetta");
  cap.append(document.createTextNode(etichetta));
  if (nota) cap.append(el("em", null, nota));
  const i = el("input", "campo");
  i.placeholder = aiuto; i.value = valore || ""; i.maxLength = max;
  i.oninput = () => onCambia(i.value);
  w.append(cap, i);
  return w;
}

/* La ricerca compatta, dentro il modulo. Prima qui viveva l'elenco
   intero — fino a 40 righe, che spingevano "Non lo trovi?" e il
   bottone Salva fuori dallo schermo, a volte del tutto invisibili.
   Ora il campo resta un campo, e sotto compaiono al massimo quattro
   suggerimenti: abbastanza per i casi comuni (scrivi "7s26", ne esce
   uno solo), mai abbastanza da invadere il resto del modulo. Per
   sfogliare il catalogo intero c'è un secondo schermo dedicato,
   raggiunto con un tocco — non più mescolato qui dentro. */
function schedaRicerca(f, filtro) {
  f.append(el("span", "gruppo", t("s.movimento")));

  const cerca = el("input", "campo");
  cerca.placeholder = t("s.cerca"); cerca.value = filtro;
  f.append(cerca);

  const esiti = el("div", "esiti compatti");
  f.append(esiti);
  const sotto = el("div", "dopo-corto esiti-link");
  f.append(sotto);

  function riempi(testo) {
    esiti.innerHTML = ""; sotto.innerHTML = "";
    const trovati = testo.trim() ? cercaCalibri(testo) : [];

    if (trovati.length) {
      esiti.append(el("span", "etichetta mini sotto-etichetta-ricerca", t("s.suggerimenti")));
      trovati.slice(0, 4).forEach((c) => {
        const b = el("button", "lastra");
        const corpo = el("div", "corpo-lastra");
        corpo.append(el("div", "titolo-lastra", c.nome),
                     el("span", "etichetta mini", c.fam ? t("s.famiglia") : c.sotto));
        b.append(corpo);
        b.onclick = () => { bozza.calibro = c.id; disegnaScheda(); };
        esiti.append(b);
      });
    }

    /* Due link, sempre presenti, mai una sezione che invade: sfogliare
       tutto il catalogo o dichiarare il movimento a mano restano a un
       tocco di distanza senza occupare spazio quando non servono. */
    const vediTutti = el("button", "quieta stretto",
      trovati.length > 4 ? t("s.altriRisultati") : t("s.cercaCatalogo", { n: CALIBRI.length }));
    vediTutti.onclick = () => { modoFoglio = "cerca-calibro"; disegnaScheda(cerca.value); };
    sotto.append(vediTutti);

    const man = el("button", "quieta stretto", t("s.manuale"));
    man.onclick = () => {
      bozza.manuale = { tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, indiretti: false, crono: false, tourbillon: false, riserva: 41, ah: 21600 };
      bozza.manualeTesto = cerca.value.trim();
      disegnaScheda();
    };
    sotto.append(man);
  }
  cerca.oninput = () => riempi(cerca.value);
  riempi(filtro);
}

/* La ricerca vera, a schermo intero: stesso elenco di prima (fino a 40
   righe) e la stessa via d'uscita per dichiarare a mano, ma qui hanno
   tutto lo spazio del foglio invece di doverlo strappare al resto del
   modulo. Si raggiunge dal campo compatto, si torna indietro con lo
   stesso "Indietro" già usato nell'archivio. */
function schedaCercaCalibro(f, filtro) {
  const cerca = el("input", "campo");
  cerca.placeholder = t("s.cerca"); cerca.value = filtro;
  f.append(cerca);

  const esiti = el("div", "esiti");
  f.append(esiti);

  function riempi(testo) {
    esiti.innerHTML = "";
    cercaCalibri(testo).forEach((c) => {
      const b = el("button", "lastra");
      const corpo = el("div", "corpo-lastra");
      corpo.append(el("div", "titolo-lastra", c.nome),
                   el("span", "etichetta mini", c.fam ? t("s.famiglia") : c.sotto));
      b.append(corpo);
      b.onclick = () => { bozza.calibro = c.id; modoFoglio = "modifica"; disegnaScheda(); };
      esiti.append(b);
    });
  }
  cerca.oninput = () => riempi(cerca.value);
  riempi(filtro);

  const aiuto = el("section", "aiuto");
  aiuto.append(el("span", "gruppo", t("s.nonTrovi")));
  aiuto.append(el("p", "nota", t("s.rimarchio")));

  const man = el("button", "azione secondaria larga", t("s.manuale"));
  man.onclick = () => {
    bozza.manuale = { tipo: "automatico", mano: true, arresto: true, data: true, giorno: false, indiretti: false, crono: false, tourbillon: false, riserva: 41, ah: 21600 };
    bozza.manualeTesto = cerca.value.trim();
    modoFoglio = "modifica";
    disegnaScheda();
  };
  aiuto.append(man);
  f.append(aiuto);
}

function schedaScelto(f) {
  const c = risolviCalibro(bozza.calibro) || risolviFamiglia(bozza.calibro);
  /* Seconda difesa: se sparisse comunque, si torna all'elenco invece di
     rompersi. */
  if (!c) { bozza.calibro = null; return schedaRicerca(f, ""); }
  f.append(el("span", "gruppo", t("s.movimento")));

  const box = el("div", "scelto");
  box.append(el("div", "scelto-nome", c.nome));

  /* Gli stessi fatti di prima, ma come dati incolonnati invece che come
     tre frasi sciolte: si leggono in un colpo d'occhio e occupano metà. */
  const dl = el("dl", "spec");
  const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
  riga(t("st.riserva"), etichettaRiserva(c, true));
  if (c.ah) riga(t("ah"), c.ah.toLocaleString(locale()));
  riga(t("s.carica"), t(c.mano ? "si" : "no"));
  riga(t("s.secondi"), t(c.arresto ? "si" : "no"));
  riga(t("s.calendario"), t(c.data ? (c.giorno ? "s.giornoData" : "s.soloData") : "s.noCal"));
  box.append(dl);

  const fo = el("p", "fonte fonte-" + c.fonte);
  fo.append(el("span", "pallino-fonte"), el("span", null, t("fonte." + c.fonte)));
  box.append(fo);
  f.append(box);

  const cambia = el("button", "quieta dopo-corto", t("s.cambia"));
  cambia.onclick = () => { bozza.calibro = null; disegnaScheda(); };
  f.append(cambia);
  if (bozza.id) f.append(bottoneElimina());
}

function schedaManuale(f) {
  const m = bozza.manuale;
  f.append(el("div", "sepa"), el("span", "etichetta mini", t("s.dichiara")));

  const tipi = ["automatico", "manuale", "cronografo", "ecodrive", "kinetic", "springdrive", "quarzo", "elettrico", "diapason"];
  const fila = el("div", "scelte");
  tipi.forEach((id) => {
    const b = el("button", "scelta" + (m.tipo === id ? " accesa" : ""), t("t." + id));
    b.onclick = () => { m.tipo = id; disegnaScheda(); };
    fila.append(b);
  });
  f.append(fila);

  /* La riserva: è il campo che fa funzionare tutto il resto. */
  const gruppo = el("div", "riserva-campo");
  /* Elettrico e diapason sono a batteria come ecodrive/kinetic/quarzo:
     la riserva si conta in mesi o anni, non in ore — chiedere "17520"
     invece di "730 giorni" sarebbe un campo inutilizzabile. */
  const inG = m.tipo === "ecodrive" || m.tipo === "kinetic" || m.tipo === "quarzo"
    || m.tipo === "elettrico" || m.tipo === "diapason";
  const et = el("span", "etichetta mini", t(inG ? "s.riservaGiorni" : "s.riservaOre"));
  const inp = el("input", "campo numero");
  inp.type = "number"; inp.inputMode = "numeric"; inp.min = "1";
  const inGiorni = inG;
  inp.value = inGiorni ? Math.round(m.riserva / 24) : m.riserva;
  inp.oninput = () => { m.riserva = Math.max(1, Number(inp.value) || 1) * (inGiorni ? 24 : 1); };
  gruppo.append(et, inp);
  f.append(gruppo);
  f.append(el("p", "nota", t("s.nota")));

  /* crono è ortogonale al tipo — un quarzo può avere i pulsanti del
     cronografo quanto un automatico (7T92, VK63, i Peacock al quarzo
     già in archivio). Per questo sta fuori dal blocco sotto: quel
     blocco esclude proprio ecodrive/kinetic/quarzo, ed è lì che il
     toggle crono servirebbe di più. Prima non c'era alcun modo di
     dichiarare a mano un cronografo al quarzo con questo tratto. */
  const rCrono = el("button", "interruttore" + (m.crono ? " acceso" : ""));
  rCrono.append(el("span", null, t("s.crono")), el("span", "pallina"));
  rCrono.onclick = () => { m.crono = !m.crono; disegnaScheda(); };
  f.append(rCrono);

  if (m.tipo !== "ecodrive" && m.tipo !== "kinetic" && m.tipo !== "quarzo") {
    [["mano","s.mano"],["arresto","s.arrestoLungo"],["data","s.data"],
     ["giorno","s.giorno"],["indiretti","s.indiretti"],["tourbillon","s.tourbillon"]].forEach(([k, chiave]) => {
      const r = el("button", "interruttore" + (m[k] ? " acceso" : ""));
      r.append(el("span", null, t(chiave)), el("span", "pallina"));
      r.onclick = () => { m[k] = !m[k]; disegnaScheda(); };
      f.append(r);
    });
  }

  const back = el("button", "quieta dopo-corto", t("s.elenco"));
  back.onclick = () => { bozza.manuale = null; disegnaScheda(); };
  f.append(back);
  if (bozza.id) f.append(bottoneElimina());
}

function bottoneSalva() {
  const b = el("button", "azione", t(bozza.id ? "s.salvaMod" : "s.salva"));
  b.id = "salva";
  b.disabled = !bozza.nome.trim();
  b.onclick = salvaBozza;
  return b;
}

function bottoneElimina() {
  const box = el("div", "blocco-elimina");
  box.append(el("div", "sepa"));
  const b = el("button", "pericolo" + (bozza.conferma ? " armato" : ""),
               t(bozza.conferma ? "elimina.conferma" : "elimina"));
  b.onclick = () => {
    if (!bozza.conferma) { bozza.conferma = true; disegnaScheda(); setTimeout(() => { if (bozza && q("#foglio")) { bozza.conferma = false; disegnaScheda(); } }, 4000); return; }
    eliminaOrologio();
  };
  box.append(b, el("p", "nota", t("elimina.nota")));
  return box;
}

async function eliminaOrologioOra() {
  if (!bozza || !bozza.id) return;
  const id = bozza.id;
  await cancella("orologi", id);
  /* Le voci di registro di questo orologio se ne vanno con lui: prima
     restavano — era una scelta dichiarata, «Le voci già nel Registro
     restano» — ma vista in pratica confondeva più di quanto aiutasse.
     Cancellarle una per una invece di svuotare tutto il deposito: solo
     quelle di questo id, il resto del diario non si tocca. */
  const daTogliere = registro.filter((v) => v.orologio === id);
  for (const v of daTogliere) await cancella("registro", v.id);

  orologi = await leggiTutti("orologi");
  registro = await leggiTutti("registro");
  if (scelto === id) scelto = null;
  chiudiScheda();
  disegna();
}

/* Anche scrivere e cancellare passano dal cancello: fra il tocco e il
   ridisegno il bottone resta vivo, e due tocchi creavano due orologi. */
const eliminaOrologio = () => unaVolta(eliminaOrologioOra);
const salvaBozza      = () => unaVolta(salvaBozzaOra);

function aggiornaSalva() {
  const b = q("#salva"); if (b) b.disabled = !bozza.nome.trim();
}

async function salvaBozzaOra() {
  if (!bozza) return;
  const vecchio = bozza.id ? orologi.find((x) => x.id === bozza.id) : null;
  let o;
  if (bozza.manuale) {
    const m = bozza.manuale;
    /* Prima il testo digitato nella ricerca spariva nel nulla appena si
       toccava "non lo trovo": qui lo si tiene, e diventa il nome del
       movimento invece della frase generica — se l'utente aveva scritto
       qualcosa, probabilmente sapeva già cosa fosse. */
    o = {
      id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: bozza.nome.trim(), linea: bozza.linea.trim(),
      calibro: "manuale", calibroNome: bozza.manualeTesto || t("s.movDichiarato"),
      tipo: m.tipo, mano: m.mano, arresto: m.arresto, data: m.data,
      giorno: m.giorno, indiretti: m.indiretti, crono: !!m.crono, tourbillon: !!m.tourbillon,
      riserva: m.riserva, ah: m.ah,
      ultimoPolso: null, ultimaLuce: null, ultimoCrono: null, ultimaCarica: null,
    };
  } else {
    o = daCalibro(bozza.calibro, bozza.nome.trim(), bozza.linea.trim());
  }
  /* Modificando, l'orologio resta lo stesso: id e date non si toccano. */
  if (vecchio) {
    o.id = vecchio.id;
    o.ultimoPolso = vecchio.ultimoPolso;
    o.ultimaLuce = vecchio.ultimaLuce;
    o.ultimoCrono = vecchio.ultimoCrono;
    o.ultimaCarica = vecchio.ultimaCarica;
  }
  await salva("orologi", o);
  orologi = await leggiTutti("orologi");
  chiudiScheda();
  scelto = o.id;
  disegna();
}
