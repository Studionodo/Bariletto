/* Bariletto — service worker.
   Tutto nel guscio, font compresi: dopo l'installazione non serve più la rete. */

const CACHE = "bariletto-v176";

/* Portati dentro il service worker: nessuno dei tre tocca il DOM, solo
   IndexedDB e calcolo puro. daFarGirare() decide chi riceve la
   notifica: è la stessa funzione che disegna la pagina, non una copia
   parallela da tenere sincronizzata a mano. */
importScripts("./lingua.js", "./archivio.js", "./dominio.js");

/* addAll è tutto o niente: se un solo file della lista non esiste,
   l'installazione fallisce per intero e il service worker non parte più.
   Ogni file dell'app deve stare qui: verifica.py controlla che nessuno
   di quelli caricati da index.html manchi. */
const GUSCIO = ["./", "./index.html", "./styles.css",
                "./lingua.js", "./calibri.js", "./movimenti.js",
                "./archivio.js", "./dominio.js", "./crono.js",
                "./cornice.js", "./pagina.js", "./scheda.js",
                "./misura.js", "./impostazioni.js",
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
   Il sistema decide lui quando svegliare questo gestore: non è un timer
   preciso. Quando succede si legge lo stesso IndexedDB della pagina e
   si applica la stessa regola che disegna la pagina: un orologio che
   non gira da più giorni della soglia riceve una notifica, anche ad app
   chiusa. La frase dice solo da quanti giorni non lo indossi: nessun
   consiglio tecnico, non siamo orologiai.

   Una notifica sola per periodo di riposo. Senza questo freno ogni
   controllo, due volte al giorno, ripeterebbe la stessa cosa. Se resta
   ancora fermo, se ne riparla dopo un'altra soglia intera. */

self.addEventListener("periodicsync", (e) => {
  if (e.tag === TAG_SYNC) e.waitUntil(controllaRiposi());
});

/* Toccare la notifica apre l'app, o la riporta davanti se è già aperta. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const aperte = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (aperte.length) return aperte[0].focus();
    return self.clients.openWindow("./");
  })());
});

async function controllaRiposi() {
  try {
    db = await apri();
    LINGUA = await leggiStato("lingua", linguaPredefinita());
    soglia = await leggiSoglia();
    const orologi = await leggiTutti("orologi");
    for (const o of orologi) {
      if (!daFarGirare(o)) continue;
      const chiave = "avvisato-" + o.id;
      const avvisato = await leggiStato(chiave, null);
      const giro = ultimoGiro(o) ?? 0;
      if (avvisato != null && avvisato > giro && giorniCalendario(avvisato) < soglia) continue;
      await self.registration.showNotification(NOME_APP, {
        body: t("notif.testo", { nome: o.nome, g: plurale(giorniSenzaPolso(o), "giorno_", "giorniPl") }),
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        /* Un tag per orologio: una notifica nuova per lo stesso pezzo
           sostituisce la precedente invece di accumularsi. */
        tag: "riposo-" + o.id,
      });
      await scriviStato(chiave, Date.now());
    }
  } catch (e) {
    /* Silenzioso: non c'è una pagina aperta a cui mostrare l'errore. */
  } finally {
    /* La connessione chiusa subito: tenuta aperta, bloccherebbe un
       eventuale aggiornamento del database dalla pagina. */
    try { db && db.close(); } catch (e) {}
  }
}
