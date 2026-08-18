/* ------------------------------------------------------------------
   Dominio — cosa significa possedere un orologio meccanico
   Qui non c'è una riga di interfaccia: solo il calcolo di che cosa
   chiede un orologio e quali gesti vuole il suo movimento.
   ------------------------------------------------------------------ */

/* ========================= dati di partenza ======================= */
/* Verificare i calibri sul fondello prima di fidarsi. */


/* Un orologio è: un nome + un calibro + le sue date. Il resto lo eredita. */
function daCalibro(idCalibro, nome, linea, extra = {}) {
  const c = risolviCalibro(idCalibro) || risolviFamiglia(idCalibro);
  return {
    /* Due orologi con lo stesso nome e lo stesso calibro esistono davvero:
       due Seiko 5 uguali comprati insieme. L'identificativo non può
       dipendere solo da quello. */
    id: (nome + idCalibro).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)
        + "-" + Math.random().toString(36).slice(2, 7),
    nome, linea,
    calibro: idCalibro, calibroNome: c ? c.nome : idCalibro,
    tipo: c.tipo, mano: !!c.mano, arresto: !!c.arresto,
    data: !!c.data, giorno: !!c.giorno, indiretti: !!c.indiretti,
    crono: !!c.crono, tourbillon: !!c.tourbillon,
    riserva: c.riserva, ah: c.ah, giri: c.giri || null, finestra: c.finestra || [21, 3],
    finestraGiorno: c.finestraGiorno || null,
    /* Sovrascrive la frase generica sulla data quando il manuale del
       calibro ancora il divieto a qualcosa d'altro (es. la lancetta
       delle 24 ore sul 4R34). */
    notaData: c.notaData || null,
    fonte: c.fonte || "derivato",
    ultimoPolso: null, ultimaLuce: null, ultimoCrono: null, ultimaCarica: null,
    ...extra,
  };
}

function etichettaCalibro(o) {
  /* Quando non c'è un numero di alternanze da mostrare (ah:0), la
     ragione cambia da tipo a tipo: un quarzo non ha uno scappamento
     da contare, un diapason nemmeno ma per un motivo diverso — dire
     "al quarzo" per entrambi sarebbe impreciso proprio nel modo che
     l'archivio ha sempre cercato di evitare. */
  const generico = o.tipo === "diapason" ? t("aDiapason")
                  : o.tipo === "elettrico" ? t("aBatteria")
                  : t("alQuarzo");
  const ah = o.ah ? o.ah.toLocaleString(locale()) + " " + t("ah") : generico;
  return `${nomeCorto(o.calibroNome).replace(/^(Grand Seiko|Spring Drive|Seiko|Citizen|Miyota) /, t("cal") + " ")} · ${ah}`;
}

/* Nell'elenco e nell'anello sta il nome nudo: le precisazioni fra parentesi
   servono in fase di scelta, non dopo. */
function nomeCorto(n) { return String(n ?? "").replace(/\s*\([^)]*\)/g, "").trim(); }

/* nudo = solo la durata, senza "di riserva": serve dentro le frasi. */
function etichettaRiserva(o, nudo) {
  const r = o.riserva || 0;
  const v = r >= 720 ? plurale(Math.round(r / 720), "mese", "mesiPl")
          : r >= 48  ? plurale(Math.round(r / 24), "giorno_", "giorniPl")
          :            plurale(r, "ora", "orePl");
  return nudo ? v : t("riservaDi", { v });
}

function giorniDa(ms) { return ms == null ? null : Math.floor((Date.now() - ms) / 86400000); }

/* ------------------------------------------------------------------
   Normalizzazione — la frontiera fra l'archivio e il resto dell'app
   Un record salvato da una versione precedente, o corrotto, o scritto a
   mano, entra da qui e ne esce con la forma giusta. Prima un orologio
   senza «calibroNome» faceva fallire il disegno e con esso TUTTE le
   pareti: un solo dato storto e l'app non si apriva più, senza modo di
   recuperare perché non c'è esportazione.
   ------------------------------------------------------------------ */

const TIPI = ["automatico", "manuale", "cronografo", "ecodrive", "kinetic", "springdrive", "quarzo", "elettrico", "diapason"];

function numero(v, prefinito, minimo = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= minimo ? n : prefinito;
}
function istante(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizza(o) {
  if (!o || typeof o !== "object") return null;
  const tipo = TIPI.includes(o.tipo) ? o.tipo : "automatico";
  return {
    ...o,
    id: String(o.id || "x" + Math.random().toString(36).slice(2, 9)),
    nome: String(o.nome ?? "").trim() || t("senzaNome"),
    linea: String(o.linea ?? "").trim(),
    calibro: String(o.calibro ?? "").trim() || "—",
    calibroNome: String(o.calibroNome ?? "").trim() || t("ignoto"),
    tipo,
    mano: !!o.mano, arresto: !!o.arresto, data: !!o.data,
    giorno: !!o.giorno, indiretti: !!o.indiretti, crono: !!o.crono, tourbillon: !!o.tourbillon,
    riserva: numero(o.riserva, tipo === "ecodrive" || tipo === "kinetic" ? 4320
      : tipo === "elettrico" || tipo === "diapason" ? 17520 : 41, 1),
    ah: numero(o.ah, 0),
    giri: Number.isFinite(Number(o.giri)) && Number(o.giri) > 0 ? Number(o.giri) : null,
    finestra: Array.isArray(o.finestra) && o.finestra.length === 2
      && o.finestra.every((h) => Number.isFinite(Number(h))) ? o.finestra.map(Number) : [21, 3],
    ultimoPolso: istante(o.ultimoPolso),
    ultimaLuce: istante(o.ultimaLuce),
    ultimoCrono: istante(o.ultimoCrono),
    ultimaCarica: istante(o.ultimaCarica),
    dataAcquisto: istante(o.dataAcquisto),
    ultimaRevisione: istante(o.ultimaRevisione),
  };
}

/* La prossima revisione consigliata: un intervallo fisso di tre anni,
   calcolato dall'ultima revisione se la conosci, altrimenti dalla data
   di acquisto. Nessuna lettura dall'archivio per calibro: è la stessa
   stima per tutti, dichiarata come tale, non una scadenza precisa. */
function prossimaRevisione(o) {
  const base = o.ultimaRevisione ?? o.dataAcquisto;
  if (base == null) return null;
  const treAnniMs = 3 * 365.25 * 24 * 3600000;
  return base + treAnniMs;
}

/* ====================== la logica del custode ===================== */
/* Non è statistica: è manutenzione. Chi ha più bisogno viene prima.  */

function bisogno(o) {
  /* Un orologio appena aggiunto non è "fermo da 999 giorni": è nuovo.
     Prima si porta una volta, poi comincia il conteggio. Ma «mai
     indossato» e «mai toccato» non sono la stessa cosa: se nel
     frattempo l'hai caricato con «L'ho solo caricato», quel gesto va
     riconosciuto — altrimenti il messaggio resta "Appena aggiunto"
     identico a prima anche dopo che qualcosa è successo davvero, e
     dall'anello sembra che il tocco non abbia fatto nulla. */
  if (o.ultimoPolso == null) {
    if (o.ultimaCarica != null)
      return { punti: 100, stato: "moto", motivo: t("m.caricatoNonIndossato") };
    return { punti: 120, stato: "moto", motivo: t("m.nuovo") };
  }

  const g = Math.max(0, giorniDa(o.ultimoPolso));
  const gg = plurale(g, "giorno_", "giorniPl");

  /* Un carica-manuale non si ricarica portandolo: si ricarica girando la
     corona. Contare dal polso gli darebbe una spiegazione falsa.
     Un automatico invece prende energia dal polso e anche dalla corona:
     vale la più recente delle due. */
  const energia = o.tipo === "manuale"
    ? (o.ultimaCarica ?? o.ultimoPolso)
    : Math.max(o.ultimoPolso, o.ultimaCarica ?? 0);
  /* Se l'orologio del telefono va indietro — cambio d'ora, fuso, correzione
     automatica — una data può finire nel futuro e il conto diventa assurdo.
     Meglio zero che «113 ore su una riserva di 42». */
  const oreFerme = Math.max(0, (Date.now() - energia) / 3600000);

  if (o.tipo === "ecodrive" || o.tipo === "kinetic") {
    const luce = Math.max(0, giorniDa(o.ultimaLuce ?? o.ultimoPolso));
    const limite = Math.round((o.riserva || 4320) / 24);
    const lg = plurale(luce, "giorno_", "giorniPl"), ll = plurale(limite, "giorno_", "giorniPl");
    if (luce >= limite)
      return { punti: 200 + luce, stato: "scarico", motivo: t("m.eco.fermo", { g: lg, l: ll }) };
    if (luce >= limite * 0.6)
      return { punti: 90 + luce, stato: "riserva",
               motivo: t(o.tipo === "kinetic" ? "m.kin.basso" : "m.eco.basso", { g: lg, l: ll }) };
    return { punti: g, stato: "moto", restanti: (limite - luce) * 24,
             motivo: t("m.carico", { r: etichettaRiserva(o, true) }) };
  }

  if (o.tipo === "quarzo" || o.tipo === "elettrico" || o.tipo === "diapason") {
    /* Stessa soglia per tutti e tre — sono tutti a batteria, nessun
       conto alla rovescia meccanico ha senso — ma la frase deve
       essere quella giusta per il tipo vero: dire "al quarzo" anche
       per un diapason o un elettrico sarebbe la stessa imprecisione
       già corretta in etichettaCalibro(), qui perché mi era sfuggita
       la prima volta. */
    const chiave = o.tipo === "elettrico" ? "elettrico" : o.tipo === "diapason" ? "diapason" : "quarzo";
    return { punti: g >= 60 ? 30 : 5, stato: "moto", motivo: t(g >= 60 ? `m.${chiave}.data` : `m.${chiave}`) };
  }

  if (o.tipo === "cronografo") {
    const c = Math.max(0, giorniDa(o.ultimoCrono ?? o.ultimoPolso));
    if (c >= 30)
      return { punti: 150 + c / 2, stato: "azionare",
               motivo: t("m.crono", { g: plurale(c, "giorno_", "giorniPl") }) };
  }

  /* Qui sta il senso della riserva: un 6R35 da 70 ore regge tre giorni,
     un 7S26 da 41 si ferma dopo poco più di uno. Non è la stessa soglia. */
  const riserva = o.riserva || 41;
  if (oreFerme > riserva) {
    const fermoDa = Math.floor((oreFerme - riserva) / 24);
    if (fermoDa >= 21)
      return { punti: 180 + fermoDa, stato: "fermo",
               motivo: t("m.olio", { g: plurale(fermoDa, "giorno_", "giorniPl") }) };
    if (o.tipo === "manuale")
      return { punti: 60 + fermoDa, stato: "scarico",
               motivo: t("m.manuale.scarico", { r: riserva, n: o.giri || 30,
                         g: plurale(giorniDa(energia), "giorno_", "giorniPl") }) };
    return { punti: 60 + fermoDa, stato: "scarico",
             motivo: t(o.mano ? "m.scarico.mano" : "m.scarico.scosse", { r: riserva, g: gg, n: o.giri || 30 }) };
  }

  const restanti = Math.max(0, Math.round(riserva - oreFerme));
  const ro = plurale(restanti, "ora", "orePl");
  if (restanti < 12) return { punti: 45, stato: "riserva", restanti, motivo: t("m.quasi", { o: ro }) };
  return { punti: g, stato: "moto", restanti, motivo: t("m.pieno", { o: ro }) };
}

const COLORE = { moto: "var(--argento-off)", riserva: "var(--viola)",
                 fermo: "var(--viola)", scarico: "var(--arancio)", azionare: "var(--oro)" };
const nomeStato = (s) => t("stato." + s);

function ordinaPerBisogno(lista) {
  return [...lista].map((o) => ({ o, b: bisogno(o) })).sort((a, b) => b.b.punti - a.b.punti);
}

/* In italiano le ore si dicono in ventiquattro, in inglese no. */
function oraScritta(h) {
  const intero = Math.floor(h);
  const mezza = h - intero >= 0.4;   // 4.5 → mezz'ora; tollerante su arrotondamenti
  if (LINGUA === "it") return mezza ? intero + " e mezza" : String(intero);
  const p = intero >= 12 ? "pm" : "am";
  const n = intero % 12 === 0 ? 12 : intero % 12;
  return n + (mezza ? ":30 " : " ") + p;
}

/* =========================== il gesto ============================= */
/* Le tre o quattro cose che contano per QUEL movimento. Non un manuale. */

function gesti(o) {
  const g = [];
  const r = etichettaRiserva(o, true);

  /* Un cronografo al quarzo ha i pulsanti come uno meccanico, e sott'acqua
     si rompe allo stesso modo. Ma «cronografo» qui è un tipo di
     alimentazione, non una complicazione: un 7T92 è tipizzato quarzo, e
     uscendo di qui col ritorno anticipato non arrivava mai alla riga sui
     pulsanti. Lo stesso valeva per l'Eco-Drive crono. Il campo `crono`
     dice che i pulsanti ci sono, qualunque cosa faccia girare le lancette. */
  const conPulsanti = o.crono || o.tipo === "cronografo";
  const coda = (lista) => (conPulsanti ? [...lista, t("g.crono")] : lista);

  if (o.tipo === "ecodrive") return coda([t("g.eco.1"), t("g.eco.2", { r }), t("g.eco.3")]);
  if (o.tipo === "kinetic")  return coda([t("g.kin.1"), t("g.kin.2", { r }), t("g.kin.3")]);
  if (o.tipo === "quarzo") {
    g.push(t("g.q.1"));
    if (o.data) g.push(t("g.q.2"));
    return coda(g);
  }
  /* Elettrico e diapason: niente corona da girare, niente molla da
     mandare in tensione — la carica a molla (g.mano/g.scosse) direbbe
     una cosa falsa su questi due. Ognuno ritorna per conto proprio,
     come già fanno ecodrive/kinetic/quarzo, invece di infilarsi nel
     flusso comune pensato per chi una molla ce l'ha davvero. */
  if (o.tipo === "elettrico") {
    g.push(t("g.elt.1"));
    g.push(t("g.elt.2"));
    if (o.data) {
      if (o.notaData) g.push(t(o.notaData));
      else {
        const [da, a] = o.finestra || [21, 3];
        g.push(t("g.data", { da: oraScritta(da), a: oraScritta(a) }));
      }
    }
    return coda(g);
  }
  if (o.tipo === "diapason") {
    g.push(t("g.dia.1"));
    g.push(t("g.dia.2"));
    return coda(g);
  }
  if (o.tipo === "springdrive") { g.push(t("g.sd.1")); g.push(t("g.sd.2", { r: o.riserva })); }

  g.push(t(o.mano ? "g.mano" : "g.scosse", { r: o.riserva, n: o.giri || 30 }));
  if (o.indiretti) g.push(t("g.indiretti"));
  if (o.data) {
    /* Alcuni calibri ancorano il divieto a una lancetta diversa da quelle
       normali: sul 4R34 il manuale Seiko guarda la lancetta delle 24 ore.
       La formula generica «tra le X e le Y» lì direbbe un'altra cosa. */
    if (o.notaData) {
      g.push(t(o.notaData));
    } else if (o.giorno && o.finestraGiorno) {
      /* Due finestre distinte, non una: sul Miyota 8205 la scheda tecnica
         vieta la data in una fascia e il giorno in un'altra, consecutiva
         ma diversa. Trattarle come un'unica finestra ne nascondeva metà. */
      const [da, a] = o.finestra || [21, 3];
      const [da2, a2] = o.finestraGiorno;
      g.push(t("g.data.doppia", {
        da: oraScritta(da), a: oraScritta(a),
        da2: oraScritta(da2), a2: oraScritta(a2),
      }));
    } else {
      const [da, a] = o.finestra || [21, 3];
      g.push(t("g.data", { da: oraScritta(da), a: oraScritta(a) }));
    }
  }
  g.push(t(o.arresto ? "g.arresto" : "g.nonArresto"));
  if (o.tipo === "cronografo") g.push(t("g.crono"));
  if (o.tourbillon) g.push(t("g.tourbillon"));
  return g;
}

/* ============================= stato ============================== */

let orologi = [];
let registro = [];
let voceArmata = null;    /* rimozione in due tocchi, come l'elimina */
let scelto = null;
/* L'ambiente segue l'ora vera. Nessun pulsante: è il concetto del quadrante
   Vanac — l'orizzonte di Tokyo cambia da solo — applicato all'interfaccia. */
/* La barra del browser è parte della schermata: se resta ferma mentre
   l'app cambia ora, si vede la cucitura. */

/* Una durata in ore detta come la direbbe una persona: «14 ore», «2 giorni».
   Serve a Oggi per dire quanto manca prima che un orologio si fermi. */
function durata(ore) {
  const o = Math.max(0, Math.round(ore));
  if (o < 48) return plurale(o, "ora", "orePl");
  const g = Math.round(o / 24);
  return plurale(g, "giorno_", "giorniPl");
}

/* Aggancia un calibro (l'id interno, es. "4R35") alla sua voce
   nell'archivio (es. "seiko-4r35"), se esiste. Prova prima l'esatto, poi
   la famiglia — un calibro senza scheda propria può comunque avere quella
   della sua famiglia (è il caso di Citizen Eco-Drive). */
function trovaVoceArchivio(idCalibro) {
  if (!idCalibro || typeof ARCHIVIO === "undefined") return null;
  /* Il confronto ignora i trattini su entrambi i lati: l'id dell'app è
     "PT5000" senza trattino, quello dell'archivio è "pt-5000" — stessa
     sigla, punteggiatura diversa. Toglierla prima di confrontare evita di
     dover far coincidere le due convenzioni a mano ogni volta. */
  const pulisci = (s) => s.toUpperCase().replace(/-/g, "");
  const nudo = pulisci(idCalibro);
  let v = ARCHIVIO.find((x) => {
    if (pulisci(x.id) === nudo) return true;
    /* La marca non è sempre una parola sola: "grand-seiko-9s65" o
       "la-joux-perret-g100" hanno il prefisso su due o tre trattini.
       Togliere solo fino al primo trattino lasciava "seiko-9s65" o
       "joux-perret-g100" — non combaciava mai con "9S65" o "G100".
       Si prova a tagliare a ogni trattino, non solo al primo, finché
       uno dei resti non coincide. */
    const parti = x.id.split("-");
    for (let i = 1; i < parti.length; i++) {
      if (pulisci(parti.slice(i).join("-")) === nudo) return true;
    }
    return false;
  });
  if (v) return v;
  const c = CALIBRI.find((x) => x.id === idCalibro);
  /* Un calibro può dichiarare esplicitamente la scheda di un altro quando
     i due condividono lo stesso movimento: il 6498 è il 6497 con i piccoli
     secondi a ore 6. Una scheda sola, che dichiara la differenza, invece
     di due quasi identiche che poi si aggiornano una sola per volta. */
  if (c && c.scheda) {
    v = ARCHIVIO.find((x) => x.id === c.scheda);
    if (v) return v;
  }
  /* risolviFamiglia() cerca l'id DIRETTAMENTE fra le famiglie: non
     traduce un calibro nella sua famiglia. Per quello serve guardare il
     campo .fam del calibro in CALIBRI, come fa risolviCalibro(). */
  if (c) v = ARCHIVIO.find((x) => x.id === c.fam);
  return v || null;
}
