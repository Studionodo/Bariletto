# Bariletto

Conta le ore che non guardi. Quale orologio mettere oggi, e cosa fargli.

*[Read this in English](README.en.md)*

## Cos'è

Bariletto è una web app (PWA) per chi ha più di un orologio meccanico o automatico e vuole sapere, ogni giorno, quale indossare e di cosa ha bisogno: carica, luce, cronometro, revisione. Funziona interamente offline, non ha server, non ha account: tutti i dati restano sul telefono di chi la usa.

## Cosa fa

- Suggerisce ogni giorno quale orologio della collezione merita attenzione, in base a quanto tempo è fermo o scarico.
- Registra con un tocco le azioni comuni: l'ho indossato, l'ho caricato, gli ho dato luce, ho azzerato il cronografo.
- Tiene un archivio di oltre 150 calibri meccanici e al quarzo, con le regole specifiche di ciascuno (autonomia di carica, finestre in cui non toccare la corona, tipo di scappamento).
- Segnala quando un orologio automatico rischia di fermarsi, o quando uno al quarzo si avvicina alla fine prevista della pila.
- Calcola una data indicativa per la prossima revisione, se inserisci acquisto e ultima manutenzione.
- Notifiche di sistema opzionali (solo Android/Chrome) per non dimenticare un orologio fermo da troppo.
- Registro cronologico di ogni azione fatta su ogni orologio, consultabile per intero.

## Come funziona

Bariletto non misura la carica minuto per minuto: registra un solo dato per azione, il momento dell'ultimo tocco, e da lì calcola cosa serve fare in base al calibro specifico di quell'orologio. È una stima costruita sulle specifiche tecniche dichiarate dai produttori, non una misura diretta della riserva di carica reale.

## Tecnologia

JavaScript puro, senza framework. Dati salvati in locale nel browser (IndexedDB). Nessuna libreria esterna, nessuna chiamata a server propri.

## Uso

Apri l'app da browser su `bariletto.vercel.app`, oppure installala come app dal menu del browser per usarla offline dalla schermata home.

## Licenza

Vedi [LICENSE](LICENSE).
