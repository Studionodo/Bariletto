/* ------------------------------------------------------------------
   La scheda di un orologio, il modulo per aggiungerlo o modificarlo,
   la ricerca del calibro e la voce d'archivio.
   Tutte schermate del foglio: si registrano in COSTRUTTORI.
   ------------------------------------------------------------------ */

const trovaOrologio = (id) => orologi.find((x) => x.id === id);
const GIORNO_MS = 86400000;

/* Date parlate: oggi, ieri, N giorni fa, poi la data piena. */
function quando(ts) {
  if (ts == null) return t("g.mai");
  const g = giorniCalendario(ts);
  if (g <= 0) return t("g.oggi");
  if (g === 1) return t("g.ieri");
  if (g < 60) return t("g.faGiorni", { g: plurale(g, "giorno_", "giorniPl") });
  return new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
}
const dataBreve = (ts) => new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "short" });

/* Un orologio si misura se ha un battito da ascoltare: niente quarzo,
   niente Spring Drive, niente movimenti a batteria. */
const misurabile = (o) => o.ah > 0 && !["quarzo", "elettrico", "diapason", "springdrive", "ecodrive", "kinetic"].includes(o.tipo);
const segnoMarcia = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });


/* =========================== la scheda =========================== */

COSTRUTTORI.orologio = {
  classe: "alto",
  disegna(d, f) {
    const o = trovaOrologio(d.id);
    if (!o) return false;
    const mod = bottone("chip", t("modifica"), "matita", () => avantiFoglio("modulo", { id: o.id }));
    const corpo = capoFoglio(f, "", mod);

    /* Chi è. */
    const capo = el("div", "scheda-capo");
    capo.append(el("h1", "scheda-nome", o.nome));
    if (o.linea) capo.append(el("p", "scheda-linea", o.linea));
    capo.append(el("span", "etichetta-calibro", nomeCorto(o.calibroNome)));
    corpo.append(capo);

    /* Tre tessere: quando l'ultima volta al polso, come sta la carica,
       quante volte negli ultimi novanta giorni. */
    const tessere = el("div", "tessere");
    const tessera = (etichetta, valore, colore) => {
      const b = el("div", "tessera");
      b.append(el("span", "etichetta", etichetta));
      const v = el("span", "tessera-valore", valore);
      if (colore) v.style.color = colore;
      b.append(v);
      tessere.append(b);
    };
    const giorniPolso = giorniIndossati(o.id);
    tessera(t("sch.ultimo"), alPolsoOggi(o) ? t("g.oggi") : quando(o.ultimoPolso));
    const sc = statoCarica(o);
    tessera(t("sch.carica"), sc.testo, sc.colore);
    tessera(t("sch.novanta"), String(giorniPolso.filter((g) => g >= inizioGiorno(Date.now()) - 89 * GIORNO_MS).length));
    corpo.append(tessere);

    /* I gesti. */
    corpo.append(azioniScheda(o, d));

    /* Il calendario del polso. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("sch.calendario")));
    corpo.append(calendarioPolso(giorniPolso));
    corpo.append(storia(o, d));

    /* La marcia, col cronocomparatore. */
    if (misurabile(o)) corpo.append(sezioneMarcia(o));

    /* Il movimento: dati, gesti di cura, la scheda d'archivio. */
    corpo.append(sezioneMovimento(o));

    /* Manutenzione: solo se c'è qualcosa da dire. */
    const prossima = prossimaRevisione(o);
    if (o.dataAcquisto || o.ultimaRevisione) {
      corpo.append(el("h2", "etichetta sezione-titolo", t("s.manutenzione")));
      const dl = el("dl", "spec");
      const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
      if (o.dataAcquisto) riga(t("s.acquisto"), new Date(o.dataAcquisto).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" }));
      if (o.ultimaRevisione) riga(t("s.revisione"), new Date(o.ultimaRevisione).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" }));
      if (prossima != null) riga(t("st.prossimaRevisione"), t("st.revisioneCirca", { anno: new Date(prossima).getFullYear() }));
      corpo.append(dl);
      if (prossima != null) corpo.append(el("p", "nota", t("nota.revisione")));
    }
  },
};

/* I giorni in cui è stato al polso, come inizio del giorno. */
function giorniIndossati(id) {
  const s = new Set(registro.filter((v) => v.orologio === id && v.azione === "reg.portato")
                            .map((v) => inizioGiorno(v.quando)));
  return [...s].sort((a, b) => b - a);
}

function azioniScheda(o, d) {
  const box = el("div", "scheda-azioni");
  const fila = el("div", "fila-azioni");
  const puoCaricare = o.mano || o.tipo === "manuale";
  if (alPolsoOggi(o)) {
    fila.append(bottone("bottone secondario largo", t("annullaOggi"), null, () => annullaOggi(o)));
  } else {
    if (puoCaricare) {
      const caricatoOggi = o.ultimaCarica != null && giorniCalendario(o.ultimaCarica) === 0;
      const c = bottone("bottone secondario", t(caricatoOggi ? "caricatoOggi" : "caricato"), "corona", () => segnaCarica(o));
      c.disabled = caricatoOggi;
      fila.append(c);
    }
    fila.append(bottone("bottone primario" + (puoCaricare ? "" : " largo"), t("indossato"), "polso", () => segna(o)));
  }
  box.append(fila);

  /* Indossato un altro giorno: te ne ricordi dopo. */
  if (!d.altroGiorno) {
    box.append(bottone("quieto", t("sch.altroGiorno"), null, () => { d.altroGiorno = true; disegnaFoglio(); }));
  } else {
    const riga = el("div", "altro-giorno");
    const inp = el("input", "campo");
    inp.type = "date";
    const ieri = new Date(Date.now() - GIORNO_MS);
    inp.max = dataInput(Date.now());
    inp.value = dataInput(ieri.getTime());
    const ok = bottone("bottone secondario", t("sch.segna"), null, () => {
      const ts = dataInputATimestamp(inp.value);
      if (ts == null || ts > Date.now() + 1) return;
      d.altroGiorno = false;
      /* Mezzogiorno di quel giorno: oggi stesso vale l'ora vera. */
      segna(o, sameDay(ts, Date.now()) ? Date.now() : ts);
    });
    const no = bottone("quieto", t("lascia"), null, () => { d.altroGiorno = false; disegnaFoglio(); });
    riga.append(inp, ok, no);
    box.append(riga);
  }

  /* Il cronografo si segna solo se lo dici tu. */
  if (o.tipo === "cronografo") {
    const fatto = o.ultimoCrono != null && giorniCalendario(o.ultimoCrono) === 0;
    const c = bottone("quieto", t(fatto ? "crono.segnato" : "crono.fatto"), null, () => segnaCrono(o));
    c.disabled = fatto;
    box.append(c);
  }
  return box;
}

/* Dodici settimane in una griglia, una colonna per settimana. Un punto
   pieno è un giorno al polso. Si legge in un colpo d'occhio se un
   orologio lo porti o lo tieni per affetto. */
function calendarioPolso(giorni) {
  const insieme = new Set(giorni);
  const oggi = inizioGiorno(Date.now());
  const dow = (new Date(oggi).getDay() + 6) % 7;     // lunedì = 0
  const inizio = oggi - (dow + 7 * 11) * GIORNO_MS;   // lunedì di 11 settimane fa
  const g = el("div", "calendario");
  g.setAttribute("role", "img");
  let conta = 0;
  for (let i = 0; i < 84; i++) {
    const giorno = inizioGiorno(inizio + i * GIORNO_MS + 3600000 * 3);
    const c = el("span", "cella");
    if (giorno > oggi) c.classList.add("futuro");
    else if (insieme.has(giorno)) { c.classList.add("pieno"); conta++; }
    if (giorno === oggi) c.classList.add("oggi");
    g.append(c);
  }
  g.setAttribute("aria-label", t("sch.calendarioDetto", { n: conta }));
  const box = el("div", "calendario-box");
  box.append(g, el("p", "nota", t("sch.calendarioNota", { n: plurale(conta, "giorno_", "giorniPl") })));
  return box;
}

/* Le voci di questo orologio: indossato, caricato, cronografo. Ogni
   voce si toglie in due tocchi, e le date si rifanno da quel che resta. */
function storia(o, d) {
  const box = el("div", "storia");
  const voci = registro.filter((v) => v.orologio === o.id && v.azione !== "misura")
                       .sort((a, b) => b.quando - a.quando);
  if (!voci.length) { box.append(el("p", "nota", t("sch.storiaVuota"))); return box; }
  const mostrate = d.tutte ? voci : voci.slice(0, 5);
  mostrate.forEach((v) => {
    const r = el("div", "voce");
    const testo = el("div", "voce-corpo");
    testo.append(el("span", "voce-cosa", t(v.azione)), el("span", "voce-quando", quando(v.quando)));
    const armata = d.armata === v.id;
    const x = el("button", "togli" + (armata ? " armato" : ""));
    x.innerHTML = armata ? icona("cestino", 16) : "×";
    x.setAttribute("aria-label", t(armata ? "reg.confermaRimuovi" : "reg.rimuovi"));
    x.onclick = () => {
      if (!armata) {
        d.armata = v.id; disegnaFoglio();
        setTimeout(() => { if (d.armata === v.id) { d.armata = null; disegnaFoglio(); } }, 4000);
        return;
      }
      d.armata = null;
      togliVoce(v);
    };
    r.append(testo, x);
    box.append(r);
  });
  if (voci.length > 5) {
    box.append(bottone("quieto", d.tutte ? t("sch.menoVoci") : t("sch.tutteVoci", { n: voci.length }), null,
      () => { d.tutte = !d.tutte; disegnaFoglio(); }));
  }
  return box;
}

function sezioneMarcia(o) {
  const s = el("section", "marcia");
  const capo = el("div", "capo-sezione");
  const titolo = el("h2", "etichetta sezione-titolo");
  titolo.append(document.createTextNode(t("mis.sezione")), el("span", "beta", "Beta"));
  capo.append(titolo);
  s.append(capo);

  const misure = registro.filter((v) => v.orologio === o.id && v.azione === "misura" && v.misura)
                         .sort((a, b) => b.quando - a.quando);
  if (misure.length) {
    const tab = el("div", "misure");
    misure.slice(0, 6).forEach((v) => {
      const r = el("div", "voce");
      const testo = el("div", "voce-corpo");
      testo.append(el("span", "voce-cosa", t("pos." + v.misura.posizione)),
                   el("span", "voce-quando", quando(v.quando)));
      const val = el("span", "marcia-valore " + (v.misura.marcia >= 0 ? "avanti" : "indietro"),
                     segnoMarcia(v.misura.marcia) + " " + t("mis.sg"));
      r.append(testo, val);
      tab.append(r);
    });
    s.append(tab);

    /* La differenza fra le posizioni, sull'ultima misura di ognuna. */
    const per = {};
    misure.forEach((v) => { if (!(v.misura.posizione in per)) per[v.misura.posizione] = v.misura.marcia; });
    const k = Object.keys(per);
    if (k.length >= 2) {
      const v = k.map((p) => per[p]);
      s.append(el("p", "nota", t("mis.scarto", {
        n: k.length, d: (Math.max(...v) - Math.min(...v)).toLocaleString(locale(), { maximumFractionDigits: 1 }) })));
    }
  } else {
    s.append(el("p", "nota", t("mis.vuoto")));
  }
  s.append(bottone("bottone secondario largo", t("mis.apri"), "microfono", () => avantiFoglio("misura", { id: o.id })));
  return s;
}

function sezioneMovimento(o) {
  const s = el("section", "movimento");
  s.append(el("h2", "etichetta sezione-titolo", t("sch.movimento")));
  const dl = el("dl", "spec");
  const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
  riga(t("sch.calibro"), nomeCorto(o.calibroNome));
  riga(t("st.riserva"), etichettaRiserva(o, true));
  if (o.ah) riga(t("ah"), o.ah.toLocaleString(locale()));
  if (o.tipo !== "quarzo" && o.tipo !== "elettrico" && o.tipo !== "diapason" && o.tipo !== "ecodrive" && o.tipo !== "kinetic") {
    riga(t("s.carica"), t(o.mano ? "si" : "no"));
    riga(t("s.secondi"), t(o.arresto ? "si" : "no"));
  }
  riga(t("s.calendario"), t(o.data ? (o.giorno ? "s.giornoData" : "s.soloData") : "s.noCal"));
  s.append(dl);

  const lista = el("ol", "gesti");
  gesti(o).forEach((g) => lista.append(el("li", null, g)));
  s.append(lista);

  const voce = trovaVoceArchivio(o.calibro);
  if (voce) s.append(bottone("bottone secondario largo", t("arch.leggi"), "libro", () => avantiFoglio("voce", { id: voce.id })));
  return s;
}


/* ===================== la voce d'archivio ======================== */

/* Il testo nella lingua corrente, con l'italiano come rete di
   sicurezza finché una scheda non è tradotta. */
function fogliaTesto(v, campo) {
  if (LINGUA === "en" && v[campo + "_en"]) return v[campo + "_en"];
  return v[campo];
}
const fogliaPaese = (v) => (LINGUA === "en" ? v.paese_en : v.paese);

COSTRUTTORI.voce = {
  classe: "alto",
  disegna(d, f) {
    const v = ARCHIVIO.find((x) => x.id === d.id);
    if (!v) return false;
    const corpo = capoFoglio(f, t("arch.titolo"));
    corpo.append(el("h1", "scheda-nome", v.nome));
    corpo.append(el("p", "scheda-linea", v.marca + " · " + fogliaPaese(v)));
    const sezione = (etichetta, testo) => {
      corpo.append(el("h2", "etichetta sezione-titolo", etichetta));
      corpo.append(el("p", "prosa archivio", testo));
    };
    sezione(t("arch.fatto"), fogliaTesto(v, "fatto"));
    sezione(t("arch.cura"), fogliaTesto(v, "cura"));
    sezione(t("arch.normale"), fogliaTesto(v, "normale"));
    corpo.append(el("h2", "etichetta sezione-titolo", t("arch.fonti")));
    const lf = el("div", "fonti");
    v.fonti.forEach((u) => {
      let host = u;
      try { host = new URL(u).hostname.replace("www.", ""); } catch (e) {}
      const a = el("a", "fonte", host);
      a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
      lf.append(a);
    });
    corpo.append(lf);
  },
};


/* ====================== il modulo: aggiungere ===================== */
/* Prima il movimento, poi il nome: il calibro è quello che fa
   funzionare tutto il resto. Due strade per il movimento: lo cerchi,
   oppure lo dichiari a mano, perché nessun elenco sarà mai completo. */

function nuovaBozza(esistente) {
  if (!esistente) return { nome: "", linea: "", calibro: null, manuale: null, manualeTesto: "",
                           dataAcquisto: null, ultimaRevisione: null, conferma: false, filtro: "" };
  /* Se il calibro salvato non esiste più nel database, la scheda passa
     alla dichiarazione a mano riempita con quello che l'orologio sa. */
  const noto = esistente.calibro !== "manuale"
    && (risolviCalibro(esistente.calibro) || risolviFamiglia(esistente.calibro));
  return {
    id: esistente.id, nome: esistente.nome, linea: esistente.linea,
    calibro: noto ? esistente.calibro : null,
    manuale: noto ? null : {
      tipo: esistente.tipo, mano: esistente.mano, arresto: esistente.arresto,
      data: esistente.data, giorno: esistente.giorno, indiretti: esistente.indiretti,
      crono: !!esistente.crono, tourbillon: !!esistente.tourbillon,
      riserva: esistente.riserva, ah: esistente.ah },
    manualeTesto: noto ? "" : esistente.calibroNome,
    dataAcquisto: esistente.dataAcquisto ?? null,
    ultimaRevisione: esistente.ultimaRevisione ?? null,
    conferma: false, filtro: "",
  };
}

COSTRUTTORI.modulo = {
  classe: "alto",
  disegna(d, f) {
    if (!d.bozza) d.bozza = nuovaBozza(d.id ? trovaOrologio(d.id) : null);
    const b = d.bozza;
    const corpo = capoFoglio(f, t(b.id ? "s.modifica" : "s.titolo"));

    corpo.append(el("h2", "etichetta sezione-titolo", t("s.movimento")));
    if (b.manuale) moduloManuale(corpo, d);
    else if (b.calibro) moduloScelto(corpo, d);
    else moduloRicerca(corpo, d);

    corpo.append(el("h2", "etichetta sezione-titolo", t("s.identita")));
    corpo.append(campo(t("s.nome"), t("s.nomeAiuto"), b.nome, 60, (v) => { b.nome = v; aggiornaSalva(b); }));
    corpo.append(campo(t("s.linea"), t("s.lineaAiuto"), b.linea, 60, (v) => { b.linea = v; }, t("s.facoltativo")));

    corpo.append(el("h2", "etichetta sezione-titolo", t("s.manutenzione")));
    corpo.append(campoData(t("s.acquisto"), b.dataAcquisto, (v) => { b.dataAcquisto = v; }, t("s.facoltativo")));
    corpo.append(campoData(t("s.revisione"), b.ultimaRevisione, (v) => { b.ultimaRevisione = v; }, t("s.facoltativo")));

    if (b.id) corpo.append(bloccoElimina(d));

    /* Il salvataggio sta in un piede fisso: con la tastiera aperta un
       bottone in fondo al foglio non si raggiunge più. */
    const piede = el("div", "foglio-piede");
    const salva = bottone("bottone primario largo", t(b.id ? "s.salvaMod" : "s.salva"), null, () => salvaBozza(d));
    salva.id = "salva";
    salva.disabled = !b.nome.trim();
    piede.append(salva);
    f.append(piede);
  },
};

function aggiornaSalva(b) { const s = q("#salva"); if (s) s.disabled = !b.nome.trim(); }

/* Etichetta sopra, non solo dentro: il segnaposto sparisce appena scrivi. */
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

/* Un timestamp in un input di tipo data vuole AAAA-MM-GG nell'ora
   locale. Mezzogiorno fisso, non mezzanotte: un fuso a ovest farebbe
   scivolare la data al giorno prima. */
function dataInput(ts) {
  if (ts == null) return "";
  const d = new Date(ts), due = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + due(d.getMonth() + 1) + "-" + due(d.getDate());
}
function dataInputATimestamp(s) {
  if (!s) return null;
  const v = new Date(s + "T12:00:00").getTime();
  return Number.isFinite(v) ? v : null;
}
function campoData(etichetta, valore, onCambia, nota) {
  const w = el("label", "campo-blocco");
  const cap = el("span", "campo-etichetta");
  cap.append(document.createTextNode(etichetta));
  if (nota) cap.append(el("em", null, nota));
  const i = el("input", "campo");
  i.type = "date";
  i.value = dataInput(valore);
  i.max = dataInput(Date.now());
  i.oninput = () => onCambia(dataInputATimestamp(i.value));
  w.append(cap, i);
  return w;
}

const MANUALE_PARTENZA = () => ({ tipo: "automatico", mano: true, arresto: true, data: true, giorno: false,
                                  indiretti: false, crono: false, tourbillon: false, riserva: 41, ah: 21600 });

/* Una riga dell'elenco dei calibri. */
function rigaCalibro(c, scegli) {
  const b = el("button", "riga-calibro");
  const corpo = el("div", "riga-corpo");
  corpo.append(el("span", "riga-nome piccolo", c.nome),
               el("span", "riga-sotto", c.fam ? t("s.famiglia") : c.sotto));
  b.append(corpo);
  b.insertAdjacentHTML("beforeend", icona("avanti", 16));
  b.onclick = scegli;
  return b;
}

/* La ricerca compatta: un campo e al massimo quattro suggerimenti. Per
   sfogliare il catalogo intero c'è una schermata a parte. Gli esiti si
   riscrivono in posto, senza ridisegnare il foglio: il campo non perde
   il fuoco mentre scrivi. */
function moduloRicerca(f, d) {
  const b = d.bozza;
  const cerca = el("input", "campo");
  cerca.type = "search";
  cerca.placeholder = t("s.cerca"); cerca.value = b.filtro || "";
  f.append(cerca);
  const esiti = el("div", "esiti");
  const sotto = el("div", "esiti-link");
  f.append(esiti, sotto);

  function riempi(testo) {
    b.filtro = testo;
    esiti.innerHTML = ""; sotto.innerHTML = "";
    const trovati = testo.trim() ? cercaCalibri(testo) : [];
    if (trovati.length) {
      esiti.append(el("span", "etichetta piccola", t("s.suggerimenti")));
      trovati.slice(0, 4).forEach((c) => esiti.append(rigaCalibro(c, () => { b.calibro = c.id; disegnaFoglio(); })));
    }
    sotto.append(bottone("quieto", trovati.length > 4 ? t("s.altriRisultati") : t("s.cercaCatalogo", { n: CALIBRI.length }),
      null, () => avantiFoglio("catalogo", { bozza: b, filtro: cerca.value })));
    sotto.append(bottone("quieto", t("s.manuale"), null, () => {
      b.manuale = MANUALE_PARTENZA(); b.manualeTesto = cerca.value.trim(); disegnaFoglio();
    }));
  }
  cerca.oninput = () => riempi(cerca.value);
  riempi(b.filtro || "");
}

/* Il catalogo intero, a schermo pieno, con la via d'uscita per
   dichiarare il movimento a mano. */
COSTRUTTORI.catalogo = {
  classe: "alto",
  disegna(d, f) {
    const b = d.bozza;
    const corpo = capoFoglio(f, t("s.titoloRicerca"));
    const cerca = el("input", "campo");
    cerca.type = "search";
    cerca.placeholder = t("s.cerca"); cerca.value = d.filtro || "";
    corpo.append(cerca);
    const esiti = el("div", "esiti");
    corpo.append(esiti);
    const scegli = (id) => { b.calibro = id; b.manuale = null; indietroFoglio(); };
    function riempi(testo) {
      d.filtro = testo;
      esiti.innerHTML = "";
      cercaCalibri(testo).forEach((c) => esiti.append(rigaCalibro(c, () => scegli(c.id))));
    }
    cerca.oninput = () => riempi(cerca.value);
    riempi(d.filtro || "");

    const aiuto = el("section", "aiuto riquadro");
    aiuto.append(el("h2", "etichetta", t("s.nonTrovi")), el("p", "prosa piccola", t("s.rimarchio")));
    aiuto.append(bottone("bottone secondario largo", t("s.manuale"), null, () => {
      b.manuale = MANUALE_PARTENZA(); b.manualeTesto = cerca.value.trim(); b.calibro = null; indietroFoglio();
    }));
    corpo.append(aiuto);
  },
};

function moduloScelto(f, d) {
  const b = d.bozza;
  const c = risolviCalibro(b.calibro) || risolviFamiglia(b.calibro);
  if (!c) { b.calibro = null; return moduloRicerca(f, d); }
  const box = el("div", "scelto riquadro");
  box.append(el("div", "scelto-nome", c.nome));
  const dl = el("dl", "spec");
  const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
  riga(t("st.riserva"), etichettaRiserva(c, true));
  if (c.ah) riga(t("ah"), c.ah.toLocaleString(locale()));
  riga(t("s.carica"), t(c.mano ? "si" : "no"));
  riga(t("s.secondi"), t(c.arresto ? "si" : "no"));
  riga(t("s.calendario"), t(c.data ? (c.giorno ? "s.giornoData" : "s.soloData") : "s.noCal"));
  box.append(dl);
  const fo = el("p", "fonte-dato fonte-" + c.fonte);
  fo.append(el("span", "pallino-fonte"), el("span", null, t("fonte." + c.fonte)));
  box.append(fo);
  f.append(box);
  f.append(bottone("quieto", t("s.cambia"), null, () => { b.calibro = null; disegnaFoglio(); }));
}

function moduloManuale(f, d) {
  const b = d.bozza, m = b.manuale;
  f.append(el("p", "nota", t("s.dichiara")));
  f.append(campo(t("s.nomeMov"), t("s.cerca"), b.manualeTesto, 60, (v) => { b.manualeTesto = v; }, t("s.facoltativo")));

  const fila = el("div", "scelte");
  TIPI.forEach((id) => {
    const x = el("button", "scelta" + (m.tipo === id ? " accesa" : ""), t("t." + id));
    x.onclick = () => { m.tipo = id; disegnaFoglio(); };
    fila.append(x);
  });
  f.append(fila);

  /* La riserva: è il campo che fa funzionare il resto. A batteria si
     conta in giorni, non in ore. */
  const inG = ["ecodrive", "kinetic", "quarzo", "elettrico", "diapason"].includes(m.tipo);
  const gruppo = el("label", "campo-blocco");
  gruppo.append(el("span", "campo-etichetta", t(inG ? "s.riservaGiorni" : "s.riservaOre")));
  const inp = el("input", "campo numero");
  inp.type = "number"; inp.inputMode = "numeric"; inp.min = "1";
  inp.value = inG ? Math.round(m.riserva / 24) : m.riserva;
  inp.oninput = () => { m.riserva = Math.max(1, Number(inp.value) || 1) * (inG ? 24 : 1); };
  gruppo.append(inp);
  f.append(gruppo, el("p", "nota", t("s.nota")));

  const interruttore = (k, chiave) => {
    const r = el("button", "interruttore" + (m[k] ? " acceso" : ""));
    r.setAttribute("role", "switch");
    r.setAttribute("aria-checked", String(!!m[k]));
    r.append(el("span", null, t(chiave)), el("span", "pallina"));
    r.onclick = () => { m[k] = !m[k]; disegnaFoglio(); };
    f.append(r);
  };
  interruttore("crono", "s.crono");
  if (!["ecodrive", "kinetic", "quarzo"].includes(m.tipo)) {
    [["mano", "s.mano"], ["arresto", "s.arrestoLungo"], ["data", "s.data"], ["giorno", "s.giorno"],
     ["indiretti", "s.indiretti"], ["tourbillon", "s.tourbillon"]].forEach(([k, c]) => interruttore(k, c));
  }
  f.append(bottone("quieto", t("s.elenco"), null, () => { b.manuale = null; disegnaFoglio(); }));
}

function bloccoElimina(d) {
  const b = d.bozza;
  const box = el("div", "blocco-elimina");
  const x = bottone("bottone pericolo largo" + (b.conferma ? " armato" : ""), t(b.conferma ? "elimina.conferma" : "elimina"), "cestino", () => {
    if (!b.conferma) {
      b.conferma = true; disegnaFoglio();
      setTimeout(() => { if (b.conferma) { b.conferma = false; disegnaFoglio(); } }, 4000);
      return;
    }
    eliminaOrologio(b.id);
  });
  box.append(x, el("p", "nota", t("elimina.nota")));
  return box;
}

async function eliminaOrologioOra(id) {
  await cancella("orologi", id);
  /* Le voci di registro di questo orologio se ne vanno con lui. */
  for (const v of registro.filter((x) => x.orologio === id)) await cancella("registro", v.id);
  ripulisciNotifica(id);
  orologi = await leggiTutti("orologi");
  registro = await leggiTutti("registro");
  chiudiFoglio();
  disegna();
}

async function salvaBozzaOra(d) {
  const b = d.bozza;
  if (!b || !b.nome.trim()) return;
  const vecchio = b.id ? trovaOrologio(b.id) : null;
  let o;
  if (b.manuale) {
    const m = b.manuale;
    o = {
      id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: b.nome.trim(), linea: b.linea.trim(),
      calibro: "manuale", calibroNome: b.manualeTesto.trim() || t("s.movDichiarato"),
      tipo: m.tipo, mano: m.mano, arresto: m.arresto, data: m.data,
      giorno: m.giorno, indiretti: m.indiretti, crono: !!m.crono, tourbillon: !!m.tourbillon,
      riserva: m.riserva, ah: m.ah,
      ultimoPolso: null, ultimaLuce: null, ultimoCrono: null, ultimaCarica: null,
      aggiunto: Date.now(),
    };
  } else {
    o = daCalibro(b.calibro, b.nome.trim(), b.linea.trim());
  }
  o.dataAcquisto = b.dataAcquisto ?? null;
  o.ultimaRevisione = b.ultimaRevisione ?? null;
  /* Modificando, l'orologio resta lo stesso: id e date non si toccano. */
  if (vecchio) {
    Object.assign(o, { id: vecchio.id, ultimoPolso: vecchio.ultimoPolso, ultimaLuce: vecchio.ultimaLuce,
                       ultimoCrono: vecchio.ultimoCrono, ultimaCarica: vecchio.ultimaCarica,
                       aggiunto: vecchio.aggiunto ?? o.aggiunto });
  }
  await salva("orologi", o);
  orologi = await leggiTutti("orologi");
  /* Da nuovo si arriva alla sua scheda; da modifica si torna alla scheda. */
  if (vecchio && pila.length > 1) { indietroFoglio(); disegna(); }
  else { if (!vecchio) pilaVerso(o.id); sostituisciFoglio("orologio", { id: o.id }); disegna(); }
}

const eliminaOrologio = (id) => unaVolta(() => eliminaOrologioOra(id));
const salvaBozza      = (d) => unaVolta(() => salvaBozzaOra(d));
