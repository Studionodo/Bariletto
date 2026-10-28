# Ninna

Prevede pisolini e nanna, e spiega perché.

[Read this in English](README.en.md)

## Cos'è

Ninna è una web app (PWA) per genitori di neonati e bambini piccoli che vogliono capire i ritmi del sonno del proprio figlio invece di indovinarli. Calcola quando arriverà il prossimo pisolino o l'ora della nanna, e mostra sempre il perché: nessuna previsione a scatola chiusa. Funziona interamente offline dopo il primo caricamento, non ha server propri, non ha account: tutti i dati restano sul telefono di chi la usa.

## Cosa fa

**Prevedere il sonno**

- **Prevede il prossimo sonno** in base alla finestra di veglia tipica dell'età del bambino, corretta giorno dopo giorno con i ritmi reali osservati.
- **Distingue da sola pisolino e nanna**: decide quale dei due proporre in base ai pisolini già fatti, all'orario e alla vicinanza alla routine serale, così il genitore non deve sceglierlo a occhio.
- **Spiega ogni previsione**: un tasto dedicato mostra il calcolo per esteso, non solo il risultato.
- **Segnala le transizioni**: quando il bambino sembra abbandonare un pisolino, lo indica come informazione, mai come istruzione.

**Registrare**

- **Attività quotidiane**: pisolini, nanna notturna, allattamento, biberon, pappa, pannolino, tiralatte, risvegli notturni.
- **Timeline della giornata**: una barra dalle 00 alle 24 con i blocchi di sonno e le poppate, per vedere com'è andata senza leggere una lista.
- **Correzione degli orari**: ogni voce registrata si può correggere dopo, se l'hai segnata in ritardo.
- **Salute**: vitamine e farmaci con il nome di quello somministrato, perché "farmaco" da solo non dice nulla se il bambino ne prende più di uno.
- **Crescita**: peso, altezza e circonferenza cranica nel tempo, con l'andamento del peso. Nessuna curva di crescita e nessun percentile: solo i dati del tuo bambino, mai confrontati con una popolazione di riferimento.

**Accompagnare**

- **Suoni per la nanna**: sette suoni generati in tempo reale (bianco, rosa, marrone, onde, pioggia, battito cardiaco, shhh), con timer di spegnimento e un lettore compatto raggiungibile da ogni schermata.
- **Modalità notte**: schermo nero con un solo tasto grande, pensato per allattare o gestire un risveglio senza accendere la luce.
- **Notifiche**: avvisa quando si avvicina il prossimo sonno o la routine serale.
- **Scorciatoie rapide**: tenendo premuta l'icona dell'app compaiono "Inizia pisolino" e "Inizia nanna".
- **Una guida in 13 articoli** su finestre di veglia, segnali di sonnolenza, sonno sicuro, regressioni e uso dell'app, scritta in tono informativo, mai prescrittivo.

**Condividere e adattare**

- **Riepilogo per il pediatra**: una tabella degli ultimi 14 giorni con medie, integratori e misure di crescita, pronta da stampare o salvare in PDF.
- **Backup ed esportazione**: JSON per un backup completo o per passare i dati a un altro genitore, CSV per un'analisi personale.
- **Statistiche senza giudizio**: sonno degli ultimi 7 giorni e numeri di oggi affiancati agli intervalli tipici per l'età, senza etichette di merito e senza obiettivi da centrare.
- **Modalità solo diario**: nasconde previsioni, confronti e statistiche quando guardare i numeri smette di aiutare.
- **Aspetto e lingua**: tema chiaro, scuro o automatico secondo il sistema; italiano e inglese, con cambio immediato.

## Come tratta i dati

Nessun dato del bambino lascia mai il dispositivo: niente registrazione, niente cloud, niente sincronizzazione. Tutto resta in memoria locale, esportabile quando vuoi in JSON o CSV.

Nessuna terza parte riceve richieste dall'app: caratteri tipografici, icone e codice sono serviti dall'app stessa, non da reti di distribuzione esterne. Le uniche connessioni possibili sono quelle verso l'hosting da cui l'app viene scaricata e aggiornata, come per qualunque sito, e il collegamento a Ko-fi, che si apre solo se scegli tu di toccarlo.

Il prezzo di questa scelta è che oggi non esiste ancora una condivisione automatica dei dati tra due genitori: l'unico modo è esportare un file e passarlo manualmente.

## Ninna non è un dispositivo medico

È uno strumento di organizzazione. Per qualunque dubbio sulla salute o sul sonno del bambino, il riferimento resta il pediatra.

---

Un progetto **Studionodo**.
