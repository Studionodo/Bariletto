# Bariletto

## Cosa fa l'app

Bariletto è una web app (PWA) per chi possiede più di un orologio meccanico, automatico o al quarzo e vuole sapere, ogni giorno, quale indossare e di cosa ha bisogno.

Il problema che risolve: un orologio meccanico che resta fermo nel cassetto si scarica, e ognuno lo fa a un ritmo diverso — un automatico regge poche decine di ore, un Eco-Drive mesi, un manuale non si ricarica da solo per niente. Nessuno tiene a mente le regole di ogni singolo calibro della propria collezione. Bariletto sì.

Ogni giorno, aprendo l'app, un solo orologio viene proposto: quello che ha più bisogno di attenzione in questo momento, calcolato sul calibro specifico che monta, non su una soglia generica uguale per tutti. Un tocco registra il gesto — indossato, caricato, azionato il cronografo — e da lì l'app riparte a contare.

Le altre cose che fa:
- Tiene un catalogo di 158 calibri meccanici, al quarzo e ibridi, ciascuno con le proprie regole (riserva di carica, finestre orarie in cui non toccare la corona, tipo di scappamento, frequenza).
- Se un calibro non è a catalogo, si dichiara a mano: tipo, riserva, frequenza, e l'app lo tratta esattamente come uno di catalogo da quel momento in poi.
- Un archivio di 151 schede tecniche approfondite (una per movimento o famiglia di movimenti), con come è fatto, come si cura, cosa è normale che faccia, e le fonti.
- Un registro cronologico di ogni azione fatta su ogni orologio, consultabile per intero, con la possibilità di cancellare una voce e tornare esattamente allo stato precedente.
- Un backup completo in un file JSON, esportabile e reimportabile: nessun account, nessuna nuvola, il file resta sul dispositivo.
- Notifiche di sistema opzionali (solo Android/Chrome, per app installate) per non dimenticare un orologio fermo da troppo, anche ad app chiusa.
- Stampa di due documenti pensati per durare: il foglio della collezione (da tenere nella scatola o dare all'orologiaio) e il registro completo in tabella.
- Tutto in italiano e in inglese, cambiabile in ogni momento.

Funziona interamente offline, non ha server, non ha account: tutti i dati restano sul dispositivo di chi la usa, in IndexedDB. Nessuna chiamata a server propri, nessun modo per chiunque, compreso chi l'ha costruita, di sapere quando viene aperta.

## Come conta

Bariletto non misura la carica minuto per minuto: registra un solo dato per azione, il momento dell'ultimo tocco, e da lì calcola cosa serve fare in base al calibro specifico di quell'orologio. È una stima costruita sulle specifiche tecniche dichiarate dai produttori, dichiarata come tale, non una misura diretta della riserva reale.

## L'architettura di oggi

Il codice è diviso per competenza, e l'ordine di caricamento (vedi `index.html`) è una catena: ogni file usa solo quelli sopra di sé.

| file | cosa fa |
|---|---|
| `lingua.js` | dizionario italiano/inglese (259 chiavi), `t()` e `plurale()` |
| `calibri.js` | 97 famiglie, 158 calibri, con la fonte del dato |
| `movimenti.js` | generato da `archivio/costruisci.py`, 151 schede tecniche |
| `archivio.js` | IndexedDB, le azioni che scrivono, backup, notifiche |
| `dominio.js` | cosa chiede un orologio (`bisogno`), quali gesti vuole (`gesti`), `normalizza` |
| `oggi.js` | la prima pagina: l'anello, la carta del gesto, la collezione a carosello |
| `altro.js` | la seconda pagina: registro, collezione a elenco, attrezzi, stampa |
| `foglio.js` | aggiungere, modificare, eliminare un orologio; archivio; registro completo |
| `cornice.js` | testata, indice delle due pagine, misure, avvio |
| `sw.js` | service worker: guscio in cache, controllo periodico delle riserve |

`dominio.js` non contiene una riga di interfaccia: si può leggere e verificare senza sapere niente di come è fatta la schermata.

Non esiste più `pareti.js`: l'app aveva quattro pareti scorrevoli (Oggi, Collezione, Il gesto, Registro), sostituite da due sole pagine (Oggi, Altro) che scorrono in orizzontale come schede di un indice, ciascuna organizzata in sezioni verticali invece che in schermate separate. La riscrittura ha anche tolto nastro dei nomi, trascinamento orizzontale a mano, parallasse e indici di parete: uno scorrimento nativo del browser fa lo stesso lavoro con meno codice e meno posti dove annidare bug.

- `index.html` — il guscio
- `font/` — Fraunces e Instrument Sans, auto-ospitati
- `styles.css` — token, palette Vanac, tipografia, l'anello incassato
- `manifest.webmanifest` — nome, icone, colori, standalone
- `icon-*.png` — 192, 512, 512 maskable
- `archivio/` — le schede tecniche scritte a lotti (markdown), più gli script Python che le trasformano in `movimenti.js` e ne verificano il contenuto ad ogni rilascio
- `LICENSE`, `README.md`, `README.en.md` — licenza e presentazione pubblica del progetto

## La schermata di oggi

Un elenco, non una vetrina. Tutti gli orologi della collezione, ordinati per bisogno: in cima chi chiede più attenzione, in fondo chi sta bene. Il primo ha una riga più alta, con bordo e il gesto in evidenza, ma resta parte dello stesso elenco: non è una sezione separata, quindi non può ripetere un orologio già mostrato.

**Lo stato viene prima del nome.** È la scelta che regge tutta la schermata. Oggi non è un catalogo: per sfogliare c'è la collezione, e c'è il Registro. Risponde a una domanda sola, di chi devo occuparmi adesso. Col nome in testa bisognerebbe leggere ogni riga per intero per saperlo; con lo stato in testa l'occhio scorre e chi sta male salta fuori da solo. Il nome resta, più piccolo: serve a identificare, non a farsi cercare.

Il colore vive sul pallino e sul cerchio del gesto, non sul testo dello stato: con lo stato in corpo grande, colorarlo lo renderebbe meno leggibile proprio dove deve leggersi meglio. Il colore dice quanto urge, il testo dice cosa serve.

Non c'è più il quadrante disegnato. Occupava un terzo dello schermo per ospitare del testo dentro un cerchio: il testo andava a capo male, e l'elemento più grande della pagina non portava nessuna informazione. Chi non ha bisogno di niente non sparisce dall'elenco, resta più indietro degli altri.

Dopo il tocco sulla riga in cima, una conferma col nome dell'orologio appena segnato resta a schermo quattro secondi prima che l'elenco si riordini. Serve a evitare che un secondo tocco per abitudine cada su un orologio diverso, dato che l'ordine cambierebbe altrimenti nello stesso istante del primo tocco.

## I gesti

Tre gesti distinti, ognuno registrato a modo suo:

- **Indossato oggi** — il gesto principale. Su un carica-manuale segna anche la carica, perché il gesto del mattino è la corona; su un Eco-Drive segna anche l'esposizione alla luce, conseguenza fisica dell'indossarlo.
- **Caricato, ma non indossato** — per un carica-manuale che tieni pronto nel cassetto senza portarlo oggi.
- **Ho azionato anche il cronografo** — separato dagli altri due: portare un cronografo non vuol dire averlo azionato, i pulsanti vanno premuti apposta.

Ogni voce del registro porta con sé lo stato precedente: cancellarla non è una stima, è una restituzione esatta a com'era prima.

Alla primissima volta in assoluto che si usa uno di questi tre gesti, un popup spiega come funziona il conteggio. Compare una volta sola nella vita dell'app, e resta raggiungibile per sempre dall'icona accanto a «Nessuno chiede attenzione». Aspetta che l'eventuale conferma del gesto abbia il suo tempo pieno prima di aprirsi, per non coprirla.

## Aggiungere un orologio

Due strade, entrambe dentro lo stesso modulo:

**Dal catalogo.** Una ricerca compatta mostra fino a quattro suggerimenti mentre scrivi; «Cerca nel catalogo» apre l'elenco intero a schermo pieno se serve sfogliare di più.

**Dichiarato a mano**, se il calibro non è a catalogo: tipo di movimento, riserva di carica (in ore per i tipi meccanici, in giorni per quelli a batteria), e per i tipi con un vero bilanciere (automatico, manuale, cronografo) la frequenza in A/H — cinque valori comuni pronti al tocco (28.800, 21.600, 18.000, 25.200, 36.000, che insieme coprono oltre il 95% dei calibri meccanici reali), più una matita per il caso raro in cui serva un valore diverso. Cambiare tipo aggiorna riserva e frequenza a un default sensato per quel tipo.

Il testo digitato nella ricerca, se non trovi il calibro, diventa il nome del movimento invece di sparire nel nulla.

## L'archivio dei calibri

`calibri.js`: 97 famiglie e 158 calibri che ereditano dalla propria famiglia scrivendo solo ciò che cambia. Ogni voce dichiara **da dove viene il dato** nel campo `fonte`: `ufficiale` (documentazione del produttore), `comunita` (fonti di settore concordi), `derivato` (ereditato dalla famiglia, mai verificato sul singolo calibro). L'app lo mostra nella scheda con un pallino colorato e una riga di spiegazione, non lo nasconde.

Il dettaglio della verifica, calibro per calibro, sta in **VERIFICA.md**.

## L'archivio dei movimenti

Le schede tecniche scritte a lotti in `archivio/` (markdown, 151 schede su 31 lotti) diventano `movimenti.js` tramite `archivio/costruisci.py`, eseguito automaticamente ad ogni rilascio da `rilascia.py`. Ogni scheda ha *come è fatto*, *come si cura*, *cosa è normale*, e le fonti, in italiano e in inglese.

Dentro la scheda di ogni orologio, se il suo calibro ha una voce nell'archivio, compare «Leggi di più su questo calibro»: `trovaVoceArchivio()` in `dominio.js` prova prima il calibro esatto, poi la sua famiglia, così una scheda sulla famiglia intera si aggancia a ogni calibro specifico di quella famiglia.

## Backup

Un file JSON scaricabile con l'intera collezione e il registro, dagli Attrezzi della pagina Altro. Reimportarlo **sostituisce** tutto quello che c'è, non lo fonde: chi ripristina vuole tornare a uno stato preciso, non a un misto. Nessun account, nessuna nuvola: un file, sul dispositivo, leggibile.

## Notifiche

Controlli periodici in background, solo su Chrome per Android con l'app installata: il sistema decide lui l'intervallo reale in base a quanto usi l'app, non è un timer preciso. Su iOS, desktop o altri browser la funzione semplicemente non c'è, e l'app lo dice subito invece di far finta che il bottone funzioni ovunque.

## Stampa

Due documenti separati, con scopi opposti:

- **La collezione** — calibro, riserva, gesti. Solo dati che fra un anno saranno ancora veri: niente stati né date d'uso, perché la carta non si aggiorna.
- **Il registro** — tutte le voci in tabella, con data piena. Non è un backup: da un foglio non si ripristina niente, si ribatte a mano.

## Accessibilità

Ogni foglio che si apre (aggiungere/modificare un orologio, i pannelli informativi, il registro completo, la collezione a elenco, l'archivio) dà il fuoco al proprio titolo, mai al primo campo di testo: un titolo non apre la tastiera da solo, ma resta comunque un punto di riferimento per chi naviga da tastiera o con uno screen reader, dopo che il resto della pagina è stato reso `inert`.

## Lingue

`lingua.js` contiene tutto il testo visibile, in italiano e in inglese, 259 chiavi in perfetta parità fra le due. Nessuna stringa vive fuori da lì. Alla prima apertura la lingua viene dalla lingua del dispositivo; si cambia in fondo alla pagina Altro.

## Aggiornamenti

Il service worker **non** fa `skipWaiting`: una versione nuova resta in attesa e l'app lo dice con una striscia in basso. Solo toccando *Aggiorna* la nuova versione prende il posto e la pagina si ricarica. La versione della cache si alza a ogni rilascio in `sw.js`.

## Da dove viene il disegno

**I colori** prendono il quadrante di un King Seiko SLA083 (il Vanac blu-violetto con lo skyline di Tokyo) come riferimento diretto, non come ispirazione generica: sono campionati dall'immagine vera. Il quadrante disegnato che l'app mostrava in apertura non c'è più, la palette che ne è nata sì.

**Il materiale** ibrida le due lezioni che iOS 27 e Android 17 hanno imparato nel 2026, un anno in cui i due sistemi hanno smesso di divergere: Android ha adottato le superfici traslucide di Apple, e Apple ha passato l'anno a rendere le proprie leggibili. L'ibridazione onesta non è mettere insieme un po' dell'uno e un po' dell'altro, è prendere il punto in cui sono arrivati entrambi: vetro, con il contrasto sotto controllo.

Le superfici sono semitrasparenti con sfocatura, e raccolgono il bagliore d'ambiente che cambia con le quattro fasce orarie: il pannello si tinge dell'ora del giorno da solo. Quel bagliore esisteva già nell'app, ma restava dietro tutto senza che niente lo usasse. `color-mix` tiene il vetro agganciato alle stesse variabili di fascia, così non esistono valori paralleli da mantenere a mano.

Ogni superficie ha due orli: uno scuro sotto per dare profondità e staccarla dal fondo, uno chiaro sopra per darle spessore. È precisamente la correzione che iOS 27 ha introdotto dopo un anno di lamentele: senza l'orlo scuro il vetro galleggia senza peso.

**Il contrasto** è stato misurato, non stimato. Il vetro rischiava di ripetere l'errore che Apple ha dovuto rincorrere, e in effetti il primo tentativo mandava il testo secondario all'alba a 4,04:1, sotto soglia. Ma la lastra a tinta piena che c'era prima stava a 3,04:1: il problema esisteva già, peggiore. Un velo scuro sotto il vetro, calibrato al minimo misurato che serve (32%), porta il caso peggiore a 4,65:1 in tutte e quattro le fasce con il bagliore acceso al massimo.

**Le forme** seguono l'importanza: otto raggi in scala invece dei quattro di prima, quando ogni elemento nuovo finiva per riusare quello della lastra anche senza esserlo.

**Le forme e il movimento** seguono il linguaggio di Android 16, senza toccare un colore: pastiglie piene per i comandi, 16px per righe e campi, 28px per il foglio che sale dal basso, la molla per ciò che si sposta e mai per opacità o colore.

**Il contrasto** è stato misurato nel browser, non solo a tavolino, su tutte e quattro le fasce orarie (alba, giorno, crepuscolo, notte) che l'ambiente attraversa da solo seguendo l'ora vera: titolo oltre 10:1, calibro e stato fra 4,6 e 5,3:1, sempre sopra il minimo per il testo che li ospita.

**I font** sono auto-ospitati e precaricati dal service worker: l'app funziona dalla prima apertura anche senza rete.

## Da sistemare

- Il link "Offrimi un caffè" in fondo alla pagina Altro punta ancora a `ko-fi.com/istantelabs/tip`, il vecchio nome del marchio: lasciato così di proposito, in attesa di conferma sull'indirizzo giusto.
- `archivio/verifica.py` controlla conteggi e traduzioni ma non i riferimenti incrociati (id di famiglia duplicati, calibri orfani): un controllo del genere avrebbe intercettato da solo un bug reale già corretto in una versione precedente.
- Il tracciamento manuale della verifica calibro per calibro in **VERIFICA.md** si è fermato a 56 calibri; i 102 aggiunti dai lotti successivi hanno già il campo `fonte` dichiarato in `calibri.js`, ma non sono ancora passati dalla stessa checklist esplicita.
