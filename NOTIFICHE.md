# Le notifiche di Ninna: cosa fanno, cosa non fanno, e perché

Questo documento esiste perché la domanda "perché non arriva la notifica?"
tornerà. Meglio scriverla una volta bene che rispiegarla ogni volta.

## Cosa fanno oggi

Ninna manda tre tipi di avviso: trenta minuti prima del prossimo pisolino
previsto, quarantacinque minuti prima della routine serale, e quando è ora
di ripetere una dose di farmaco o integratore per cui hai impostato una
ripetizione. Tutti e tre usano lo stesso meccanismo, introdotto con le
notifiche del sonno e poi riutilizzato tale e quale per i promemoria di
dose: un calcolo fatto ogni volta che l'app si apre, che programma un
`setTimeout` per gli eventi che cadono nelle prossime dodici ore.

## Il limite, detto chiaro

**Se chiudi Ninna, o il telefono resta bloccato a lungo, quella notifica non
parte.** Non è un bug da correggere: è quello che è tecnicamente possibile
fare con un'applicazione web che non ha un server dietro.

Un `setTimeout` vive finché vive la pagina. Chiudere l'app, scorrerla via
dai processi recenti, o un sistema operativo che decide di terminare
Chrome per risparmiare batteria: in ognuno di questi casi il timer sparisce
con lui. Su alcuni Android particolarmente aggressivi nel risparmio
energetico (Xiaomi, Huawei, certi Samsung), questo può succedere anche con
l'app semplicemente in background, schermo acceso.

## Perché non l'abbiamo risolto con una soluzione "vera"

Esisteva un'API pensata esattamente per questo: **Notification Triggers**,
con un `TimestampTrigger` che permetteva di programmare una notifica
consegnata dal sistema operativo all'ora giusta, anche a browser chiuso,
senza bisogno di un server. Sembrava la risposta perfetta.

Google l'ha abbandonata. La pagina ufficiale lo dice senza girarci intorno:
*"Lo sviluppo di Notification Triggers... è terminato. Non era chiaro che
potessimo garantire un'esperienza affidabile e coerente tra le
piattaforme."* Non è mai uscita da uno stato sperimentale, e non tornerà.

Quello che resta, per una notifica davvero garantita a qualsiasi ora, è
la **Push API**: un server che manda il messaggio al momento giusto. Questo
significa:

- Un backend che sa chi deve ricevere cosa e quando — Ninna oggi non ha
  server, non ha account, non sa chi sei.
- La fine dell'offline-first: l'app dipenderebbe da una connessione e da
  un'infrastruttura esterna per una delle sue funzioni.
- "Cos'è Ninna" smetterebbe di essere vera nel punto in cui dice che l'app
  non contatta nessuna terza parte.

Non è una scelta tecnica minore. È la stessa decisione architetturale
discussa per l'idea delle farmacie di turno con geolocalizzazione: fattibile,
ma solo cambiando cosa Ninna *è*. Per ora resta in stand-by, insieme a
quella.

## Cosa significa in pratica

Le notifiche di Ninna sono un **rinforzo**, non un allarme su cui contare.
Il dato vero — l'orario previsto, la dose dovuta — è sempre visibile in Oggi
ogni volta che apri l'app, indipendentemente da quanto tempo è rimasta
chiusa. La notifica è un bonus per quando capita di averla aperta al
momento giusto, non il meccanismo principale.

Se un giorno smetterà di sembrare un compromesso e servirà davvero una
consegna garantita — per i promemoria di dose in particolare, dove la posta
in gioco è più alta di un pisolino saltato — la strada è il server. Quella
scelta non si prende di corsa: si prende sapendo che cambia la natura
dell'app, con lo stesso peso della farmacia di turno.
