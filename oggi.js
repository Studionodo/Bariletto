/* ------------------------------------------------------------------
   Pagina uno — Oggi

   Prima c'era un quadrante disegnato con la precisione di un orologio
   vero, e dentro ci scriveva sopra: nome, stato, calibro, A/H, riserva,
   cinque corpi tipografici diversi stretti in un cerchio che non era
   pensato per contenere testo. L'elemento più grande della pagina non
   portava nessuna informazione, e quella vera restava piccola perché
   doveva starci dentro. Sotto, la stessa collezione tornava una seconda
   volta in un carosello, spesso ripetendo l'orologio appena mostrato
   sopra.

   Qui non c'è più un solo orologio scelto per te dentro una vetrina:
   c'è un elenco delle cose da fare, ordinato per urgenza. La prima riga
   è quella che l'app sceglierebbe comunque — più alta, con il gesto
   in evidenza — le altre sotto sono compatte, un gesto a un tocco
   ciascuna, senza dover entrare nel dettaglio per agire. Nessun
   orologio compare due volte. I colori restano quelli di sempre: cambia
   la struttura, non la palette. */

/* Le due icone dei gesti sulle righe compatte. A tratto, senza
   riempimento, stesso linguaggio già usato per la matita del
   selettore A/H e per il più dell'aggiunta rapida — non un terzo
   stile di icona inventato per l'occasione. */
const ICONA_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
/* Non una generica freccia di rotazione — quella si legge come
   "aggiorna" in qualunque altra app. Una corona scanalata con un
   accenno di rotazione intorno: l'atto vero di dare corda, non una
   metafora presa in prestito da un'icona che vuol dire altro ovunque. */
const ICONA_CORONA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="7" width="5" height="11" rx="1.4"/><path d="M13.6 10.3h3.8M13.6 12.5h3.8M13.6 14.7h3.8"/><path d="M10.3 8.2a6 6 0 1 0 .9 9.1"/><path d="M9.2 15l1.3 2 2-1.4"/></svg>';

/* Segna un gesto secondario — caricato su una riga, o il gesto su una
   riga compatta qualsiasi — con un lampo invece di un ridisegno
   immediato. Stessa idea della conferma piena dell'eroe (segnaConConferma
   in archivio.js), ma più leggera: qui non c'è un banner di testo da
   proteggere dal popup del primo utilizzo, solo un impulso di colore,
   quindi il ridisegno può arrivare prima, non deve aspettare i 4
   secondi interi pensati per una frase da leggere. */
function segnaConLampo(azioneOra, o, elementoDaAnimare) {
  unaVolta(() => azioneOra(o, false, false)).then(() => {
    if (elementoDaAnimare) elementoDaAnimare.classList.add("lampo");
    setTimeout(() => disegna(), 700);
    setTimeout(() => mostraPrimoUsoSeServe(), 780);
  });
}

/* La riga eroe: la prima dell'elenco, quella che l'app propone. Nome,
   motivo per intero, il gesto in un bottone pieno. Nessuno stato scritto
   a parte: il motivo stesso lo dice già, in una frase, non in
   un'etichetta secca ripetuta due volte come succedeva prima con
   l'anello e la frase sotto che dicevano la stessa riserva in due modi
   diversi. */
function rigaEroe(o, b, proposto) {
  const carta = el("div", "carta-gesto eroe-oggi");
  carta.append(el("h1", "nome", o.nome));
  if (o.linea) carta.append(el("span", "linea", o.linea));

  if (proposto) {
    carta.append(el("p", "motivo", b.motivo));
    const rigaAz = el("div", "riga-azione-principale");
    const az = el("button", "azione dopo", t("messo"));
    az.onclick = () => {
      az.disabled = true;
      segnaConConferma(o, (nome) => mostraConfermaGesto(rigaAz, nome));
    };
    rigaAz.append(az, infoTocco(t("info.gesti.titolo"),
      [t("info.gesti.testo2"), t("info.gesti.testo3"), t("info.gesti.testo4")], "info-azione"));
    carta.append(rigaAz);
  } else {
    /* Quiete: nessun gesto da proporre, o perché ci hai già pensato
       oggi, o perché nessuno ha davvero bisogno di te adesso. Stesso
       testo di sempre, stesso popup del primo utilizzo raggiungibile. */
    const rigaQuiete = el("div", "riga-titolo-quiete");
    rigaQuiete.append(el("p", "titolo-quiete", t("oggi.nulla")),
      infoTocco(t("primoUso.titolo"),
        [t("primoUso.testo1"), t("primoUso.testo2"), t("primoUso.testo3")]));
    carta.append(rigaQuiete);
    carta.append(el("p", "motivo secondario",
      Number.isFinite(b.restanti) && b.restanti > 0
        ? o.nome + " " + t("oggi.prossimoOra", { q: durata(b.restanti) })
        : t("oggi.tuttiCarichi")));
  }
  return carta;
}

/* Sostituisce la sola riga del bottone con la conferma del nome appena
   segnato. Non tocca il resto della carta né la pagina: il ridisegno
   vero, quello che passa al prossimo orologio, arriva da solo dopo il
   tempo di lettura, deciso da segnaConConferma. */
function mostraConfermaGesto(rigaAz, nome) {
  const conf = el("div", "conferma-gesto");
  conf.append(el("span", "pallino"), el("span", "", t("oggi.segnato", { n: nome })));
  rigaAz.replaceChildren(conf);
}

/* Una riga compatta. Lo stato viene prima del nome, ed è la scelta che
   regge tutta la schermata: Oggi non è un catalogo (per sfogliare c'è
   la collezione, e c'è il Registro), risponde a una domanda sola, di
   chi devo occuparmi adesso. Col nome in testa dovresti leggere ogni
   riga per intero per saperlo; con lo stato in testa scorri l'occhio e
   chi sta male salta fuori da solo. Il nome resta, più piccolo: serve
   a identificare, non a farsi cercare.

   Il gesto è quello giusto per QUEL tipo di orologio, non lo stesso per
   tutti: un manuale può caricarsi senza essere indossato lo stesso
   giorno, quindi il tocco qui fa "Caricato, ma non indossato", non
   "Indossato oggi" travestito. Se l'hai già segnato oggi, il gesto
   lascia il posto a una spunta ferma: toccarlo di nuovo non
   aggiungerebbe nulla, solo un secondo timbro sulla stessa giornata. */
function rigaCompatta(o, b, alPolso) {
  const r = el("div", "riga fra riga-oggi");
  r.setAttribute("role", "button");
  r.setAttribute("tabindex", "0");
  r.setAttribute("aria-label", o.nome);
  const apri = () => apriScheda(o, "dettaglio");
  r.addEventListener("click", apri);
  r.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); apri(); }
  });

  const sx = el("div", "riga-oggi-sx");
  const pallino = el("span", "pallino");
  pallino.style.background = COLORE[b.stato];
  const info = el("div", "riga-oggi-info");

  /* Prima lo stato, poi il nome. */
  const stato = el("p", "riga-oggi-stato");
  if (alPolso) { stato.textContent = t("oggi.giaMesso"); }
  else if (Number.isFinite(b.restanti) && b.restanti > 0) {
    stato.textContent = t("oggi.restano", { q: durata(b.restanti) });
  } else { stato.textContent = nomeStato(b.stato); }
  info.append(stato, el("p", "riga-oggi-nome", o.nome));

  /* Il colore vive sul pallino e sul gesto, non sul testo dello stato:
     con lo stato ora in corpo grande, colorarlo lo renderebbe meno
     leggibile proprio nel punto in cui deve leggersi meglio. Il colore
     dice "quanto urge", il testo dice "cosa", due lavori distinti. */
  if (alPolso) { pallino.style.background = "var(--oro)"; r.classList.add("riga-quieta"); }
  sx.append(pallino, info);
  r.append(sx);

  const manuale = o.mano || o.tipo === "manuale";
  if (alPolso) {
    const fatto = el("span", "riga-fatto");
    fatto.innerHTML = ICONA_CHECK;
    fatto.setAttribute("aria-hidden", "true");
    r.append(fatto);
  } else {
    const gesto = el("button", "riga-gesto");
    gesto.innerHTML = manuale ? ICONA_CORONA : ICONA_CHECK;
    gesto.setAttribute("aria-label", manuale ? t("soloCaricato") : t("messo"));
    gesto.style.color = COLORE[b.stato];
    gesto.style.borderColor = COLORE[b.stato];
    gesto.onclick = (e) => {
      e.stopPropagation();
      gesto.disabled = true;
      segnaConLampo(manuale ? segnaCaricaOra : segnaOra, o, gesto);
    };
    r.append(gesto);
  }
  return r;
}

function costruisciOggi() {
  const d = el("div", "colonna");
  const classifica = ordinaPerBisogno(orologi);

  /* Collezione vuota: una frase e un solo gesto possibile, più — solo
     qui, solo quando non c'è ancora nulla — una presentazione sintetica
     di cosa fa l'app, per chi la apre la primissima volta. Il
     contenitore usa lo stesso spazio verticale reale già calcolato per
     il resto dell'app (testata + indice sottratti), non un'altezza
     indovinata: si adatta da solo a schermi di dimensioni diverse.
     Invariato: non era parte del problema di cui abbiamo parlato. */
  if (!classifica.length) {
    d.classList.add("vuoto-pieno");
    d.append(el("div", "vuoto-spaziatore"));
    const gruppoAlto = el("div", "vuoto-gruppo-alto");
    gruppoAlto.append(el("p", "vuoto dopo", t("vuoto.oggi")));
    const agg = el("button", "azione secondaria dopo", t("aggiungi"));
    agg.onclick = () => apriScheda();
    gruppoAlto.append(agg);
    d.append(gruppoAlto, el("div", "vuoto-spaziatore"),
             el("p", "presentazione-vuoto", t("vuoto.presentazione")));
    return d;
  }

  d.append(el("span", "etichetta data-oggi", new Date().toLocaleDateString(locale(),
    { weekday: "long", day: "numeric", month: "long" })));

  const eOggi = (o) => o.ultimoPolso && sameDay(o.ultimoPolso, Date.now());
  const liberi = classifica.filter(({ o }) => !eOggi(o));
  const proposto = liberi.length ? liberi[0] : null;
  const cala = [...classifica]
    .filter((x) => Number.isFinite(x.b.restanti) && x.b.restanti > 0)
    .sort((a, b) => a.b.restanti - b.b.restanti)[0];
  const primo = proposto || cala || classifica[0];

  /* Il risalto si guadagna con l'urgenza, non con la posizione. Prima
     il primo orologio riceveva sempre la carta grande, bordo, sfondo e
     bottone pieno, anche quando il suo unico messaggio era "non c'è
     niente da fare": la cosa più ingombrante dello schermo dedicata al
     contenuto meno urgente possibile, mentre un orologio nella stessa
     identica situazione, due righe sotto, stava in una riga di due
     parole. Due pesi diversi per lo stesso dato.

     "moto" è l'unico stato che non chiede niente: gli altri quattro
     (riserva, fermo, scarico, azionare) chiedono tutti qualcosa. Se in
     cima non c'è nessuno che chiede, nessuna carta grande: tutti in
     elenco, compreso il primo. Il giorno in cui qualcuno sta davvero
     male, quello e solo quello si prende il trattamento diverso. */
  const chiedeDavvero = primo.b.stato !== "moto";

  if (chiedeDavvero) {
    d.append(rigaEroe(primo.o, primo.b, !!proposto));

    if (proposto && (proposto.o.mano || proposto.o.tipo === "manuale")) {
      const car = el("button", "quieta dopo-corto", t("soloCaricato"));
      car.onclick = () => segnaCarica(proposto.o);
      d.append(car);
    }
  } else {
    /* Senza carta grande, tre cose che vivevano al suo interno
       sparirebbero: la frase di quiete, l'informazione su quando il
       primo si fermerà, e l'icona che apre la spiegazione del
       conteggio, che è l'unico modo per riaprirla dopo il primo
       utilizzo. Qui tornano in una riga discreta sopra l'elenco:
       stessa informazione, senza il teatro di una carta bordata per
       dire che non c'è niente da fare. */
    const quiete = el("div", "quiete-oggi");
    const capo = el("div", "riga-titolo-quiete");
    capo.append(el("p", "titolo-quiete", t("oggi.nulla")),
      infoTocco(t("primoUso.titolo"),
        [t("primoUso.testo1"), t("primoUso.testo2"), t("primoUso.testo3")]));
    quiete.append(capo);
    quiete.append(el("p", "motivo secondario",
      Number.isFinite(primo.b.restanti) && primo.b.restanti > 0
        ? primo.o.nome + " " + t("oggi.prossimoOra", { q: durata(primo.b.restanti) })
        : t("oggi.tuttiCarichi")));
    d.append(quiete);
  }

  /* Portare un cronografo non vuol dire averlo azionato: la frizione
     vuole girare. Invariato rispetto a prima. */
  const crono = orologi.filter((o) => o.tipo === "cronografo" && eOggi(o) &&
    !(o.ultimoCrono && sameDay(o.ultimoCrono, Date.now())));
  crono.forEach((o) => {
    const b = el("button", "quieta link-centro stretto",
      crono.length > 1 ? t("crono.fatto") + " \u00B7 " + o.nome : t("crono.fatto"));
    b.onclick = () => segnaCrono(o);
    d.append(b);
  });

  /* Il resto della collezione. L'elenco esclude il primo solo se il
     primo è finito nella carta grande: se non l'ha guadagnata, sta qui
     con tutti gli altri, e la schermata è un elenco solo, uniforme.
     Prima qui c'era un carosello orizzontale che ripeteva tutta la
     collezione, eroe compreso — la stessa cosa mostrata due volte a due
     centimetri di distanza. Un elenco non può ripetersi per
     costruzione: o una riga è l'eroe, o è qui sotto, mai entrambe. */
  const resto = chiedeDavvero
    ? classifica.filter((x) => x.o.id !== primo.o.id)
    : classifica;
  if (resto.length) {
    const capoRiga = el("div", "titolo-riga dopo");
    capoRiga.append(el("span", "titolo-sezione", t("coll.tutta")));
    const aggRapida = el("button", "agg-rapida");
    aggRapida.setAttribute("aria-label", t("agg.pieno"));
    aggRapida.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span>' + t("agg.breve") + '</span>';
    aggRapida.onclick = () => apriScheda();
    capoRiga.append(aggRapida);
    d.append(capoRiga);

    const elenco = el("div", "elenco-oggi");
    resto.forEach(({ o, b }) => elenco.append(rigaCompatta(o, b, eOggi(o))));
    d.append(elenco);
  } else {
    /* Un solo orologio in collezione: l'eroe è tutta la collezione,
       niente elenco sotto. Il + resta comunque raggiungibile. */
    const aggRapida = el("button", "agg-rapida dopo");
    aggRapida.setAttribute("aria-label", t("agg.pieno"));
    aggRapida.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span>' + t("agg.breve") + '</span>';
    aggRapida.onclick = () => apriScheda();
    d.append(aggRapida);
  }

  return d;
}

/* Date parlate: oggi, ieri, N giorni fa, poi la data piena. Usata anche
   da foglio.js per "ultima volta indossato": non spostare senza cercare
   ogni chiamata. */
function quando(ts) {
  if (ts == null) return t("g.mai");
  const g = giorniDa(ts);
  if (g <= 0) return t("g.oggi");
  if (g === 1) return t("g.ieri");
  if (g < 60) return t("g.faGiorni", { g: plurale(g, "giorno_", "giorniPl") });
  return new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
}
