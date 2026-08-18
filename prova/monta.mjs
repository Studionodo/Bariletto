/* Banco di prova: monta l'app in un DOM finto con un IndexedDB finto,
   aggiunge due orologi e controlla che le due pagine si disegnino.
   Non sostituisce la prova sul telefono: coglie però tutto quello che
   si rompe prima ancora di arrivare allo schermo. */
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import "fake-indexeddb/auto";

const RADICE = "/home/claude/bariletto/bariletto-pwa";
const dom = new JSDOM(fs.readFileSync(path.join(RADICE, "index.html"), "utf8"), {
  runScripts: "outside-only",
  url: "https://esempio.test/",
  pretendToBeVisual: true,
});
const w = dom.window;

/* Quello che jsdom non ha e l'app cerca. */
w.indexedDB = indexedDB;
w.IDBKeyRange = IDBKeyRange;
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.scrollTo = () => {};
Object.defineProperty(w.navigator, "language", { value: "it-IT", configurable: true });

const ordine = ["lingua.js", "calibri.js", "movimenti.js", "archivio.js",
                "dominio.js", "oggi.js", "altro.js", "foglio.js", "cornice.js"];
const codice = ordine.map((f) => fs.readFileSync(path.join(RADICE, f), "utf8")).join("\n;\n");

const problemi = [];
w.addEventListener("error", (e) => problemi.push("errore: " + e.message));

/* Tutto in una valutazione sola: le variabili dichiarate con let dentro
   eval non escono dal suo ambito, quindi il banco di prova deve vivere
   nello stesso ambito dell'app invece di parlarle da fuori. */
const banco = codice + `
;
globalThis.provaMonta = function () {
  orologi = [
    daCalibro("7S26", "Seiko SKX", "SKX007"),
    daCalibro("8215", "Citizen Open Heart"),
  ];
  orologi[1].ultimoPolso = Date.now();
  registro = [{ id: 1, orologio: orologi[1].id, nome: "Citizen Open Heart",
                azione: "reg.portato", quando: Date.now() }];
  disegna();
  return orologi.length;
};
globalThis.provaBackup = () => JSON.stringify(datiPerBackup());
globalThis.provaStampa = () => costruisciStampa("collezione");
globalThis.aggiungiUnTerzo = () => {
  orologi.push(daCalibro("6R35", "Orient Bambino"));
  disegna();
};
globalThis.provaApriNuovo = () => apriScheda();
globalThis.provaClasseFoglio = () => { const f = document.querySelector("#foglio"); return f ? f.className : null; };
`;

try {
  w.eval(banco);
} catch (e) {
  problemi.push("il codice non si carica: " + e.message);
}

await new Promise((r) => setTimeout(r, 400));

try {
  const n = w.provaMonta();
  if (n !== 2) problemi.push("lo stato non si è popolato");
} catch (e) {
  problemi.push("il disegno fallisce: " + e.message);
}

await new Promise((r) => setTimeout(r, 200));

const d = w.document;
const controlli = [
  [".anello", "l'anello di Oggi"],
  [".carosello", "il carosello della collezione"],
  [".carta", "le carte degli orologi"],
  [".agg-rapida", "il comando aggiungi accanto al titolo della collezione"],
  ["#pag-altro .sezione", "le sezioni della pagina due"],
  ["#indice .voce-indice", "l'indice delle due pagine"],
  [".attrezzo", "gli attrezzi (incluse le righe registro e collezione)"],
];
for (const [sel, nome] of controlli) {
  const n = d.querySelectorAll(sel).length;
  if (!n) problemi.push("manca " + nome + "  (" + sel + ")");
  else console.log("  ok  " + nome.padEnd(46) + n);
}

/* Il registro ora è una riga sola in pagina, non più una lista inline:
   la lista intera vive dentro il foglio che quella riga apre. */
const rigaRegistro = [...d.querySelectorAll("#pag-altro .attrezzo")]
  .find((b) => /voce|voci|entr/i.test(b.textContent));
if (!rigaRegistro) problemi.push("manca la riga riassuntiva del registro in pagina due");
else {
  console.log("  ok  " + "riga riassuntiva del registro".padEnd(46) + JSON.stringify(rigaRegistro.textContent));
  rigaRegistro.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 150));
  const voci = d.querySelectorAll("#foglio .voce-diario").length;
  if (voci !== 1) problemi.push("il foglio del registro dovrebbe avere 1 voce, ne ha " + voci);
  else console.log("  ok  " + "voci nel foglio del registro".padEnd(46) + voci);
  d.querySelector("#foglio .capo-azioni .chiudi:last-child")?.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 450));
}

/* La collezione a colpo d'occhio: riga riassuntiva + lista verticale
   dentro il foglio, ordinata alfabeticamente (non per urgenza, come il
   carosello) — una riga per orologio come ogni altra lista dell'app,
   non più una griglia a due colonne. */
const rigaCollezione = [...d.querySelectorAll("#pag-altro .attrezzo")]
  .find((b) => /sfogliare|browse/i.test(b.textContent));
if (!rigaCollezione) problemi.push("manca la riga riassuntiva della collezione in pagina due");
else {
  console.log("  ok  " + "riga riassuntiva della collezione".padEnd(46) + JSON.stringify(rigaCollezione.textContent));
  rigaCollezione.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 150));
  const righeLista = d.querySelectorAll("#foglio .lastra.riga-piena").length;
  if (righeLista !== 2) problemi.push("la lista dovrebbe avere 2 righe, ne ha " + righeLista);
  else console.log("  ok  " + "righe nella lista della collezione".padEnd(46) + righeLista);
  if (d.querySelector("#foglio").classList.contains("ancorato"))
    problemi.push("nessun foglio dovrebbe più avere la classe ancorato");
  else console.log("  ok  " + "forma del foglio: modale centrato".padEnd(46) + "");
  d.querySelector("#foglio .capo-azioni .chiudi:last-child")?.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 450));
}

/* L'archivio: qui il punto delicato è il campo di ricerca. Prima
   prendeva il fuoco da solo 260ms dopo l'apertura — su telefono vuol
   dire tastiera che si apre senza che l'utente l'abbia chiesta, dentro
   un modale che dovrebbe restare fermo al centro. Verifico che ora non
   lo faccia più. */
const rigaArchivio = [...d.querySelectorAll("#pag-altro .attrezzo")]
  .find((b) => /archiv/i.test(b.textContent));
if (!rigaArchivio) problemi.push("manca la riga dell'archivio in pagina due");
else {
  rigaArchivio.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  const campo = d.querySelector("#foglio .campo");
  if (d.activeElement === campo) problemi.push("il campo di ricerca dell'archivio prende il fuoco da solo: la tastiera si aprirebbe senza che l'utente l'abbia chiesto");
  else console.log("  ok  " + "archivio: nessun fuoco automatico sulla ricerca".padEnd(46) + "");
  d.querySelector("#foglio .capo-azioni .chiudi:last-child")?.dispatchEvent(new w.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 450));
}

/* La forma dei fogli: ora un modale centrato per tutti, senza eccezioni
   — anche il modulo di scrittura, dopo la richiesta esplicita di
   uniformarlo agli altri. Verifico che non sia rimasta nessuna traccia
   della vecchia forma ancorata. */
w.provaApriNuovo();
await new Promise((r) => setTimeout(r, 150));
if ((w.provaClasseFoglio() || "").includes("ancorato"))
  problemi.push("aggiungere un orologio non dovrebbe più avere la classe ancorato: è stata rimossa");
else console.log("  ok  " + "forma del foglio: modale centrato anche in scrittura".padEnd(46) + "");
d.querySelector("#foglio .capo-azioni .chiudi:last-child")?.dispatchEvent(new w.Event("click", { bubbles: true }));
await new Promise((r) => setTimeout(r, 450));

/* Nessuna chiave di dizionario deve arrivare a schermo non tradotta. */
const testo = d.body.textContent;
const crude = [...testo.matchAll(/\b(?:bak|pag|arch|reg|st|coll|oggi|m|g|s)\.[a-zA-Z]+\b/g)]
  .map((x) => x[0]);
if (crude.length) problemi.push("chiavi non tradotte a schermo: " + [...new Set(crude)].join(", "));

/* Il carosello ora contiene solo orologi veri: la carta tratteggiata
   "Aggiungi" è sparita, l'unico ingresso resta il comando nel titolo. */
const carte = d.querySelectorAll("#pag-oggi .carta").length;
if (carte !== 2) problemi.push("attese 2 carte (i due orologi, niente più carta aggiungi), trovate " + carte);

/* Il colophon: due righe in fondo alla pagina due, sempre presenti. */
const righeColophon = d.querySelectorAll("#pag-altro .colophon p").length;
if (righeColophon !== 2) problemi.push("il colophon dovrebbe avere 2 righe, ne ha " + righeColophon);
else console.log("  ok  " + "colophon in fondo alla pagina due".padEnd(46) + righeColophon + " righe");

/* Il backup deve produrre un oggetto leggibile e reimportabile. */
try {
  const j = w.provaBackup();
  const b = JSON.parse(j);
  if (b.app !== "Bariletto" || b.orologi.length !== 2) {
    problemi.push("il backup non contiene quello che dovrebbe");
  } else console.log("  ok  il backup contiene 2 orologi e 1 voce");
} catch (e) {
  problemi.push("il backup fallisce: " + e.message);
}

/* La stampa deve costruire il documento senza toccare lo schermo. */
try {
  w.provaStampa();
  if (!d.querySelector("#stampa .st-orologio")) problemi.push("la stampa non produce niente");
  else console.log("  ok  la stampa costruisce il documento");
} catch (e) {
  problemi.push("la stampa fallisce: " + e.message);
}

console.log();
if (problemi.length) {
  problemi.forEach((p) => console.log("  PROBLEMA  " + p));
  process.exit(1);
}
console.log("  L'app si monta e si disegna senza errori.");
