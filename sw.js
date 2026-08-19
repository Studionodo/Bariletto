/* Bariletto — service worker.
   Tutto nel guscio, font compresi: dopo l'installazione non serve più la rete. */

const CACHE = "bariletto-v150";

/* Portati dentro il service worker: nessuno dei tre tocca il DOM, solo
   IndexedDB e calcolo puro. bisogno() decide chi ha bisogno di
   attenzione, esattamente la stessa funzione che l'app usa in pagina —
   non una versione parallela da tenere sincronizzata a mano. */
importScripts("./lingua.js", "./archivio.js", "./dominio.js");

/* addAll è tutto o niente: se un solo file della lista non esiste,
   l'installazione fallisce per intero e il service worker non parte più.
   Qui dentro c'era ancora "./pagina.js", che con le due pagine non
   esiste, e mancava "./movimenti.js" — l'archivio dei movimenti, cioè
   settanta schede che offline non sarebbero mai state pronte. */
const GUSCIO = ["./", "./index.html", "./styles.css",
                "./lingua.js", "./calibri.js", "./movimenti.js",
                "./archivio.js", "./dominio.js",
                "./oggi.js", "./altro.js", "./foglio.js", "./cornice.js",
                "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
                "./font/fraunces.woff2", "./font/instrument-sans.woff2"];

self.addEventListener("install", (e) => {
  /* Niente skipWaiting qui: la nuova versione resta in attesa finché
     l'utente non accetta. Sostituire i file sotto una sessione aperta
     significa far convivere codice vecchio e file nuovi. */
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(GUSCIO)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  if (url.origin !== location.origin) return;

  /* Guscio: prima la cache, la rete solo per aggiornare. */
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return r;
      }).catch(() =>
        /* Solo per la navigazione. Rispondere index.html a una richiesta di
           script significherebbe servire HTML dove serve JavaScript. */
        e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()
      )
    )
  );
});

/* La cornice manda { tipo: "salta" }, qui si confrontava con la stringa
   "salta": non combaciavano mai, e il bottone «Aggiorna» non faceva
   niente — l'aggiornamento arrivava solo alla riapertura successiva.
   Accetto entrambe le forme, così nessuna delle due può più mancare. */
self.addEventListener("message", (e) => {
  const d = e.data;
  if (d === "salta" || (d && d.tipo === "salta")) self.skipWaiting();
});

/* ====================== controllo periodico ========================
   Il sistema decide lui quando svegliare questo gestore — non è un
   timer preciso. Quando succede, si legge lo stesso IndexedDB della
   pagina e si applica la stessa bisogno() che disegna l'anello: se
   qualcosa ha bisogno di attenzione, una notifica di sistema lo dice
   anche a app chiusa. */

self.addEventListener("periodicsync", (e) => {
  if (e.tag === TAG_SYNC) e.waitUntil(controllaRiserve());
});

async function linguaSalvata() {
  try {
    const v = await tx("stato", "readonly", (s) => s.get("lingua"));
    return (v && v.valore) || linguaPredefinita();
  } catch (e) { return "it"; }
}

async function controllaRiserve() {
  try {
    db = await apri();
    LINGUA = await linguaSalvata();
    const orologi = await leggiTutti("orologi");
    const chiedono = ["scarico", "riserva", "azionare", "fermo"];
    for (const o of orologi) {
      const b = bisogno(o);
      if (!chiedono.includes(b.stato)) continue;
      await self.registration.showNotification(NOME_APP, {
        body: o.nome + ": " + b.motivo,
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        /* Un tag per orologio: una nuova notifica per lo stesso pezzo
           sostituisce la precedente invece di accumularsi nel centro
           notifiche, controllo dopo controllo. */
        tag: "riserva-" + o.id,
      });
    }
  } catch (e) {
    /* Silenzioso: non c'è una pagina aperta a cui mostrare l'errore. */
  }
}
