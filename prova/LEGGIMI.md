# Banco di prova

Monta l'app in un DOM finto e controlla che si disegni davvero: due
pagine, carosello, registro, backup, stampa. Non sostituisce la prova sul
telefono, ma coglie tutto quello che si rompe prima dello schermo.

Serve una volta sola:

    npm install jsdom fake-indexeddb

Poi, da questa cartella:

    node monta.mjs

Esce con codice 1 se qualcosa non si disegna, così può stare dentro il
rilascio senza bisogno di leggere l'output.
