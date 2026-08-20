/* ------------------------------------------------------------------
   Lingua — italiano e inglese
   Nessuna stringa visibile all'utente vive fuori da qui.
   t("chiave", {parametri})   → testo
   plurale(n, "sing", "plur") → singolare o plurale, secondo n
   ------------------------------------------------------------------ */

let LINGUA = "it";

const VOCI = {
  it: {
    codice: "it-IT",
    frase: "conta le ore che non guardi",

    /* pareti */
 collezione: "Collezione", registro: "Registro",
    "oggi.nulla": "Nessuno chiede attenzione",
    "primoUso.titolo": "Come funziona il conteggio",
    "primoUso.testo1": "Il conto delle ore parte nel momento in cui premi uno di questi bottoni, e prosegue finché non lo premi di nuovo.",
    "primoUso.testo2": "Fallo ogni giorno, e il conto riparte sempre allineato.",
    "primoUso.testo3": "Se salti qualche giorno senza intervenire, l'app calcola le ore reali trascorse dall'ultima volta, comprese quelle in cui magari hai indossato l'orologio senza segnalarlo.",
    "primoUso.bottone": "Ho capito",
    "coll.tutta": "La mia collezione", "coll.titolo": "Sfoglia la collezione", "coll.apri": "{n} · tocca per sfogliare tutto", "oggi.giaMesso": "al polso oggi",
    "oggi.prossimoOra": "si ferma fra {q}",
    "oggi.tuttiCarichi": "Tutti carichi e in orario",
    "oggi.restano": "restano {q}",
    "reg.periodo": "{n} · da {da}", "reg.attrezzi": "Attrezzi",
    "reg.vediTutto": "Vedi tutto il registro ({n})",
    "arch.apri": "Archivio dei movimenti ({n})", "arch.titolo": "Archivio",
    "arch.cerca": "Cerca un calibro o una marca",
    "arch.nulla": "Nessun calibro trovato.",
    "arch.fatto": "Com'\u00e8 fatto", "arch.cura": "Come si cura",
    "arch.normale": "Cosa \u00e8 normale", "arch.fonti": "Fonti",
    "arch.indietro": "Indietro", "arch.leggi": "Leggi di pi\u00f9 su questo calibro",
    "s.dettaglio": "L'orologio", "s.modificaVoce": "Modifica",

    /* stati */
    "stato.moto": "in moto", "stato.riserva": "in riserva",
    "stato.fermo": "fermo", "stato.scarico": "scarico", "stato.azionare": "da azionare",

    /* Oggi */
    messo: "Indossato oggi", soloCaricato: "Caricato, ma non indossato",
    "reg.caricato": "caricato a mano",
    "m.manuale.scarico": "Non lo carichi da {g}: la riserva è di {r} ore. {n} giri di corona.",
    "g.storia": "Le ultime volte",
    "g.ultimaVolta": "Ultima volta indossato",
    "g.mai": "Mai indossato", "g.oggi": "oggi", "g.ieri": "ieri", "g.faGiorni": "{g} fa",
    annulla: "Non l'ho indossato",
    "crono.fatto": "Ho azionato anche il cronografo",
    "crono.segnato": "Cronografo azionato oggi",
    "oggi.segnato": "Segnato, {n}",

    "vuoto.oggi": "Non c'è ancora niente da mettere al polso.",
    "vuoto.presentazione": "Bariletto conta le ore che non guardi. La riserva di un automatico si consuma in silenzio; un manuale aspetta la tua mano sulla corona; un cronografo aspetta i suoi pulsanti. Ogni calibro ha un modo giusto di essere curato, e Bariletto lo conosce. Aggiungi la tua collezione: da oggi c'è qualcuno che se ne ricorda al posto tuo.",

    /* motivi */
    "m.nuovo": "Appena aggiunto. Mettilo al polso una volta e comincio a tenerne il conto.",
    "m.caricatoNonIndossato": "L'hai caricato, ma non ancora indossato. Mettilo al polso quando vuoi iniziare a portarlo davvero.",
    "m.eco.fermo": "Fermo: {g} senza ricarica, e la riserva ne copre {l}.",
    "m.eco.basso": "{g} al buio su {l} di autonomia. Una mattina sul davanzale basta.",
    "m.kin.basso": "{g} senza movimento. Portalo mezza giornata e il condensatore si riprende.",
    "m.eco.carico": "Carico. Restano circa {r}.",
    "m.quarzo": "Al quarzo: non ha bisogno di te.",
    "m.elettrico": "È elettrico, non ha bisogno di te.",
    "m.elettrico.data": "Va da solo. Guarda solo che la data sia giusta.",
    "m.diapason": "Il diapason vibra da solo, non ha bisogno di te.",
    "m.diapason.data": "Va da solo. Guarda solo che la data sia giusta.",
    "m.quarzo.data": "Va da solo. Guarda solo che la data sia giusta.",
    "m.crono": "Il cronografo non gira da {g}. Falla lavorare, la frizione.",
    "m.olio": "Fermo da {g}. Girando, l'olio torna dove deve stare.",
    "m.scarico.mano": "Riserva esaurita: {r} ore, e non lo indossi da {g}. {n} giri di corona.",
    "m.scarico.scosse": "Riserva esaurita: {r} ore, e non lo indossi da {g}. Non si carica a mano: va scosso.",
    "m.quasi": "Gli restano circa {o}. Indossalo oggi, altrimenti si ferma.",
    "m.pieno": "Carico, ancora {o} di autonomia. Oggi puoi scegliere col cuore.",

    /* Collezione */
 aggiungi: "Aggiungi un orologio", "agg.breve": "Aggiungi", "agg.pieno": "Aggiungi nuovo orologio",

    /* Il gesto */
    "g.eco.1": "Si ricarica con la luce, non con la corona. Il sole diretto vale cento volte una lampada.",
    "g.eco.2": "A carica piena regge {r}. Dietro un vetro rende la metà.",
    "g.eco.3": "Se la lancetta dei secondi salta di due, la riserva è agli sgoccioli.",
    "g.kin.1": "Non è solare e non è automatico: il movimento del polso carica un condensatore.",
    "g.kin.2": "A pieno regge {r}. Il condensatore invecchia: dopo anni si sostituisce.",
    "g.kin.3": "Se è fermo del tutto, mezza giornata al polso prima di rimetterlo all'ora.",
    "g.q.1": "Non chiede niente. Quando i secondi iniziano a saltare di due, la pila sta finendo.",
    "g.q.2": "Nei mesi da trenta giorni la data va corretta a mano il primo del mese.",
    "g.elt.1": "Non si carica: funziona a batteria, non ha una molla da mandare in tensione.",
    "g.elt.2": "Se è rimasto fermo a lungo, non limitarti a infilare una pila nuova: i contatti possono essersi ossidati, e mandarci corrente rischia più che aiutare — fallo controllare da chi conosce questo calibro.",
    "g.dia.1": "Non si carica: un diapason elettronico lo tiene in moto, alimentato da una batteria — nessuna corona da girare per dargli energia.",
    "g.dia.2": "Non forzare mai la corona: alcuni Accutron hanno un meccanismo di arresto che stacca fisicamente un pezzo quando la estrai — un movimento brusco può danneggiarlo.",
    "g.tourbillon": "Il tourbillon è una gabbia in movimento esposta: evita urti diretti sulla cassa, più di quanto faresti su un tre lancette qualsiasi.",
    "g.sd.1": "Non ha scappamento: la lancetta scivola, non batte. È normale che non faccia rumore.",
    "g.sd.2": "Riserva di {r} ore. Sotto quella soglia rallenta prima di fermarsi.",
    "g.mano": "{n} giri di corona in posizione di riposo. Riserva piena: {r} ore.",
    "g.scosse": "Non si carica a mano. Se è fermo, venti scossoni laterali e poi al polso. Riserva: {r} ore.",
    "g.data.24h": "Non correggere la data quando la lancetta delle 24 ore sta fra le 21 e l'1: il manuale guarda quella, non le lancette normali. Prima l'ora, poi la data.",
    "g.data.90min": "La data si corregge in entrambi i sensi, avanti o indietro. La finestra proibita esiste comunque, ma dura solo novanta minuti, non quattro ore: il produttore la dichiara sulle proprie pagine.",
    "g.indiretti": "I secondi arrivano con presa indiretta: il piccolo scatto irregolare è di serie, non è un guasto.",
    "g.data": "Non toccare la data tra le {da} e le {a}: gli ingranaggi del calendario sono già in presa.",
    "g.data.doppia": "Due finestre proibite, non una: non toccare la data tra le {da} e le {a}, non toccare il giorno tra le {da2} e le {a2}.",
    "g.arresto": "I secondi si fermano tirando la corona: puoi sincronizzarlo al secondo.",
    "g.nonArresto": "I secondi non si fermano. Sincronizzalo al minuto e lascia perdere il resto.",
    "g.crono": "Non azionare i pulsanti sott'acqua. E non lasciare il cronografo in moto per giorni.",

    /* modifica ed eliminazione */
    "s.modifica": "Modifica l'orologio", modifica: "Modifica", "s.salvaMod": "Salva le modifiche",
    elimina: "Elimina", "elimina.conferma": "Tocca di nuovo per eliminare",
    "elimina.nota": "Sparisce dalla collezione, e con lui le voci che ha lasciato nel Registro.",

    /* Registro */
    voci: "voce", vociPl: "voci",
    "reg.vuoto": "Qui resta traccia di ogni orologio che indossi.", "reg.apri": "{n} · tocca per vedere tutto",
    "reg.rimuovi": "Rimuovi questa voce", "reg.confermaRimuovi": "Tocca di nuovo",
    "reg.portato": "indossato al polso",
    lingua: "Lingua", caffe: "Offrimi un caffè",
    "col.riga2": "Offline · Nessun account · Nessun dato raccolto",
    "col.riga3": "© 2026 Studionodo · Tutti i diritti riservati",
    stampa: "Stampa la collezione", "stampa.reg": "Stampa il registro",
    "st.periodo": "dal {da} al {a}", "st.solo": "una voce sola",
    "st.azione": "Cosa", "st.quando": "Quando", "st.chi": "Orologio",
    "st.stampato": "Stampato il {d}", "st.orologi": "{n} in collezione",
    "st.gesti": "Il gesto", "st.dati": "Il movimento", "st.riserva": "Riserva",
    "agg.pronta": "C'è una versione nuova", "agg.ora": "Aggiorna",

    /* scheda */
    "s.titolo": "Aggiungi un orologio", chiudi: "Chiudi",
    "info.apri": "Spiega: {v}",
    "info.anello.titolo": "Come leggere l'anello",
    "info.anello.testo1": "Il colore dell'anello ti dice subito a che punto è l'orologio, senza dover leggere altro.",
    "info.anello.testo2": "Argento vuol dire che va tutto bene. Viola vuol dire che la riserva sta scendendo, oppure che l'orologio si è fermato. Arancio vuol dire che è scarico e aspetta la carica. Oro vuol dire che c'è un gesto preciso da fare.",
    "info.anello.testo3": "Il numero \u00abA/H\u00bb indica quante volte al secondo si muove la lancetta dei secondi. Più è alto, più il movimento sembra scorrere liscio.",
    "info.gesti.titolo": "Indossato, caricato, azionato",
    "info.gesti.testo2": "\u00abIndossato oggi\u00bb significa che oggi hai indossato l'orologio al polso davvero.",
    "info.gesti.testo3": "\u00abCaricato, ma non indossato\u00bb serve per un orologio manuale che tieni pronto ma non indossi oggi. La riserva riparte comunque, ma l'app sa che non l'hai indossato.",
    "info.gesti.testo4": "\u00abHo azionato anche il cronografo\u00bb riguarda solo i pulsanti. Indossare l'orologio non basta: i pulsanti vanno usati ogni tanto, anche solo per farli funzionare bene.",
    "info.registro.titolo": "Cos'è il registro",
    "info.registro.testo1": "Il registro è un diario.",
    "info.registro.testo2": "Ogni volta che segni un orologio come indossato, caricato o con il cronografo azionato, qui resta scritto quando e cosa hai fatto.",
    "info.collezione.titolo": "La collezione per intero",
    "info.collezione.testo1": "Sono gli stessi orologi che vedi scorrere nella pagina Oggi.",
    "info.collezione.testo2": "Qui però stanno tutti insieme in un elenco, comodo da leggere dall'alto in basso invece che di lato.",
    "info.archivio.titolo": "Cos'è l'archivio",
    "info.archivio.testo1": "Questo archivio non riguarda i tuoi orologi.",
    "info.archivio.testo2": "È una raccolta di informazioni su come si curano in generale i vari calibri, anche quelli che non possiedi ancora.",
    "info.carta.titolo": "Perché la stampa",
    "info.carta.testo1": "Qui puoi stampare i tuoi dati su carta, oppure salvarli in PDF.",
    "info.carta.testo2": "Il documento contiene solo le informazioni che restano vere nel tempo. Non ci sono stati o date d'uso, perché cambiano troppo in fretta.",
    "info.dati.titolo": "Backup ed esportazione",
    "info.dati.testo1": "Puoi esportare un file con tutti i tuoi dati. Resta sul telefono, senza bisogno di nessun account.",
    "info.dati.testo2": "Se lo ripristini, però, tutto quello che c'è oggi viene sostituito. Per questo l'app chiede di toccare due volte prima di procedere.",
    "notif.gruppo": "Notifiche",
    "notif.attiva": "Attiva i controlli periodici",
    "notif.attivo": "Notifiche attive",
    "notif.non-supportato": "Non disponibile su questo telefono",
    "notif.rifiutato": "Permesso negato dal telefono",
    "notif.errore": "Non è stato possibile attivarle",
    "notif.nota": "Il telefono controlla da solo, di tanto in tanto, se qualche orologio ha bisogno di attenzione — anche ad app chiusa. Non è un orario preciso: decide il sistema, in base a quanto usi l'app.",
    "info.notifiche.titolo": "Come funzionano i controlli periodici",
    "info.notifiche.testo1": "Il telefono, quando può, apre da solo l'app in background e guarda se qualche orologio ha bisogno di attenzione — come farebbe la funzione Oggi se la aprissi tu.",
    "info.notifiche.testo2": "Non è un orario preciso: è il sistema a decidere quando farlo, in base a quanto usi l'app di solito.",
    "info.notifiche.testo3": "Su Android con Chrome funziona, a patto di aver installato l'app sulla schermata home. Su iPhone no: Apple non lascia che un'app come questa controlli nulla in background, per una regola del sistema operativo, non per una scelta di Bariletto.",
    senzaNome: "Senza nome", ignoto: "Movimento ignoto",
    "s.nome": "Come lo chiami", "s.nomeAiuto": "Seiko SKX007",
    "s.linea": "Riferimento o modello", "s.lineaAiuto": "Diver's 200m · SKX007J1",
    "s.facoltativo": "facoltativo", "s.identita": "L'orologio",
    "s.manutenzione": "Manutenzione", "s.acquisto": "Data di acquisto",
    "s.revisione": "Ultima revisione",
    "st.prossimaRevisione": "Prossima revisione consigliata",
    "st.revisioneCirca": "Circa {anno}",
    "nota.revisione": "Stima indicativa su un intervallo di tre anni, calcolata dall'ultima revisione se la conosci, altrimenti dalla data di acquisto. Non sostituisce il parere di un orologiaio.",
    "s.movimento": "Che movimento monta", "s.cerca": "4R36, Miyota 9015, Eco-Drive…",
    "s.titoloRicerca": "Cerca il movimento", "s.cercaCatalogo": "Cerca nel catalogo ({n})",
    "s.altriRisultati": "Altri risultati \u2192", "s.suggerimenti": "Potrebbe essere uno di questi",
    "fonte.ufficiale": "dato dalla documentazione del produttore",
    "fonte.comunita": "dato dai riferimenti di settore",
    "fonte.derivato": "dato ereditato dalla famiglia, non verificato su questo calibro",
    "fonte.correggi": "Se non torna, dichiaralo tu: quello che scrivi vince sempre.",
    "s.famiglia": "tutta la famiglia", "s.manuale": "Non lo trovo: lo dichiaro io",
    "s.nonTrovi": "Non lo trovi?",
    "s.rimarchio": "Un produttore d\u00e0 spesso un codice proprio a un movimento che compra da un altro fabbricante: lo stesso calibro pu\u00f2 stare qui sotto un nome diverso. Se non lo trovi, dichiaralo \u2014 \u00e8 quello che fa anche l'orologiaio.",
    "s.cambia": "Cambia movimento", "s.elenco": "Torna all'elenco",
    "s.dichiara": "Dichiaralo tu", "s.salva": "Salva",
    "s.movDichiarato": "Movimento dichiarato",
    "s.riservaOre": "Riserva di carica, in ore", "s.riservaGiorni": "Riserva di carica, in giorni",
    "s.ahAltro": "Un altro valore", "s.ahLibero": "Scrivi il valore esatto",
    "s.nota": "Sta sul libretto o sul sito del produttore. È il numero da cui l'app capisce quando si fermerà.",
    si: "sì", no: "no",
    "s.carica": "Carica a mano", "s.secondi": "Arresto secondi", "s.calendario": "Calendario",
    "s.mano": "Si carica a mano",
    "s.crono": "Ha i pulsanti del cronografo",
    "s.tourbillon": "Ha un tourbillon",
    "s.arrestoLungo": "I secondi si fermano tirando la corona",
    "s.giornoData": "Giorno e data", "s.data": "Ha la data", "s.soloData": "Data",
    "s.giorno": "Ha il giorno della settimana", "s.noCal": "Nessun calendario",
    "s.indiretti": "I secondi hanno un piccolo scatto irregolare",

    /* tipi */
    "t.automatico": "Automatico", "t.manuale": "Carica manuale", "t.cronografo": "Cronografo",
    "t.ecodrive": "Solare", "t.kinetic": "Kinetic", "t.quarzo": "Quarzo",
    "t.springdrive": "Spring Drive", "t.elettrico": "Elettrico", "t.diapason": "Diapason",

    /* unità */
    ora: "ora", orePl: "ore", giorno_: "giorno", giorniPl: "giorni",
    mese: "mese", mesiPl: "mesi", riservaDi: "{v} di riserva", alQuarzo: "al quarzo",
    aBatteria: "a batteria", aDiapason: "a diapason",
    ah: "A/h", cal: "Cal.",

    /* le due pagine */
    "pag.oggi": "Oggi", "pag.altro": "Registro",
    "pag.vai": "Vai a {n}",
    "coll.scorri": "Scorri per vedere gli altri",

    /* backup: sul dispositivo, in chiaro, senza account */
    "bak.gruppo": "I tuoi dati",
    "bak.esporta": "Esporta un backup",
    "bak.importa": "Ripristina da un backup",
    "bak.nota": "Il backup è un file che resta sul telefono: nessun account, nessuna nuvola. Serve se cambi dispositivo o se il browser svuota i dati.",
    "bak.conferma": "Tocca di nuovo: sostituisce tutto",
    "bak.fatto": "Backup salvato: {n} e {v}.",
    "bak.letto": "Ripristinati {n} e {v}.",
    "bak.errore": "Questo file non è un backup di Bariletto.",
    "bak.vuoto": "Non c'è ancora niente da esportare.",
    orologio_: "orologio", orologiPl: "orologi",

    /* PDF: è la stampa del browser, dove si sceglie «Salva come PDF» */
    "pdf.gruppo": "Su carta",
    "pdf.nota": "Si apre la finestra di stampa: da lì scegli la stampante oppure «Salva come PDF».",

    /* errori */
    "err.archivio": "L'archivio non si è aperto. Succede se il browser è in navigazione privata: in quella modalità i dati non possono essere salvati.",
  },

  en: {
    codice: "en-GB",
    frase: "counts the hours you don't watch", collezione: "Collection", registro: "Log",
    "oggi.nulla": "Nothing needs attention",
    "primoUso.titolo": "How the counting works",
    "primoUso.testo1": "The hour count starts the moment you tap one of these buttons, and keeps going until you tap it again.",
    "primoUso.testo2": "Do it every day, and the count always stays aligned.",
    "primoUso.testo3": "If you skip a day without doing anything, the app counts the real hours passed since the last tap, including any hours you may have worn the watch without telling it.",
    "primoUso.bottone": "Got it",
    "coll.tutta": "My collection", "coll.titolo": "Browse the collection", "coll.apri": "{n} · tap to browse", "oggi.giaMesso": "worn today",
    "oggi.prossimoOra": "stops in {q}",
    "oggi.tuttiCarichi": "All wound and running",
    "oggi.restano": "{q} left",
    "reg.periodo": "{n} · since {da}", "reg.attrezzi": "Tools",
    "reg.vediTutto": "See the whole log ({n})",
    "arch.apri": "Movement archive ({n})", "arch.titolo": "Archive",
    "arch.cerca": "Search a caliber or a brand",
    "arch.nulla": "No caliber found.",
    "arch.fatto": "How it's built", "arch.cura": "How to care for it",
    "arch.normale": "What's normal", "arch.fonti": "Sources",
    "arch.indietro": "Back", "arch.leggi": "Read more about this caliber",
    "s.dettaglio": "The watch", "s.modificaVoce": "Edit",

    "stato.moto": "running", "stato.riserva": "low",
    "stato.fermo": "stopped", "stato.scarico": "wound down", "stato.azionare": "needs running",

    messo: "Worn today", soloCaricato: "Wound, not worn",
    "reg.caricato": "wound by hand",
    "m.manuale.scarico": "You haven't wound it in {g}: the reserve is {r} hours. {n} turns of the crown.",
    "g.storia": "Recent history",
    "g.ultimaVolta": "Last worn",
    "g.mai": "Never worn", "g.oggi": "today", "g.ieri": "yesterday", "g.faGiorni": "{g} ago",
    annulla: "I didn't wear it",
    "crono.fatto": "I ran the chronograph too",
    "crono.segnato": "Chronograph run today",
    "oggi.segnato": "Marked, {n}",

    "vuoto.oggi": "Nothing to put on the wrist yet.",
    "vuoto.presentazione": "Bariletto counts the hours you don't watch. An automatic's reserve runs down in silence; a manual waits for your hand on the crown; a chronograph waits for its pushers. Every calibre has its own right way to be cared for, and Bariletto knows it. Add your collection: from today, someone remembers for you.",

    "m.nuovo": "Just added. Wear it once and I'll start keeping count.",
    "m.caricatoNonIndossato": "You've wound it, but haven't worn it yet. Put it on whenever you're ready to actually wear it.",
    "m.eco.fermo": "Stopped: {g} without a charge, and the reserve covers {l}.",
    "m.eco.basso": "{g} in the dark out of {l} of autonomy. One morning on the windowsill is enough.",
    "m.kin.basso": "{g} without movement. Wear it half a day and the capacitor recovers.",
    "m.eco.carico": "Charged. About {r} left.",
    "m.quarzo": "Quartz: it doesn't need you.",
    "m.elettrico": "It's electric: it doesn't need you.",
    "m.elettrico.data": "It runs on its own. Just check the date is right.",
    "m.diapason": "The tuning fork hums along on its own: it doesn't need you.",
    "m.diapason.data": "It runs on its own. Just check the date is right.",
    "m.quarzo.data": "It runs on its own. Just check the date is right.",
    "m.crono": "The chronograph hasn't run in {g}. Put the clutch to work.",
    "m.olio": "Stopped for {g}. Running it puts the oil back where it belongs.",
    "m.scarico.mano": "Reserve spent: {r} hours, and you haven't worn it in {g}. {n} turns of the crown.",
    "m.scarico.scosse": "Reserve spent: {r} hours, and you haven't worn it in {g}. No hand winding: shake it.",
    "m.quasi": "About {o} left. Wear it today, or it stops.",
    "m.pieno": "Charged, {o} of autonomy left. Today you can choose with your heart.", aggiungi: "Add a watch", "agg.breve": "Add", "agg.pieno": "Add a new watch",

    "g.eco.1": "It charges with light, not with the crown. Direct sun is worth a hundred lamps.",
    "g.eco.2": "Fully charged it runs {r}. Behind glass it gets half as much.",
    "g.eco.3": "If the seconds hand jumps in twos, the reserve is nearly out.",
    "g.kin.1": "Neither solar nor automatic: your wrist charges a capacitor.",
    "g.kin.2": "Full charge runs {r}. The capacitor ages: after some years it gets replaced.",
    "g.kin.3": "If it has stopped completely, half a day on the wrist before setting the time.",
    "g.q.1": "It asks nothing of you. When the seconds start jumping in twos, the cell is going.",
    "g.q.2": "In thirty-day months the date needs setting by hand on the first.",
    "g.elt.1": "No winding: it runs on a battery, no spring to tension.",
    "g.elt.2": "If it's been stopped for a long time, don't just fit a new battery: the contacts may have corroded, and sending current through them risks more than it helps — have it checked by someone who knows this calibre.",
    "g.dia.1": "No winding: an electronic tuning fork keeps it running, powered by a battery — no crown to turn for energy.",
    "g.dia.2": "Never force the crown: some Accutrons have a stop mechanism that physically disengages a part when you pull it out — a rough motion can damage it.",
    "g.tourbillon": "The tourbillon is an exposed moving cage: avoid direct knocks to the case, more than you would on an ordinary three-hander.",
    "g.sd.1": "No escapement: the hand glides, it doesn't beat. Silence is normal.",
    "g.sd.2": "{r} hours of reserve. Below that it slows before stopping.",
    "g.mano": "{n} turns of the crown in the resting position. Full reserve: {r} hours.",
    "g.scosse": "No hand winding. If it has stopped, twenty sideways shakes, then onto the wrist. Reserve: {r} hours.",
    "g.data.24h": "Don't correct the date while the 24-hour hand sits between 9 PM and 1 AM: the manual reads that hand, not the main ones. Set the time first, then the date.",
    "g.data.90min": "The date corrects in either direction, forward or back. The forbidden window still exists, but it's only ninety minutes, not four hours: the manufacturer states it on its own pages.",
    "g.indiretti": "The seconds run through an indirect drive: the small uneven stutter is by design, not a fault.",
    "g.data": "Don't touch the date between {da} and {a}: the calendar gears are already engaged.",
    "g.data.doppia": "Two forbidden windows, not one: don't touch the date between {da} and {a}, and don't touch the day between {da2} and {a2}.",
    "g.arresto": "The seconds stop when you pull the crown: you can set it to the second.",
    "g.nonArresto": "The seconds don't stop. Set it to the minute and let the rest go.",
    "g.crono": "Never use the pushers underwater. And don't leave the chronograph running for days.",

    "s.modifica": "Edit the watch", modifica: "Edit", "s.salvaMod": "Save changes",
    elimina: "Delete", "elimina.conferma": "Tap again to delete",
    "elimina.nota": "It leaves the collection, and takes its Log entries with it.",

    voci: "entry", vociPl: "entries",
    "reg.vuoto": "Every watch you put on ends up here.", "reg.apri": "{n} · tap to see it all",
    "reg.rimuovi": "Remove this entry", "reg.confermaRimuovi": "Tap again",
    "reg.portato": "worn on the wrist",
    lingua: "Language", caffe: "Buy me a coffee",
    "col.riga2": "Offline · No account · No data collected",
    "col.riga3": "© 2026 Studionodo · All rights reserved",
    stampa: "Print the collection", "stampa.reg": "Print the log",
    "st.periodo": "from {da} to {a}", "st.solo": "a single entry",
    "st.azione": "What", "st.quando": "When", "st.chi": "Watch",
    "st.stampato": "Printed on {d}", "st.orologi": "{n} in the collection",
    "st.gesti": "The gesture", "st.dati": "The movement", "st.riserva": "Reserve",
    "agg.pronta": "A new version is ready", "agg.ora": "Update",

    "s.titolo": "Add a watch", chiudi: "Close",
    "info.apri": "Explain: {v}",
    "info.anello.titolo": "How to read the ring",
    "info.anello.testo1": "The ring's colour tells you right away where the watch stands, without reading anything else.",
    "info.anello.testo2": "Silver means all is well. Purple means the reserve is dropping, or the watch has stopped. Orange means it's wound down and waiting to be charged. Gold means there's a specific action to take.",
    "info.anello.testo3": "The \u00abvph\u00bb number shows how many times a second the seconds hand moves. The higher it is, the smoother the motion looks.",
    "info.gesti.titolo": "Worn, wound, or run",
    "info.gesti.testo2": "\u00abWorn today\u00bb means you actually had the watch on your wrist today.",
    "info.gesti.testo3": "\u00abWound, not worn\u00bb is for a hand wound watch you keep ready but aren't wearing today. The reserve resets anyway, but the app knows you didn't wear it.",
    "info.gesti.testo4": "\u00abI ran the chronograph too\u00bb is only about the pushers. Wearing the watch isn't enough: the pushers need using now and then, just to keep them working well.",
    "info.registro.titolo": "What the log is",
    "info.registro.testo1": "The log is a diary.",
    "info.registro.testo2": "Every time you mark a watch as worn, wound, or with the chronograph run, it's written down here, with when and what you did.",
    "info.collezione.titolo": "The whole collection",
    "info.collezione.testo1": "These are the same watches you see scrolling on the Today page.",
    "info.collezione.testo2": "Here they're all together in a list, easy to read from top to bottom instead of sideways.",
    "info.archivio.titolo": "What the archive is",
    "info.archivio.testo1": "This archive isn't about your watches.",
    "info.archivio.testo2": "It's a collection of information on how calibres are cared for in general, even ones you don't own yet.",
    "info.carta.titolo": "Why printing",
    "info.carta.testo1": "Here you can print your data on paper, or save it as a PDF.",
    "info.carta.testo2": "The document only contains information that stays true over time. There are no states or usage dates, because those change too fast.",
    "info.dati.titolo": "Backup and export",
    "info.dati.testo1": "You can export a file with all your data. It stays on your phone, no account needed.",
    "info.dati.testo2": "If you restore it, though, everything that's there today gets replaced. That's why the app asks for a second tap before going ahead.",
    "notif.gruppo": "Notifications",
    "notif.attiva": "Turn on periodic checks",
    "notif.attivo": "Notifications on",
    "notif.non-supportato": "Not available on this phone",
    "notif.rifiutato": "Permission denied by the phone",
    "notif.errore": "Couldn't turn them on",
    "notif.nota": "The phone checks on its own, now and then, whether a watch needs attention — even with the app closed. It isn't a fixed schedule: the system decides, based on how often you use the app.",
    "info.notifiche.titolo": "How periodic checks work",
    "info.notifiche.testo1": "When it can, the phone opens the app on its own in the background and looks at whether any watch needs attention — the same thing the Today screen would tell you if you opened it yourself.",
    "info.notifiche.testo2": "It isn't a fixed schedule: the system decides when to do it, based on how often you normally use the app.",
    "info.notifiche.testo3": "On Android with Chrome it works, as long as you've installed the app to the home screen. On iPhone it doesn't: Apple doesn't let an app like this control anything in the background, a rule from the operating system, not a Bariletto choice.",
    senzaNome: "Unnamed", ignoto: "Unknown movement",
    "s.nome": "What you call it", "s.nomeAiuto": "Seiko SKX007",
    "s.linea": "Reference or model", "s.lineaAiuto": "Diver's 200m · SKX007J1",
    "s.facoltativo": "optional", "s.identita": "The watch",
    "s.manutenzione": "Maintenance", "s.acquisto": "Purchase date",
    "s.revisione": "Last service",
    "st.prossimaRevisione": "Recommended next service",
    "st.revisioneCirca": "Around {anno}",
    "nota.revisione": "An approximate estimate over a three year interval, calculated from the last service if you know it, otherwise from the purchase date. It doesn't replace a watchmaker's advice.",
    "s.movimento": "Which movement it runs", "s.cerca": "4R36, Miyota 9015, Eco-Drive…",
    "s.titoloRicerca": "Search for the movement", "s.cercaCatalogo": "Search the catalog ({n})",
    "s.altriRisultati": "More results \u2192", "s.suggerimenti": "Could be one of these",
    "fonte.ufficiale": "from the maker's own documentation",
    "fonte.comunita": "from industry references",
    "fonte.derivato": "inherited from the family, not verified on this caliber",
    "fonte.correggi": "If it doesn't match, declare it yourself: what you write always wins.",
    "s.famiglia": "the whole family", "s.manuale": "Can't find it: I'll declare it myself",
    "s.nonTrovi": "Can't find it?",
    "s.rimarchio": "A brand often gives its own code to a movement it buys from another maker: the same calibre may be here under a different name. If you can't find it, declare it \u2014 that's what a watchmaker does too.",
    "s.cambia": "Change movement", "s.elenco": "Back to the list",
    "s.dichiara": "Declare it yourself", "s.salva": "Save",
    "s.movDichiarato": "Declared movement",
    "s.riservaOre": "Power reserve, in hours", "s.riservaGiorni": "Power reserve, in days",
    "s.ahAltro": "A different value", "s.ahLibero": "Enter the exact value",
    "s.nota": "It's in the manual or on the maker's site. It's the number the app uses to know when it will stop.",
    si: "yes", no: "no",
    "s.carica": "Hand winding", "s.secondi": "Hacking seconds", "s.calendario": "Calendar",
    "s.mano": "Hand winding",
    "s.crono": "Has chronograph pushers",
    "s.tourbillon": "Has a tourbillon",
    "s.arrestoLungo": "The seconds stop when you pull the crown",
    "s.giornoData": "Day and date", "s.data": "Has a date", "s.soloData": "Date",
    "s.giorno": "Has the day of the week", "s.noCal": "No calendar",
    "s.indiretti": "The seconds have a small uneven stutter",

    "t.automatico": "Automatic", "t.manuale": "Hand wound", "t.cronografo": "Chronograph",
    "t.ecodrive": "Solar", "t.kinetic": "Kinetic", "t.quarzo": "Quartz",
    "t.springdrive": "Spring Drive", "t.elettrico": "Electric", "t.diapason": "Tuning fork",

    ora: "hour", orePl: "hours", giorno_: "day", giorniPl: "days",
    mese: "month", mesiPl: "months", riservaDi: "{v} of reserve", alQuarzo: "quartz",
    aBatteria: "battery-powered", aDiapason: "tuning fork",
    ah: "vph", cal: "Cal.",

    "pag.oggi": "Today", "pag.altro": "Log",
    "pag.vai": "Go to {n}",
    "coll.scorri": "Scroll to see the others",

    "bak.gruppo": "Your data",
    "bak.esporta": "Export a backup",
    "bak.importa": "Restore from a backup",
    "bak.nota": "The backup is a file that stays on your phone: no account, no cloud. You'll need it if you change device or the browser clears its data.",
    "bak.conferma": "Tap again: this replaces everything",
    "bak.fatto": "Backup saved: {n} and {v}.",
    "bak.letto": "Restored {n} and {v}.",
    "bak.errore": "This file is not a Bariletto backup.",
    "bak.vuoto": "There is nothing to export yet.",
    orologio_: "watch", orologiPl: "watches",

    "pdf.gruppo": "On paper",
    "pdf.nota": "The print dialog opens: from there pick a printer or \u201cSave as PDF\u201d.",

    "err.archivio": "The archive did not open. This happens in private browsing: in that mode data cannot be saved.",
  },
};

function t(chiave, par) {
  let s = (VOCI[LINGUA] && VOCI[LINGUA][chiave]) ?? VOCI.it[chiave] ?? chiave;
  if (par) for (const k in par) s = s.split("{" + k + "}").join(par[k]);
  return s;
}

/* Numero + unità, con il plurale giusto. In italiano "1 giorni" è un errore
   che si nota; in inglese "1 days" pure. */
function plurale(n, chiaveSing, chiavePlur) {
  return n + " " + (n === 1 ? t(chiaveSing) : t(chiavePlur));
}

const locale = () => t("codice");
function linguaPredefinita() {
  const l = (navigator.language || "it").slice(0, 2).toLowerCase();
  return l === "it" ? "it" : "en";
}


/* Il cambio di lingua scrive nello stato e ricostruisce tutto: cornice
   compresa, altrimenti il nastro resterebbe nella lingua di prima. */
async function cambiaLingua(k) {
  if (k === LINGUA) return;
  LINGUA = k;
  document.documentElement.lang = k;
  await salva("stato", { chiave: "lingua", valore: k });
  costruisciCornice();
  /* ridisegnaTutto() invece di disegna(): con un foglio dell'archivio
     aperto — lista, o la scheda di un singolo movimento — cambiare
     lingua doveva aggiornare anche quello, non solo le due pagine sotto.
     Prima restava nella lingua di apertura finché non lo si richiudeva.
     Le funzioni JS sono note per nome ovunque nel file una volta caricati
     tutti gli script: al momento in cui questa viene davvero chiamata
     (un tocco dell'utente), cornice.js è già stato letto per intero. */
  ridisegnaTutto();
  misuraAnello();
}
