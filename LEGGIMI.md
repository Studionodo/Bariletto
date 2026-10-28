# Bariletto

## Una pagina sola

Non ci sono più pareti. Una colonna che scorre, in un ordine solo:

    data di oggi
    l'anello — l'orologio che chiede attenzione (si tocca: apre la scheda)
    il motivo, e l'azione del giorno
    LA COLLEZIONE — ordinata per urgenza, ogni riga apre la sua scheda
    aggiungi un orologio
    REGISTRO — le ultime tre voci, poi «Vedi tutto» apre il foglio
    ATTREZZI — stampa, lingua, caffè

**Il diario sta in un foglio, non in pagina.** È l'unica cosa che cresce
senza limite: una riga per ogni giorno d'uso, per sempre. In fondo alla
pagina avrebbe allungato tutto all'infinito. Le ultime tre bastano a dire
che l'app sta contando; il resto è a un tocco.

Sono spariti: nastro dei nomi, filetto scorrevole, trascinamento
orizzontale, parallasse, indici di parete, il filtro «solo attenzione».
Ognuno di quei pezzi era anche un posto dove si erano annidati dei bug —
il più recente, due `vai(1)` che dopo un cambio di struttura puntavano
alla parete sbagliata.

**Lo scorrimento si conserva a ogni ridisegno.** Senza, toccare «L'ho
messo» a metà pagina riportava in cima.

Cosa è sopravvissuto intatto alla riscrittura: i 56 calibri verificati,
l'archivio con il cancello anti-doppio-tocco, il dizionario, tutto il
dominio (`bisogno`, `gesti`, `normalizza`), il quadrante Vanac, le due
funzioni di misura dell'anello, i due documenti di stampa.

## L'anello si tocca

L'anello di Oggi apre la scheda del suo orologio. Prima, con un orologio
solo in collezione, non c'era nessuna riga da toccare per raggiungere
Modifica ed Elimina — bisognava prima indossarlo, senza motivo, così che
scendesse nella lista come riga cliccabile. Ora l'anello stesso è quel
bersaglio.

Verificato che il trascinamento fra le pareti resta intatto partendo
proprio dall'anello: naviga, non apre la scheda per sbaglio.

## Il cestino, non la spunta

Nel Registro, il secondo tocco su una voce armava la cancellazione
mostrando un segno di spunta verde. Ma una spunta dice «confermato», non
«sto per cancellare» — non comunicava l'azione. Ora mostra un'icona di
cestino, coerente con lo stile a tratto sottile del resto dell'app.

## Due finestre proibite sullo stesso calibro

Il campo `finestra` presuppone che la data e il giorno condividano lo
stesso divieto orario. Sul Miyota 8205 non è vero: la scheda tecnica
Miyota vieta la data fra le 21 e l'1, il giorno fra l'1 e le 4:30 —
consecutive ma diverse. Aggiunto `finestraGiorno`, opzionale: se un
calibro lo dichiara, `gesti()` genera un messaggio che nomina entrambe le
finestre invece del generico «tra le X e le Y». Tutti gli altri calibri,
senza `finestraGiorno`, restano invariati — verificato che il 4R35 produce
esattamente lo stesso testo di prima.

`oraScritta()` non gestiva le mezz'ore: 4.5 usciva come "4.5" letterale in
italiano. Estesa per riconoscere `.5` e scrivere "4 e mezza" / "4:30 am".

## Il campo `scheda`: un calibro che punta alla scheda di un altro

Il 6498 è il 6497 con i piccoli secondi a ore 6 invece che a ore 9 — stesso
movimento. Due schede sarebbero quasi identiche, e una correzione futura ne
aggiornerebbe una sola. `scheda: "eta-6497-1"` sul 6498 le fa condividere.

**Un calibro il cui nome mente da solo: l'899/899AC.** JLC chiama
"Calibre 899" sia il movimento pre-2020 (43h di riserva, 219 pezzi) sia
l'aggiornamento con scappamento al silicio (70h, 218 pezzi). Due orologi
con la stessa scritta sul ponte, riserve diverse — e dal nome non si
distinguono. Il database usa la cifra prudente, 43h: chi possiede in
realtà l'899AC lo scoprirà caricato prima del previsto, non a corto di
riserva. Stesso principio del SW500 — fra due letture, quella che non fa
danni se sbagliata.

**Ripetuto ancora l'errore del prefisso inutile, stavolta su Patek e
Vacheron.** `P324`, `P240`, `V2460` non evitavano nessuna collisione —
erano abitudine, non necessità — e rompevano l'aggancio con `patek-324`,
`patek-240`, `vacheron-2460`. Terza volta dopo Hangzhou e
Waltham/Elgin/Hamilton. La regola resta: id nudo per default, un prefisso
solo se una collisione lo richiede davvero, verificato prima di scrivere.

**Il criterio per usarlo, e perché non va applicato in blocco.** Un audit su
tutti i 98 calibri ha trovato 20 casi «senza scheda propria ma con un
fratello di famiglia che ce l'ha». Aliasarli tutti sarebbe stato un
disastro: il 4R36 ha una finestra della data diversa dal 4R35, ed è
esattamente l'errore da cui è nato tutto questo lavoro. Il criterio
verificabile è: alias **solo se la scheda nomina esplicitamente quel
calibro nel proprio titolo**. Su 20 casi ne è passato uno solo — il 4R36,
perché la sua scheda si intitola «Seiko 4R35 / 4R36». Gli altri 19 restano
senza scheda, ed è giusto così.

Verificato che l'alias non contamina i dati: il 4R36 continua a dichiarare
la sua finestra 21-4, diversa dal 21-1 del 4R35.

**Stato della copertura:** 62 calibri su 98 hanno una scheda d'archivio.

## L'archivio dentro l'app

Le schede scritte a lotti (cartella `archivio/`, markdown) sono ora dati
veri: `movimenti.js` le trasforma in un array `ARCHIVIO`, generato da
`archivio/costruisci.py`. Il file va rigenerato a mano ogni volta che
arriva un lotto nuovo — non c'è ancora un comando unico che lo fa da solo.

**Il ponte che vale di più**: dentro la scheda di ogni orologio, se il suo
calibro ha una voce nell'archivio, compare "Leggi di più su questo
calibro". `trovaVoceArchivio()` in `dominio.js` prova prima il calibro
esatto, poi la sua famiglia — è così che «Citizen Eco-Drive», una scheda
sulla famiglia intera, si aggancia a ogni Eco-Drive specifico.

**Il Sellita SW500 non è incluso.** Il lotto 2 conteneva un consiglio
verificato come sbagliato sulla correzione rapida della data, e la
correzione chiesta alla chat esterna non è mai arrivata: il file rimandato
era identico all'originale. Resta fuori finché non arriva davvero
corretto — vedi `archivio/costruisci.py`, la riga che lo esclude a mano.

Il primo lotto (otto schede) non aveva la riga `<!-- id -->` — è arrivato
prima che quel requisito entrasse nel prompt. I suoi id sono mappati a
mano dentro `costruisci.py`, nel dizionario `ID_LOTTO1`.

## Il logo

`logo-bariletto-fonte.png` — un'illustrazione del movimento generata con
Gemini, scelta al posto della versione costruita in codice dopo il
confronto diretto fra le due.

**È un'immagine raster (PNG), non un vettoriale.** A differenza del
tentativo precedente non c'è un file `.svg` sorgente: le tre icone
(`icon-192`, `icon-512`, `icon-512-maskable`) sono ritagliate e
ridimensionate direttamente da questa immagine a 1024×1024.

Il file arrivava con un margine bianco pieno su tutta la cornice. Reso
trasparente **con un flood fill dai quattro angoli**, non con una soglia di
colore globale: una soglia avrebbe reso trasparenti anche i riflessi quasi
bianchi dentro il meccanismo (l'acciaio del bilanciere), perché non sono
collegati all'angolo per un percorso continuo di pixel chiari.

Per la mascherabile il soggetto è ricentrato su un fondo pieno
`--room` (crepuscolo) al 72% di scala, dentro la safe zone che Android
richiede. Un primo tentativo aveva un bug di composizione: convertendo da
RGBA a RGB senza comporre sull'alfa, il bianco originale dei quattro angoli
transparenti tornava visibile — corretto componendo esplicitamente
sull'immagine di fondo prima di appiattire.

Non ha i vincoli di leggibilità a 40px né il controllo sul tratto che aveva
la versione in codice: è una scelta estetica dichiarata, non un limite
tecnico ignorato.

## Forma e movimento

Il linguaggio delle forme e del movimento è quello di Android 16, adottato
**senza toccare un solo colore**. Token in cima al CSS.

**Le forme.** Un cerchio grande accanto a rettangoli a spigolo vivo era la
vera incoerenza: adesso tutto si arrotonda verso l'anello.

| token | valore | dove |
|---|---|---|
| `--r-chip` | pastiglia piena | comandi, segmenti, avviso |
| `--r-lastra` | 16px | righe, campi, contenitori |
| `--r-foglio` | 28px | il foglio che sale dal basso |
| `--r-premuto` | 14px | la pastiglia sotto il dito |

**Il movimento.** `--molla` ha lo slancio oltre il bersaglio, `--piano` no.
Regola: lo slancio vale per ciò che si sposta, mai per opacità e colore.

**Le pareti restano senza slancio**, ed è deliberato: oltre l'ultima si
vedrebbe il vuoto. La molla sta nel nastro, nel filetto d'oro e nel foglio,
che possono permettersela.

**Risposta al tocco.** Ogni comando rientra di un 3% e la pastiglia si
squadra: è il gesto di risposta di Android 16 e costa due righe.

**Maniglia sul foglio**, perché si capisca che sale e scende.

### Cosa NON ho preso

L'indicatore a pastiglia piena sotto la sezione attiva, che in Material
sostituirebbe il filetto d'oro. È l'identità della testata: il filetto resta.
Non ho toccato l'anello inciso, il marchio, né un solo valore di colore.

## Gli indici alla stessa discrezione delle scanalature

Nascevano come riempimento pieno e opaco — un gradiente da quasi bianco a
grigio metallo — mentre le scanalature radiali erano già all'8% di
opacità. Ora sono un bianco semplice al 10%, vicino alle scanalature: il
gradiente a tre toni non si distingueva più a quel livello, quindi l'ho
tolto invece di lasciarlo a fare niente.

**E il cerchio dorato interno è sceso da 62% a 32%.** Lasciarlo alto avrebbe
invertito la gerarchia vera di un quadrante: gli indici segnano le ore, i
cerchi decorano il bordo — non il contrario. A 62% il cerchio sarebbe
diventato l'elemento metallico più visibile di tutta la fascia, più degli
stessi indici che dovrebbe solo delimitare.

## L'architettura del quadrante

Del Vanac avevo preso il colore e la rigatura, non la sua struttura — e per
questo l'anello sembrava un orologio qualunque. Misurata sulla foto,
scandendo dal centro al bordo:

| raggio | cosa c'è |
|---|---|
| 0 → 0,74 | campo piatto, rigato in orizzontale |
| 0,75 | cerchio d'oro |
| 0,78 | filo d'argento |
| 0,80 → 0,95 | corona scanalata con dodici indici applicati |
| 0,97 → 1,00 | ghiera d'oro esterna |

Indici e scanalature sono generati con la trigonometria, non disegnati a
mano: dodici indici a trenta gradi l'uno dall'altro, quello delle dodici più
largo, e settantadue scanalature radiali.

**Il testo vive nel cerchio d'oro, non in tutto l'anello.** Con una
semilarghezza del 28% del diametro, la corda del cerchio interno lascia
un'altezza utile del 46%: oltre, le righe finiscono sugli indici. Provato
con un nome lunghissimo a 320, 360 e 430px.

## Niente cassa attorno all'anello

C'era stata, per un giorno: una sagoma a cuscino con gli spigoli smussati
e la corona alle tre, disegnata attorno all'anello. Aveva senso quando il
quadrante era un disco liscio — dava un corpo di metallo a qualcosa che
non ne aveva. Da quando il quadrante ha la sua architettura vera (corona
scanalata, dodici indici, i due cerchi), la cassa era ridondante: l'anello
ha già abbastanza dettaglio suo. Tolta.

## La ghiera in oro

Misurato in percentuale di pixel: sul quadrante del King Seiko l'oro è
l'**8,6%**, nell'app era lo **0,0%**. Non un accento mancante — una
struttura mancante: sul quadrante l'oro è l'anello dei minuti, le lancette,
la cornice della data.

La ghiera dell'anello di Oggi porta l'oro all'1,5%, uguale in tutte e
quattro le atmosfere. **Non è l'anello dei minuti copiato**: niente tacche,
niente indici applicati. È un bisello di metallo lavorato nel linguaggio
dell'inciso che l'app usa già, con la luce che cade a 30° da destra come nel
logo. Del Vanac prende il colore, non il disegno.

Resta uno squilibrio dichiarato: l'argento è il 20% del quadrante e meno
dell'1% dell'app. Sul quadrante sono dodici indici lucidi; su uno schermo
sarebbero elementi brillanti in competizione col testo.

## La palette viene dal quadrante

I valori non sono scelti a occhio: sono **campionati dall'immagine del King
Seiko SLA083**, il Vanac blu-violetto con lo skyline di Tokyo.

| dove | valore letto | tinta | sat | luce |
|---|---|---|---|---|
| quadrante | `#2D1389` | 253 | 76% | 31% |
| oro delle lancette | `#DEC07E` / `#BA9C60` | 41 | 39–59% | 55–68% |
| cielo alto | `#3A42CA` | 237 | 58% | 51% |
| tramonto | `#FFAD87` | 19 | 100% | 76% |

Prima le superfici stavano a tinta 265 con saturazione 35%: viola solo di
nome, quasi neutre a vedersi. Ora sono tutte ancorate a **tinta 253**, la
tinta del quadrante, con la saturazione alzata a 46–56% senza schiarirle.

`--quadrante: #2F1688` è il colore del quadrante usato come **superficie**:
sta nel cuore dell'anello inciso, dove il viola torna a essere materia
invece che etichetta.

`--viola: #937BEA` è la stessa tinta schiarita fino a 4,7:1 sulle lastre,
perché serve a scrivere gli stati e deve leggersi.

**Anche i grigi vengono dall'orologio.** Il metallo del Vanac sta a tinta
220–240, freddo; i nostri stavano a 256–264, virati al viola — grigi intonati
al fondo invece che alla cassa.

| token | prima | ora | letto da |
|---|---|---|---|
| `--argento` | `#EDEBF2` t257 | `#E8E8EC` t240 | cassa, riflesso pieno |
| `--argento-off` | `#9B95AC` t256 | `#949CAC` t220 | cassa, mezzatinta |
| `--frase` | `#8B8397` t264 | `#848C9C` t220 | metallo in ombra |

Il contrasto fresco fra acciaio e quadrante è metà del carattere di
quell'orologio: con i grigi virati al viola andava perso.

**L'oro non è cambiato.** Il nostro `#C9A96A` sta esattamente fra i riflessi
e i mezzitoni delle lancette vere: era già giusto.

**L'incisione del marchio nasce dal quadrante** — `color-mix` fra
`--quadrante` e `--room` — quindi segue le quattro ore da sola. Prima era un
colore scritto a mano, rimasto dalla palette precedente.

## Il marchio inciso: quanto deve leggersi

Misurato sui pixel veri, non sui token: il colore del marchio nasce da un
riempimento scuro più un velo d'argento in fusione *screen*, quindi il
valore dichiarato nel CSS non dice niente su cosa si vede.

- velo al 30% → corpo delle lettere a **2,95:1**, sotto il minimo di 3:1
  richiesto per il testo grande. Al sole sarebbe sparito.
- velo al 44% → **4,4:1** su tutte e quattro le ore.

Resta inciso perché **il rilievo lo fanno le ombre, non la chiarezza del
riempimento**: alzando il velo ho rinforzato anche l'ombra sopra e la luce
sotto, così il solco è più marcato di prima, non meno.

La frase sotto sta fra 5,6 e 5,8:1: non serviva toccarla.

## I tre piani si staccano

Misurato in **L\***, che è percettivamente uniforme — il rapporto WCAG
all'estremo scuro si comprime e non dice niente su cosa si vede davvero.

| | prima | ora |
|---|---|---|
| fondo → parete | +4 L\* | **+7 L\*** |
| fondo → lastra | +9 L\* | **+14 L\*** |

Prima le tre superfici differivano così poco che una riga di Collezione non
leggeva come un oggetto appoggiato: leggeva come un rettangolo appena più
chiaro. Ora il viola del quadrante è presente come materia, non come velo.

**Il tetto è la leggibilità, e l'ho cercato per tentativi misurati.** Coi
colori di testo vecchi il massimo era +10 L\*: oltre, lo stato sulle righe
scendeva sotto 4,5:1. Per andare a +14 ho dovuto alzare anche i due colori
che vivono sulla lastra — `--viola` e `--argento-off`. La frase no: sta sul
fondo, non sulle righe, e non era un vincolo.

Verificato nel browser, non solo a tavolino: titolo 10,9–11,7 · calibro e
stato 4,6–5,0 su tutte e quattro le ore.

## Colore e contrasto

- **L'arancio pieno spetta solo al bottone che scrive un dato**: «L'ho messo»
  e «Salva». Andare a un'altra parete o aprire una scheda non impegna, e usa
  la variante `.azione.secondaria` — stesso peso, contorno invece di pieno.
- La frase sotto il nome ha un colore suo (`--frase`), non un'opacità
  dell'argento. Al 52% stava a 2,6:1; ora sta fra 4,97:1 e 5,31:1 sulle
  quattro ore, sopra il minimo per il testo piccolo.
- Testo argento su fondo: 15:1. Argento spento: 6,3:1.

## Il Registro

Mostra dodici voci e, se ce ne sono altre, lo dice: *«Mostra le altre 8»*.
Un elenco che si ferma in silenzio è un elenco che mente.

Ogni voce si toglie con la × a destra, in due tocchi. La regola su cosa
succede alle date:

- se è **l'ultima** voce scritta per quell'orologio, le date tornano com'erano:
  quella voce porta con sé lo stato precedente
- se è una voce **più vecchia**, sparisce dalla storia e le date restano dove
  sono, perché lo stato di oggi discende dalle voci successive, non da quella

## Nomi lunghi nell'anello

Un cerchio non perdona: il testo deve stare dentro la curva, non dentro il
quadrato che la contiene. `adattaAnello()` misura il contenuto reale e, se
supera il 76% del diametro, riduce il nome del 7% per volta fino a un
minimo. Solo se anche così non basta, il nome si ferma a tre righe.

Una parola sola più larga del diametro si spezza (`overflow-wrap: anywhere`)
invece di sfondare i bordi. Il riferimento sotto il nome sta su una riga
sola con i puntini. Aria laterale al 12% del diametro, non al 10%: agli
estremi la curva stringe.

## Primo avvio

**L'app parte vuota, e resta vuota finché non aggiungi tu.** Nessun dato
precaricato di nessun tipo: chi apre Bariletto possiede orologi veri e li
mette lui. Una collezione finta dentro un archivio personale è un residuo
di collaudo, non una comodità.

I cinque orologi di prova che c'erano prima sono usciti dal prodotto: SEME,
`caricaEsempi`, `togliEsempi`, il campo `esempio` sui record e le quattro
voci di dizionario. Vivono ora solo nel costruttore dell'anteprima, come
banco di prova — nel pacchetto non c'è traccia.

Tutte e quattro le pareti hanno lo stesso stato vuoto: un invito ad
aggiungere il primo orologio.

## L'anello di Collezione filtra

Su Oggi l'anello è una vetrina; su Collezione mostrava un numero e non
faceva niente. Ora è un comando: **toccandolo restano solo gli orologi che
chiedono attenzione**, ritoccandolo tornano tutti.

Tre regole che lo rendono sicuro:

- **quando filtra si vede**: il filetto interno si accende e la scritta
  sotto diventa *tocca per tutti*
- **il filtro cade uscendo dalla parete**, azzerato da `vai()`: altrimenti
  si riaprirebbe Collezione, mancherebbe metà elenco e si penserebbe di
  aver perso degli orologi
- **con la collezione in ordine l'anello non è un bottone**, è un `div`
  che dice *Tutto in ordine*: un comando che non fa niente è peggio di
  nessun comando

Niente lampeggio. Un avviso che non si spegne mai smette di essere un
avviso, e in questa collezione qualcosa chiede sempre attenzione.

## Le schermate vuote

Regola: **uno zero non fa il protagonista.** Un numero è un dato solo se
c'è qualcosa da contare; a zero è un'assenza, e un'assenza non regge una
schermata. Quindi:

- Registro vuoto → nell'anello *Ancora niente*, e sotto un'azione vera che
  porta a Oggi. Una schermata vuota è un invito a fare, non un'atmosfera.
- Collezione senza problemi → *Tutto in ordine* al posto dello zero.

## Barra del browser e avvio

`theme-color` viene riscritto a ogni cambio d'ora leggendo `--room`: la barra
di sistema segue l'app invece di restare ferma su un colore solo.

Nel manifest `theme_color` e `background_color` sono `#16111F`, un valore
intermedio fra le quattro ore: la schermata d'avvio del sistema non può
essere dinamica, quindi si sceglie quella che stona meno con tutte e quattro.

## I font

Auto-ospitati in `font/`, precaricati dal service worker. **L'app non fa
nessuna chiamata verso l'esterno**: funziona dalla prima apertura anche
senza rete, e nessuno può sapere quando la apri.

- `fraunces.woff2` — 118 KB, variabile con tutti e quattro gli assi:
  `opsz` 9–144, `wght` 100–900, `SOFT` 0–100, `WONK` 0–1
- `instrument-sans.woff2` — 29 KB, asse `wght` 400–700

Sono 147 KB contro i 28 KB di tutto il resto del codice: i font sono il
pacchetto. Si scaricano una volta e restano. Con solo `opsz` e `wght`
Fraunces scenderebbe a 66 KB, ma si perderebbe il disegno delle lettere
della testata, che è la ragione per cui l'abbiamo scelto.

Ogni `@font-face` dichiara `unicode-range` sul latino: i caratteri fuori
da quell'intervallo tornano a Georgia invece di mostrare quadratini.

## «Offrimi un caffè»

In fondo al Registro, sotto la lingua, separato da un filetto: l'ultima cosa
della parete degli attrezzi. La trova solo chi scorre fin lì.

**Mai in arancio.** Quel colore è riservato a quello che l'app ti chiede di
fare — indossare, salvare. Questo non lo è: è una firma silenziosa, non
un'azione dell'app. Stesso peso di ogni altro link discreto (`.quieta`),
stessa icona a tratto sottile della matita, nessun colore introdotto fuori
dai token esistenti.

Apre `ko-fi.com/istantelabs/tip` in una scheda nuova. Per cambiarlo, l'unico
punto è `caffe.href` in `pareti.js`, dentro `pareteRegistro()`.

## Aggiornamenti

Il service worker **non** fa `skipWaiting`: una versione nuova resta in
attesa e l'app lo dice con una striscia in basso. Solo quando tocchi
*Aggiorna* la nuova versione prende il posto e la pagina si ricarica.

Sostituirsi in silenzio a sessione aperta significa far convivere il codice
già in memoria con file appena scaricati: è la classe di bug che poi non si
riproduce più.

Ricorda di **alzare `CACHE` in `sw.js`** a ogni rilascio, altrimenti niente
di tutto questo parte.

## La stampa: due documenti, non uno

Si stampa quello che stai guardando, dalla parete da cui lo stai guardando.
I due fogli hanno scopi opposti e mescolarli li rovinava entrambi.

**Collezione → «Stampa la collezione».** Il foglio del cassetto: calibro,
riserva, gesti. Solo dati che fra un anno saranno ancora veri — niente stati
e niente date d'uso, perché la carta non si aggiorna. Da piegare dentro la
scatola o da dare all'orologiaio.

**Registro → «Stampa il registro».** L'opposto: tutte le voci in tabella,
con data piena, e in testata quante sono e su che periodo. Le righe non si
spezzano fra due pagine e l'intestazione si ripete a ogni foglio.

**Il registro su carta non è un backup.** Da un foglio non si ripristina
niente: si ribatte a mano. Serve ad avere sotto gli occhi cosa hai portato
se il telefono muore, non a rimettere in piedi l'archivio.

Ogni comando compare solo se c'è qualcosa da stampare. Dal menu di stampa
del browser il documento lo sceglie la parete attiva, e sparisce da solo a
stampa finita.

Su carta non finisce la schermata in bianco e nero: finisce il documento
che la schermata non può essere.

- fondo bianco, inchiostro nero, nessun arancio — su carta costerebbe e
  leggerebbe male
- stessa tipografia dello schermo, che è auto-ospitata e quindi stampa
- un orologio, o una riga di registro, non si spezza mai fra due pagine
- in testata la data di stampa, così si sa quanto è vecchio il foglio

## Lingue

`lingua.js` contiene tutto il testo visibile, in italiano e in inglese.
Nessuna stringa vive fuori da lì: se ne aggiungi una in `app.js`, va messa
prima nel dizionario e richiamata con `t("chiave")`.

- `t("chiave", {par})` — testo con sostituzioni
- `p(n, "sing", "plur")` — numero più unità, con il plurale giusto
- `locale()` — per date e numeri (`it-IT` / `en-GB`)

Alla prima apertura la lingua viene dalla lingua del telefono. Si cambia in
fondo al Registro, e la scelta resta in archivio.

## I file

Il codice è diviso per competenza, e l'ordine di caricamento è una catena:
ogni file usa solo quelli sopra di sé.

| file | righe | cosa fa |
|---|---|---|
| `lingua.js` | 256 | dizionario italiano/inglese, `t()` e `plurale()` |
| `calibri.js` | 142 | 15 famiglie, 56 calibri, con la fonte del dato |
| `archivio.js` | 117 | IndexedDB e le azioni che scrivono |
| `dominio.js` | 198 | cosa chiede un orologio, quali gesti vuole |
| `pareti.js` | 318 | Oggi, Collezione, Il gesto, Registro, stampa |
| `foglio.js` | 270 | aggiungere, modificare, eliminare |
| `cornice.js` | 319 | testata, nastro, trascinamento, misure, avvio |

`dominio.js` non contiene una riga di interfaccia: si può leggere e
verificare senza sapere niente di come è fatta la schermata.

**Nessuno stile fisso vive nel JavaScript.** Restano in linea solo i valori
che nascono da un calcolo — la posizione del nastro, la misura dell'anello,
il colore che dipende dallo stato. Tutto il resto è una classe nel CSS.

- `index.html` — il guscio
- `font/` — Fraunces e Instrument Sans, in casa
- `styles.css` — token, palette Vanac, tipografia, l'anello incassato
- `sw.js` — cache del guscio, font in cache a runtime
- `manifest.webmanifest` — nome, icone, colori, standalone
- `icon-*.png` — 192, 512, 512 maskable

## Dati

Tutto in IndexedDB, sul telefono. Nessun account, nessuna rete.

**Non c'è nessun backup.** L'esportazione è stata rimossa: se i dati si
perdono — cronologia di Safari svuotata, app disinstallata, spazio esaurito —
si perdono e basta. È una scelta consapevole, non una dimenticanza.

## Il cancello sulle scritture

Fra il tocco e il ridisegno c'è un'attesa sul database, e in quel varco il
bottone resta vivo. Quattro tocchi rapidi su «L'ho messo» scrivevano quattro
voci; due tocchi su «Salva» creavano due orologi.

Tutte le azioni che scrivono passano da `unaVolta()`: la seconda chiamata
viene ignorata finché la prima non ha finito. Vale per indossare, annullare,
caricare, azionare il cronografo, salvare, eliminare, togliere una voce e
caricare gli esempi.

## Il gesto del giorno

«L'ho messo» si annulla: ogni voce del Registro porta con sé lo stato di
prima (ultimo polso, ultima luce, ultimo cronografo), quindi annullare è una
restituzione esatta e non una stima.

Il cronografo **non** si segna indossando l'orologio: va premuto, e quello
non si deduce. Dopo «L'ho messo», sui cronografi compare una voce a parte.
L'Eco-Drive invece registra la luce da solo, perché portarlo al polso lo
espone davvero: quella è una conseguenza fisica, non un'ipotesi.

## La frontiera dei dati

`normalizza()` in `dominio.js` è l'unico punto in cui un record entra
nell'app. L'archivio lo applica in uscita, quindi da lì in poi tutto il
resto può dare per scontata la forma dei dati.

Serve perché **un solo record storto bloccava l'intera app**: un orologio
senza `calibroNome` faceva fallire il disegno e con esso tutte e quattro le
pareti, senza modo di recuperare — non c'è esportazione.

Cosa mette in riga: tipo fuori elenco → automatico; riserva assente,
testuale o negativa → il valore di famiglia; date non numeriche → nulle;
nome vuoto → *Senza nome*; calibro sconosciuto → *Movimento ignoto*.

E se apri la scheda di un orologio il cui calibro non è più nel database,
passa alla dichiarazione a mano riempita con quello che l'orologio già sa,
invece di cercare una voce che non esiste.

## Carica e polso non sono la stessa cosa

Un carica-manuale non prende energia dal polso: la prende dalla corona.
Per questo ogni orologio ha due date distinte, `ultimoPolso` e `ultimaCarica`:

- **manuale** → la riserva parte da `ultimaCarica`, e il bottone di Oggi
  dice *L'ho caricato*
- **automatico** → vale la più recente delle due, perché prende energia da
  entrambe; se ha la corona, su Oggi compare anche *L'ho solo caricato*,
  per quelli che carichi nel cassetto senza indossarli
- la regola dei 21 giorni sull'olio resta legata al polso, non alla carica

## «Non lo trovi?»

In fondo alla ricerca del movimento, **sempre presente**, una sezione che
spiega perché un calibro può mancare prima di offrire la via d'uscita: un
produttore dà spesso un codice proprio a un movimento comprato da un altro
fabbricante, quindi lo stesso calibro può già essere in elenco sotto un nome
diverso.

**Non è agganciata ai risultati, ed è deliberato.** Legata all'elenco vuoto
apparirebbe e sparirebbe a ogni lettera digitata, perché una ricerca
attraversa lo zero mentre si scrive. Sempre presente vuol dire nessuno stato
che cambia, quindi nessun lampeggio possibile.

Così «Non lo trovo: lo dichiaro io» arriva dopo una ragione, invece che come
unica scialuppa.

## Quando il manuale guarda un'altra lancetta

Il campo `finestra` produce sempre la frase «non toccare la data tra le X
e le Y». Sul 4R34 quella formula direbbe una cosa diversa da Seiko: il
manuale ancora il divieto alla **lancetta delle 24 ore**, non a quelle
normali. Per questo esiste `notaData`, che sostituisce la frase generica
con una chiave di dizionario sua.

Serve ogni volta che il divieto non si legge sul quadrante principale.
Attenzione: il campo va anche copiato dentro `daCalibro()`, altrimenti si
perde quando l'orologio viene creato.

## Il database dei calibri

`calibri.js` è l'unica cosa difendibile del progetto. Due livelli:

- **15 famiglie** (Seiko 7S, 4R/NH, 6R, 8R, 8L, 9S, Spring Drive, manuali
  d'epoca, 6138/6139, Kinetic, Solar, quarzo; Miyota 8200 e 9000; Eco-Drive).
- **~55 calibri** che ereditano dalla famiglia e scrivono solo ciò che cambia.
  Esempio: `6R35` dichiara solo `riserva: 70`, tutto il resto lo eredita.

Otto campi per riga: tipo, carica a mano, arresto dei secondi, data, giorno,
riserva in ore, alternanze/ora, secondi indiretti.

Ogni riga dichiara **da dove viene il dato** nel campo `fonte`:
`ufficiale`, `comunita`, `derivato`. L'app lo mostra nella scheda, al
momento in cui scegli il movimento, con un pallino e una riga di spiegazione.

56 calibri su 56 toccati: 24 con fonte ufficiale (guide tecniche e pagine
del produttore), 33 con fonti di settore concordi. Restano cinque senza
riscontro — NH38, NH70, 66xx, 6602, 9011 — più due Citizen (E650, 8730) la
cui riserva non è saltata fuori da nessuna parte.

Il dettaglio, con il metodo e le priorità, sta in **VERIFICA.md**.

## Dove vive la frase

Due punti soltanto:
- sotto il nome, in testata, su tutte e quattro le pareti
- la `description` del manifest (compare quando si installa)

Niente schermata d'avvio: la PWA installata ha già la sua, generata dal
sistema con nome, icona e `background_color` del manifest.

Costanti in cima ad `app.js`: `NOME_APP` e `FRASE`.

## Aggiungere, modificare, eliminare

Una scheda sola per tutte e tre: cambia solo se l'orologio esiste già.
Tutto vive in Collezione.
- **Aggiungere**: in fondo all'elenco, *Aggiungi un orologio*
- **Modificare**: la matita a destra di ogni riga
- **Eliminare**: dentro la scheda, in fondo, in due tocchi

Il corpo della riga porta a Il gesto, la matita alla scheda: due
destinazioni diverse non possono stare sullo stesso tocco.

Modificando, id e date restano quelli di prima: la storia non si perde.
Eliminando, le voci già scritte nel Registro restano leggibili perché ogni
voce conserva il nome dell'orologio al momento in cui è stata scritta.

## Da sistemare

- Nessun backup: né esportazione né importazione.
- La frase sotto il nome ha contrasto 2,9:1, sotto il minimo di accessibilità.
- Il calibro del Citizen Open Heart nei dati di esempio è da verificare.
