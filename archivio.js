/* ------------------------------------------------------------------
   Archivio — IndexedDB e stato condiviso
   Tre depositi: orologi, registro, stato. Nient'altro tocca il database.
   ------------------------------------------------------------------ */
/* ============================ archivio ============================ */

const NOME_APP = "Bariletto";   /* una costante sola: si cambia qui */
const DB_NOME = "bariletto";
const DB_VER = 2;
let db;

function apri() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(DB_NOME, DB_VER);
    r.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("orologi")) d.createObjectStore("orologi", { keyPath: "id" });
      if (!d.objectStoreNames.contains("registro")) d.createObjectStore("registro", { keyPath: "id", autoIncrement: true });
      if (!d.objectStoreNames.contains("stato")) d.createObjectStore("stato", { keyPath: "chiave" });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

function tx(nome, modo, fn) {
  return new Promise((ok, ko) => {
    const trans = db.transaction(nome, modo);
    const s = trans.objectStore(nome);
    const r = fn(s);
    trans.oncomplete = () => ok(r && r.result !== undefined ? r.result : undefined);
    trans.onerror = () => ko(trans.error);
  });
}

/* Gli orologi escono dall'archivio già normalizzati: da qui in poi tutto
   il resto dell'app può dare per scontata la forma dei dati. */
const leggiTutti = async (n) => {
  const v = (await tx(n, "readonly", (s) => s.getAll())) || [];
  return n === "orologi" ? v.map(normalizza).filter(Boolean) : v;
};
const salva = (n, v) => tx(n, "readwrite", (s) => s.put(v));
const cancella = (n, k) => tx(n, "readwrite", (s) => s.delete(k));


const svuota = (n) => tx(n, "readwrite", (s) => s.clear());

/* ============================ notifiche ============================
   Controlli periodici in background, senza server: il sistema decide
   lui l'intervallo reale in base a quanto usi l'app davvero, non è un
   timer preciso che rispetta sempre le ore richieste. Esiste solo su
   Chrome per Android, per app installate — su iOS, desktop o altri
   browser questa funzione semplicemente non c'è, e va dichiarato
   subito invece di far finta che il bottone funzioni ovunque. */

const TAG_SYNC = "controlla-riserve";

async function notifichePossibili() {
  if (!("serviceWorker" in navigator) || !("Notification" in self)) return false;
  /* Se nessun service worker controlla ancora la pagina (primo avvio,
     prima che l'installazione sia completa), non aspettare: "ready"
     potrebbe non risolversi mai in quel momento, e l'app non deve
     restare appesa per una funzione accessoria. */
  if (!navigator.serviceWorker.controller) return false;
  const reg = await navigator.serviceWorker.ready;
  return "periodicSync" in reg;
}

async function notificheAttive() {
  if (!(await notifichePossibili())) return false;
  const reg = await navigator.serviceWorker.ready;
  const tag = await reg.periodicSync.getTags();
  return tag.includes(TAG_SYNC);
}

async function attivaNotifiche() {
  if (!(await notifichePossibili())) return { ok: false, motivo: "non-supportato" };
  const permesso = await Notification.requestPermission();
  if (permesso !== "granted") return { ok: false, motivo: "rifiutato" };
  try {
    /* Firefox non implementa questa query: si prova comunque a
       registrare, e se il browser non supporta periodicSync l'errore
       viene preso sotto, non qui. */
    const stato = await navigator.permissions.query({ name: "periodic-background-sync" });
    if (stato.state !== "granted") return { ok: false, motivo: "rifiutato" };
  } catch (e) { /* ignorato apposta */ }
  const reg = await navigator.serviceWorker.ready;
  try {
    await reg.periodicSync.register(TAG_SYNC, { minInterval: 12 * 3600000 });
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: "errore" };
  }
}

async function disattivaNotifiche() {
  if (!(await notifichePossibili())) return;
  const reg = await navigator.serviceWorker.ready;
  await reg.periodicSync.unregister(TAG_SYNC);
}


/* ============================== backup ============================
   Fino a qui non esisteva: se il browser svuotava i dati, o il telefono
   si perdeva, non c'era modo di tornare indietro. Era una scelta
   dichiarata, ma sproporzionata rispetto al costo di un file scaricato.
   Nessun account e nessuna nuvola: un file, sul dispositivo, leggibile.
   ------------------------------------------------------------------ */

const VERSIONE_BACKUP = 1;

function datiPerBackup() {
  return {
    app: NOME_APP,
    versione: VERSIONE_BACKUP,
    quando: new Date().toISOString(),
    orologi,
    registro,
  };
}

/* Il nome porta la data: due backup dello stesso mese non si sovrascrivono
   a vicenda nella cartella dei download. */
function nomeFileBackup() {
  const d = new Date();
  const due = (n) => String(n).padStart(2, "0");
  return "bariletto-" + d.getFullYear() + due(d.getMonth() + 1) + due(d.getDate()) + ".json";
}

function esportaBackup() {
  const testo = JSON.stringify(datiPerBackup(), null, 2);
  const url = URL.createObjectURL(new Blob([testo], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFileBackup();
  document.body.append(a);
  a.click();
  a.remove();
  /* Revocare subito annullerebbe il download su alcuni browser. */
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Legge un file e lo scrive al posto di quello che c'è. Sostituisce, non
   fonde: fondere due archivi vorrebbe dire decidere quale voce vince a
   parità di data, e non c'è una risposta giusta. Chi ripristina vuole
   tornare a uno stato preciso, non a un misto. */
async function importaBackup(testo) {
  let d;
  try { d = JSON.parse(testo); } catch { throw new Error("formato"); }
  if (!d || typeof d !== "object" || d.app !== NOME_APP
      || !Array.isArray(d.orologi) || !Array.isArray(d.registro)) {
    throw new Error("formato");
  }

  /* Ogni record passa da normalizza(): un backup scritto a mano, o di una
     versione futura, entra con la stessa frontiera di tutto il resto. */
  const nuovi = d.orologi.map(normalizza).filter(Boolean);
  const voci = d.registro.filter((v) => v && Number.isFinite(Number(v.quando)));

  await svuota("orologi");
  await svuota("registro");
  for (const o of nuovi) await salva("orologi", o);
  for (const v of voci) {
    const { id, ...resto } = v;   /* l'id lo rifà il deposito */
    await salva("registro", resto);
  }

  orologi = await leggiTutti("orologi");
  registro = await leggiTutti("registro");
  return { orologi: nuovi.length, voci: voci.length };
}




/* ============================= azioni =============================
   Ogni gesto scrive due cose: lo stato dell'orologio (le date che
   servono al calcolo) e una voce di registro (la storia). La storia è
   la verità: quando si toglie una voce, le date si ricalcolano da
   quello che resta, invece di indovinare a che punto eravamo.
   ------------------------------------------------------------------ */

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/* Fra il tocco e il ridisegno c'è un'attesa sul database: in quel varco il
   bottone è ancora vivo e un secondo tocco riparte. Tre tocchi rapidi su
   «Indossato» scrivevano tre voci. Qui il secondo tocco viene ignorato. */
let inCorso = false;
async function unaVolta(fn) {
  if (inCorso) return;
  inCorso = true;
  try { await fn(); } finally { inCorso = false; }
}

/* Se il controllo periodico aveva già mostrato una notifica per questo
   orologio, e ora l'hai indossato o caricato, il motivo di quella
   notifica non c'è più. Il tag vecchio («riserva-») resta nella pulizia
   per chi aggiorna con una notifica della versione precedente ancora
   aperta. */
async function ripulisciNotifica(id) {
  if (!("serviceWorker" in navigator) || !("Notification" in self)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    for (const tag of ["riposo-" + id, "riserva-" + id]) {
      (await reg.getNotifications({ tag })).forEach((n) => n.close());
    }
  } catch (e) { /* nessuna notifica da ripulire, o API non disponibile */ }
}

const fotografia = (o) => ({ ultimoPolso: o.ultimoPolso, ultimaLuce: o.ultimaLuce,
                             ultimoCrono: o.ultimoCrono, ultimaCarica: o.ultimaCarica });
const piuRecente = (a, b) => (a == null ? b : b == null ? a : Math.max(a, b));

/* Indossato. «quando» permette di segnare un giorno passato: l'hai
   messo ieri e te ne ricordi oggi. Una data passata non fa mai
   arretrare lo stato: se nel frattempo l'hai indossato di nuovo, vale
   la volta più recente. Due voci nello stesso giorno per lo stesso
   orologio non servono a niente: la seconda viene ignorata. */
async function segnaOra(o, quando = Date.now()) {
  if (registro.some((v) => v.orologio === o.id && v.azione === "reg.portato" && sameDay(v.quando, quando))) return;
  const prima = fotografia(o);
  o.ultimoPolso = piuRecente(o.ultimoPolso, quando);
  /* Su un carica-manuale il gesto del mattino è la corona, non il polso. */
  if (o.tipo === "manuale") o.ultimaCarica = piuRecente(o.ultimaCarica, quando);
  /* Indossarlo espone il quadrante alla luce: è una conseguenza fisica. */
  if (o.tipo === "ecodrive") o.ultimaLuce = piuRecente(o.ultimaLuce, quando);
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "reg.portato", quando, prima });
  registro = await leggiTutti("registro");
  ripulisciNotifica(o.id);
  ridisegnaTutto();
}

/* Caricato: il movimento ha girato, ma non era al polso. Azzera il
   conto dei giorni di riposo, non conta come giorno indossato. */
async function segnaCaricaOra(o) {
  if (registro.some((v) => v.orologio === o.id && v.azione === "reg.caricato" && sameDay(v.quando, Date.now()))) return;
  const ora = Date.now();
  const prima = fotografia(o);
  o.ultimaCarica = ora;
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "reg.caricato", quando: ora, prima });
  registro = await leggiTutti("registro");
  ripulisciNotifica(o.id);
  ridisegnaTutto();
}

/* Il cronografo si segna solo se lo dici tu: portarlo non vuol dire
   averlo azionato. */
async function segnaCronoOra(o) {
  const ora = Date.now();
  const prima = fotografia(o);
  o.ultimoCrono = ora;
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "crono.segnato", quando: ora, prima });
  registro = await leggiTutti("registro");
  ridisegnaTutto();
}

/* Una misura del cronocomparatore è un fatto della storia di
   quell'orologio come gli altri: sta nel registro, e per questo entra
   da sola nel backup senza un deposito nuovo nel database. Non tocca
   nessuna data: misurare non vuol dire indossare. */
async function salvaMisuraOra(o, r, posizione) {
  await salva("registro", {
    orologio: o.id, nome: o.nome, azione: "misura", quando: Date.now(),
    misura: { posizione, marcia: r.marcia, incertezza: r.incertezza,
              battuta: Number.isFinite(r.battuta) ? r.battuta : null,
              bph: r.bph, copertura: r.copertura },
  });
  registro = await leggiTutti("registro");
  ridisegnaTutto();
}

/* Le date di un orologio rifatte dalla sua storia, dopo che una voce è
   uscita. Per ogni campo vale la più recente fra le voci rimaste e lo
   stato che c'era prima della voce tolta: quello stato racconta tutto
   ciò che era successo prima, le voci rimaste quello che è successo dopo. */
function ricalcola(o, tolta) {
  const resto = registro.filter((x) => x.orologio === o.id && x.id !== tolta.id);
  const ultima = (...azioni) => {
    const v = resto.filter((x) => azioni.includes(x.azione)).map((x) => x.quando);
    return v.length ? Math.max(...v) : null;
  };
  const prima = (campo) => (tolta.prima ? tolta.prima[campo] ?? null : null);
  if (tolta.azione === "reg.portato") {
    o.ultimoPolso = piuRecente(ultima("reg.portato"), prima("ultimoPolso"));
    if (o.tipo === "ecodrive") o.ultimaLuce = piuRecente(ultima("reg.portato"), prima("ultimaLuce"));
    if (o.tipo === "manuale") o.ultimaCarica = piuRecente(ultima("reg.portato", "reg.caricato"), prima("ultimaCarica"));
  } else if (tolta.azione === "reg.caricato") {
    o.ultimaCarica = piuRecente(
      ultima(o.tipo === "manuale" ? "reg.portato" : "reg.caricato", "reg.caricato"), prima("ultimaCarica"));
  } else if (tolta.azione === "crono.segnato") {
    o.ultimoCrono = piuRecente(ultima("crono.segnato"), prima("ultimoCrono"));
  }
}

async function togliVoceOra(v) {
  const o = orologi.find((x) => x.id === v.orologio);
  if (o && v.azione !== "misura") {
    ricalcola(o, v);
    await salva("orologi", o);
  }
  await cancella("registro", v.id);
  registro = await leggiTutti("registro");
  ridisegnaTutto();
}

/* Annulla l'indossato di oggi: è togliere quella voce. */
async function annullaOggiOra(o) {
  const v = registro.find((x) => x.orologio === o.id && x.azione === "reg.portato" && sameDay(x.quando, Date.now()));
  if (v) await togliVoceOra(v);
}

const segna       = (o, quando) => unaVolta(() => segnaOra(o, quando));
const segnaCarica = (o) => unaVolta(() => segnaCaricaOra(o));
const segnaCrono  = (o) => unaVolta(() => segnaCronoOra(o));
const annullaOggi = (o) => unaVolta(() => annullaOggiOra(o));
const togliVoce   = (v) => unaVolta(() => togliVoceOra(v));
const salvaMisura = (o, r, p) => unaVolta(() => salvaMisuraOra(o, r, p));


/* ======================= impostazioni e passaggio ===================== */

async function leggiStato(chiave, prefinito) {
  try {
    const v = await tx("stato", "readonly", (s) => s.get(chiave));
    return v && v.valore !== undefined ? v.valore : prefinito;
  } catch (e) { return prefinito; }
}
const scriviStato = (chiave, valore) => salva("stato", { chiave, valore });

async function leggiSoglia() {
  const v = Number(await leggiStato("soglia", SOGLIA_PREDEFINITA));
  return SOGLIE.includes(v) ? v : SOGLIA_PREDEFINITA;
}
async function cambiaSoglia(n) {
  if (!SOGLIE.includes(n)) return;
  soglia = n;
  await scriviStato("soglia", n);
  ridisegnaTutto();
}

/* Gli orologi della versione precedente non sanno da quando sono in
   collezione. Senza quella data uno mai indossato non avrebbe un punto
   da cui contare. Si prende la voce di registro più vecchia che lo
   riguarda; se non ce n'è nessuna, oggi. Si fa una volta sola: dopo,
   il campo è scritto nel database. */
async function assicuraAggiunto() {
  for (const o of orologi) {
    if (o.aggiunto != null) continue;
    const sue = registro.filter((v) => v.orologio === o.id).map((v) => v.quando);
    /* Non la data di acquisto: prima di entrare nell'app l'orologio può
       essere stato portato mille volte, e contare da lì direbbe una
       cosa falsa. */
    const date = [...sue, o.ultimoPolso, o.ultimaCarica].filter((x) => x != null);
    o.aggiunto = date.length ? Math.min(...date, Date.now()) : Date.now();
    await salva("orologi", o);
  }
}
