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


/* ============================= azioni ============================= */

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/* Fra il tocco e il ridisegno c'è un'attesa sul database: in quel varco il
   bottone è ancora vivo e un secondo tocco riparte. Tre tocchi rapidi su
   «L'ho messo» scrivevano tre voci. Qui il secondo tocco viene ignorato. */
let inCorso = false;
async function unaVolta(fn) {
  if (inCorso) return;
  inCorso = true;
  try { await fn(); } finally { inCorso = false; }
}

/* Ogni voce porta con sé lo stato di prima: senza, annullare significherebbe
   indovinare a che punto eravamo. Con, è una restituzione esatta. */
/* Se il controllo periodico aveva già mostrato una notifica per questo
   orologio, e ora l'hai indossato, caricato o azionato — il motivo di
   quella notifica non c'è più. Lasciarla lì vorrebbe dire continuare a
   dire una cosa non più vera finché non arriva il prossimo controllo,
   che potrebbe essere ore dopo. Solo dove l'API esiste. */
async function ripulisciNotifica(id) {
  if (!("serviceWorker" in navigator) || !("Notification" in self)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const notifiche = await reg.getNotifications({ tag: "riserva-" + id });
    notifiche.forEach((n) => n.close());
  } catch (e) { /* nessuna notifica da ripulire, o API non disponibile */ }
}

/* Solo la primissima volta in assoluto che uno dei tre gesti viene
   usato: dopo, la stessa spiegazione resta raggiungibile dall'icona
   accanto a "Nessuno chiede attenzione", non sparisce per sempre — ma
   il popup che blocca compare una volta sola nella vita dell'app. */
async function mostraPrimoUsoSeServe() {
  const visto = await tx("stato", "readonly", (s) => s.get("vistoPrimoConteggio"));
  if (visto) return;
  await salva("stato", { chiave: "vistoPrimoConteggio", valore: true });
  apriInfoBloccante(t("primoUso.titolo"),
    [t("primoUso.testo1"), t("primoUso.testo2"), t("primoUso.testo3")],
    t("primoUso.bottone"));
}

async function segnaOra(o, ridisegnaSubito = true, controllaPrimoUso = true) {
  const ora = Date.now();
  const prima = { ultimoPolso: o.ultimoPolso, ultimaLuce: o.ultimaLuce,
                  ultimoCrono: o.ultimoCrono, ultimaCarica: o.ultimaCarica };
  o.ultimoPolso = ora;
  /* Su un carica-manuale il gesto del mattino è la corona, non il polso:
     il bottone lo dice, e qui si registra per quello che è. */
  if (o.tipo === "manuale") o.ultimaCarica = ora;
  /* Indossarlo espone il quadrante alla luce: è una conseguenza fisica.
     Il cronografo invece va premuto: quello non si deduce. */
  if (o.tipo === "ecodrive") o.ultimaLuce = ora;
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "reg.portato", quando: ora, prima });
  registro = await leggiTutti("registro");
  scelto = o.id;
  ripulisciNotifica(o.id);
  if (ridisegnaSubito) disegna();
  if (controllaPrimoUso) mostraPrimoUsoSeServe();
}

/* Annulla l'atto di INDOSSARE, non l'ultima cosa fatta: se nel frattempo
   hai anche caricato l'orologio, quella resta vera. E ripristina solo i
   campi che «L'ho messo» aveva toccato, non tutto lo stato di allora. */
async function annullaOggiOra(o) {
  const v = [...registro]
    .filter((x) => x.orologio === o.id && x.azione === "reg.portato" && sameDay(x.quando, Date.now()))
    .sort((a, b) => b.quando - a.quando)[0];
  if (!v) return;
  if (v.prima) {
    o.ultimoPolso = v.prima.ultimoPolso;
    if (o.tipo === "ecodrive") o.ultimaLuce = v.prima.ultimaLuce;
    if (o.tipo === "manuale") o.ultimaCarica = v.prima.ultimaCarica;
  }
  await salva("orologi", o);
  await cancella("registro", v.id);
  registro = await leggiTutti("registro");
  disegna();
}

/* Togliere una voce dal Registro.
   Se è l'ultima scritta per quell'orologio, le date tornano com'erano:
   quella voce sa cosa c'era prima. Se è una voce più vecchia, sparisce
   dalla storia e le date restano dove sono — perché lo stato di oggi
   discende dalle voci successive, non da quella. */
async function togliVoceOra(v) {
  const o = orologi.find((x) => x.id === v.orologio);
  const ultima = [...registro].filter((x) => x.orologio === v.orologio)
                              .sort((a, b) => b.quando - a.quando)[0];
  if (o && v.prima && ultima && ultima.id === v.id) {
    Object.assign(o, v.prima);
    await salva("orologi", o);
  }
  await cancella("registro", v.id);
  registro = await leggiTutti("registro");
  voceArmata = null;
  /* Chi cancella non deve sapere chi sta guardando: ridisegna la pagina
     e, se è aperto, anche il foglio del registro. */
  ridisegnaTutto();
}

const segna       = (o) => unaVolta(() => segnaOra(o));
const annullaOggi = (o) => unaVolta(() => annullaOggiOra(o));
const togliVoce   = (v) => unaVolta(() => togliVoceOra(v));
const segnaCarica = (o) => unaVolta(() => segnaCaricaOra(o));
const segnaCrono  = (o) => unaVolta(() => segnaCronoOra(o));

/* Il bottone principale di Oggi non ridisegna subito: salva, poi lascia
   che chi ha chiamato mostri una conferma con il nome dell'orologio
   appena segnato, e solo dopo passa al prossimo. Senza questo, un
   secondo tocco per abitudine può cadere su un orologio diverso, perché
   il bersaglio sotto il dito cambia nello stesso istante del tocco. */
function segnaConConferma(o, alConfermato) {
  /* Il popup bloccante "Come funziona il conteggio" e la conferma
     "Segnato, [nome]" si contendevano lo stesso istante: al primissimo
     tocco in assoluto comparivano quasi insieme, e il popup, a schermo
     intero, copriva la conferma per tutta la sua durata. Chi impiegava
     più di 4 secondi a leggere il popup non vedeva mai la conferma.
     Rimandando anche il controllo del primo utilizzo alla fine dei 4
     secondi, i due momenti non si accavallano più: prima la conferma
     ha il suo tempo per intero, poi, solo se serve, la spiegazione. */
  unaVolta(() => segnaOra(o, false, false)).then(() => {
    if (typeof alConfermato === "function") alConfermato(o.nome);
    setTimeout(() => { disegna(); mostraPrimoUsoSeServe(); }, 4000);
  });
}

/* Caricare senza indossare: gli orologi nel cassetto si caricano lo stesso. */
async function segnaCaricaOra(o) {
  const ora = Date.now();
  const prima = { ultimoPolso: o.ultimoPolso, ultimaLuce: o.ultimaLuce,
                  ultimoCrono: o.ultimoCrono, ultimaCarica: o.ultimaCarica };
  o.ultimaCarica = ora;
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "reg.caricato", quando: ora, prima });
  registro = await leggiTutti("registro");
  ripulisciNotifica(o.id);
  disegna();
  mostraPrimoUsoSeServe();
}

/* Il cronografo si segna solo se lo dici tu. */
async function segnaCronoOra(o) {
  const ora = Date.now();
  /* Mancava qui quello che segnaOra e segnaCaricaOra fanno già: senza
     "prima", cancellare questa voce dal Registro toglieva la riga ma
     lasciava ultimoCrono impostato per sempre, come se il gesto non si
     potesse mai disfare. */
  const prima = { ultimoCrono: o.ultimoCrono };
  o.ultimoCrono = ora;
  await salva("orologi", o);
  await salva("registro", { orologio: o.id, nome: o.nome, azione: "crono.segnato", quando: ora, prima });
  registro = await leggiTutti("registro");
  ripulisciNotifica(o.id);
  disegna();
  mostraPrimoUsoSeServe();
}
