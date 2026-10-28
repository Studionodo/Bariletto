# Banco di prova

Apre l'app in un Chromium vero, con un database come lo lascia la v150
(`seme.html`), e controlla: migrazione, gesti, storia, cronocomparatore
con un battito sintetico al posto del microfono, nuovo orologio, soglia,
service worker e regola delle notifiche. Non sostituisce la prova sul
telefono, ma coglie tutto quello che si rompe prima dello schermo.

Serve una volta sola:

    npm install playwright
    npx playwright install chromium

Poi, da questa cartella:

    node prova.mjs

Esce con codice 1 se qualcosa non torna.
