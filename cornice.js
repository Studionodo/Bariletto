/* ------------------------------------------------------------------
   Cornice — testata, indice delle pagine, misure dell'anello, avvio

   Le due pagine si affiancano dentro #ponte e si passa dall'una
   all'altra con il dito. Qui dentro non c'è una riga di aritmetica del
   gesto: lo scorrimento e l'aggancio li fa il browser. È la differenza
   con le vecchie pareti, dove ogni trascinamento era codice nostro —
   e ognuno di quei pezzi era anche un posto dove annidare un bug.
   ------------------------------------------------------------------ */

const el = (tag, cls, testo) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (testo != null) n.textContent = testo;
  return n;
};

const q = (s) => document.querySelector(s);

/* La barra del browser è parte della schermata: se resta ferma mentre
   l'app cambia ora, si vede la cucitura. */
function tingiBarra() {
  const m = document.querySelector('meta[name="theme-color"]');
  if (!m) return;
  const c = getComputedStyle(document.documentElement).getPropertyValue("--room").trim();
  if (c) m.setAttribute("content", c);
}

/* L'ambiente segue l'ora vera. Nessun pulsante: è il concetto del
   quadrante Vanac — l'orizzonte di Tokyo cambia da solo. */
function oraCorrente() {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return "alba";
  if (h >= 9 && h < 17) return "giorno";
  if (h >= 17 && h < 21) return "crepuscolo";
  return "notte";
}


/* ------------------------------------------------------------------
   Disegno: due pagine, ognuna col suo scorrimento da conservare.
   Ridisegnare a ogni tocco riportava in cima, e su una pagina lunga
   come il registro sarebbe insopportabile.
   ------------------------------------------------------------------ */
function disegna() {
  const uno = q("#pag-oggi");
  const due = q("#pag-altro");
  if (!uno || !due) return;

  const scorsoUno = uno.scrollTop;
  const scorsoDue = due.scrollTop;

  uno.innerHTML = ""; uno.append(costruisciOggi());
  due.innerHTML = ""; due.append(costruisciAltro());

  requestAnimationFrame(() => {
    misuraAnello();
    adattaAnello();
    uno.scrollTop = scorsoUno;
    due.scrollTop = scorsoDue;
  });
}

/* Ridisegna quel che è visibile: le pagine e, se aperto, il foglio
   dell'archivio. Chi modifica i dati chiama questa e non pensa a altro. */
function ridisegnaTutto() {
  disegna();
  if (typeof modoFoglio === "undefined" || !q("#foglio")) return;
  if (modoFoglio === "archivio") disegnaArchivio();
  if (modoFoglio === "registro") disegnaRegistro();
  if (modoFoglio === "collezione") disegnaCollezione();
  /* Mancava: la scheda del singolo movimento, raggiunta toccando una
     riga dell'archivio. Senza questa, cambiando lingua con una scheda
     aperta il testo restava in quella vecchia finché non la si chiudeva
     e riapriva — proprio il caso che il lavoro sul bilingue doveva
     coprire. voceArchivioAperta la ricorda: apriVoceArchivio() la
     imposta, disegnaArchivio() la svuota. */
  if (modoFoglio === "voce-archivio" && voceArchivioAperta) apriVoceArchivio(voceArchivioAperta);
}


/* ------------------------------------------------------------------
   L'anello: quanto è grande, e come ci sta il testo dentro.
   ------------------------------------------------------------------ */
function misuraAnello() {
  const a = q(".anello");
  if (!a) return;
  /* Due vincoli, non uno. La larghezza dice quanto è grande il cerchio
     che ci sta nello schermo; l'altezza dice quanto ne resta una volta
     tolti testata, indice e quello che va sotto l'anello — motivo,
     bottone, collezione. Su schermi bassi la sola larghezza lo teneva
     grande e spingeva l'azione del giorno fuori dalla prima schermata.
     Sotto i 196px il testo dentro il cerchio d'oro non ci sta più: da
     lì in giù non si stringe, si scorre. */
  const largo = Math.min(window.innerWidth, 520);
  const pagina = q("#pag-oggi");
  const alto = pagina ? pagina.clientHeight : window.innerHeight;
  const daLargo = largo * 0.66;
  const daAlto = alto - 330;
  const d = Math.round(Math.max(196, Math.min(268, daLargo, daAlto)));
  document.documentElement.style.setProperty("--anello", d + "px");
}

/* Il contenuto dell'anello deve stare dentro il cerchio, non dentro il
   suo quadrato: agli estremi verticali la curva stringe. Se non ci sta,
   TUTTO il contenuto si rimpicciolisce insieme — riducendo solo il nome,
   col carattere di sistema ingrandito finiva più piccolo del calibro. */
function adattaAnello() {
  const a = q(".anello");
  if (!a) return;

  /* Solo gli elementi nel flusso: l'SVG del quadrante è assoluto e alto
     quanto tutto l'anello, e contandolo la misura risultava enorme — la
     riduzione si arrendeva subito e il testo sbordava sugli indici. */
  const figli = [...a.children].filter(
    (f) => f.tagName !== "svg" && getComputedStyle(f).position !== "absolute");
  const h1 = a.querySelector("h1.nome");
  if (!h1) return;

  figli.forEach((f) => { f.style.fontSize = ""; });
  h1.classList.remove("tagliato");

  const base = figli.map((f) => parseFloat(getComputedStyle(f).fontSize));
  const alto = () => figli.reduce((s, f) => {
    const st = getComputedStyle(f);
    return s + f.offsetHeight + parseFloat(st.marginTop) + parseFloat(st.marginBottom);
  }, 0);

  /* Il campo scrivibile è il cerchio d'oro, non tutto l'anello: con il
     testo largo il 56% del diametro, la corda lascia il 46% di altezza. */
  const limite = a.clientHeight * 0.46;
  let fattore = 1;
  let giri = 14;
  while (alto() > limite && fattore > 0.62 && giri--) {
    fattore *= 0.93;
    figli.forEach((f, i) => { f.style.fontSize = (base[i] * fattore).toFixed(2) + "px"; });
  }
  if (alto() > limite) h1.classList.add("tagliato");
}


/* ------------------------------------------------------------------
   La testata e l'indice delle pagine.
   Lo swipe da solo non si vede: due parole in fondo dicono che c'è una
   seconda pagina e ci portano, senza che nessuno debba indovinarlo.
   ------------------------------------------------------------------ */
/* La testata è alta quanto il suo testo, e il suo testo è in rem: se sul
   telefono il carattere di sistema è ingrandito, cresce. Con l'altezza
   scritta a mano nel foglio di stile il primo titolo della pagina
   finiva sotto il velo — si vedeva grigio invece che chiaro, senza che
   niente segnalasse il perché. Qui la misura si prende dal vero. */
function misuraTestata() {
  const testata = q("#testata");
  if (!testata) return;
  const h = Math.ceil(testata.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--alta-testata", (h + 12) + "px");
}

/* position:fixed + inset:0 non si restringe da solo quando si apre la
   tastiera su Android — resta ancorato all'intero schermo, e un foglio
   centrato al suo interno finisce con la parte bassa dietro la
   tastiera, dove i tocchi non arrivano (era il caso della ricerca
   calibro: le carte in fondo alla lista esistevano ma non si potevano
   scorrere). visualViewport è l'unica API che riflette lo spazio
   davvero visibile, tastiera esclusa — dove esiste, la usiamo; dove
   non esiste, il CSS ha già un fallback su dvh. */
function misuraViewportVisibile() {
  const vv = window.visualViewport;
  if (!vv) return;
  document.documentElement.style.setProperty("--altezza-visibile", vv.height + "px");
}

function costruisciCornice() {
  const testata = q("#testata");
  if (testata) {
    testata.innerHTML = "";
    const marchio = el("div", null, NOME_APP);
    marchio.id = "marchio";
    marchio.dataset.nome = NOME_APP;
    const frase = el("div", null, t("frase"));
    frase.id = "frase";
    testata.append(marchio, frase);
  }
  misuraTestata();

  const indice = q("#indice");
  if (!indice) return;
  indice.innerHTML = "";
  ["pag.oggi", "pag.altro"].forEach((chiave, i) => {
    const b = el("button", "voce-indice" + (i === paginaCorrente() ? " acceso" : ""), t(chiave));
    b.setAttribute("aria-label", t("pag.vai", { n: t(chiave) }));
    b.onclick = () => vaiA(i);
    indice.append(b);
  });
}

function paginaCorrente() {
  const p = q("#ponte");
  if (!p || !p.clientWidth) return 0;
  return Math.round(p.scrollLeft / p.clientWidth);
}

function vaiA(n) {
  const p = q("#ponte");
  if (!p) return;
  p.scrollTo({ left: n * p.clientWidth, behavior: "smooth" });
}

/* L'indice segue il dito. Il listener è passivo: non deve mai avere
   voce in capitolo sul gesto, solo accorgersi di dove è arrivato. */
function seguiPagina() {
  const p = q("#ponte");
  if (!p) return;
  let ultima = -1;
  let attesa = null;
  p.addEventListener("scroll", () => {
    if (attesa) return;
    attesa = requestAnimationFrame(() => {
      attesa = null;
      const n = paginaCorrente();
      if (n === ultima) return;
      ultima = n;
      [...q("#indice").children].forEach((b, i) => b.classList.toggle("acceso", i === n));
    });
  }, { passive: true });
}


/* ------------------------------------------------------------------
   Aggiornamenti: annunciati, mai imposti.
   ------------------------------------------------------------------ */
function registraAggiornamenti() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then((reg) => {
    if (reg.waiting) avvisoVersione(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const nuovo = reg.installing;
      if (!nuovo) return;
      nuovo.addEventListener("statechange", () => {
        if (nuovo.state === "installed" && navigator.serviceWorker.controller) {
          avvisoVersione(nuovo);
        }
      });
    });
  }).catch(() => {});

  let ricaricato = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (ricaricato) return;
    ricaricato = true;
    location.reload();
  });
}

function avvisoVersione(worker) {
  if (q("#aggiorna")) return;
  const barra = el("div");
  barra.id = "aggiorna";
  barra.append(el("span", null, t("agg.pronta")));
  const b = el("button", null, t("agg.ora"));
  b.onclick = () => {
    worker.postMessage({ tipo: "salta" });
    /* Se per qualunque ragione il cambio di controllo non arriva — il
       worker già attivo, un errore silenzioso, una versione di Chrome
       che non lo emette — il bottone resterebbe lì a non fare niente.
       Dopo un secondo e mezzo si ricarica comunque: al peggio è una
       ricarica in più, al meglio è l'aggiornamento che parte. */
    setTimeout(() => location.reload(), 1500);
  };
  barra.append(b);
  document.body.append(barra);
}


/* ------------------------------------------------------------------
   Avvio.
   ------------------------------------------------------------------ */
async function avvio() {
  try {
    document.documentElement.dataset.ora = oraCorrente();

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    db = await apri();

    const salvata = await tx("stato", "readonly", (s) => s.get("lingua"));
    LINGUA = (salvata && salvata.valore) || linguaPredefinita();
    document.documentElement.lang = LINGUA;

    orologi = await leggiTutti("orologi");
    registro = await leggiTutti("registro");

    costruisciCornice();
    misuraViewportVisibile();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", misuraViewportVisibile);
    }
    disegna();
    seguiPagina();
    tingiBarra();
    registraAggiornamenti();

    /* Fuori dal percorso critico apposta: se il service worker è lento,
       assente, o la funzione non è supportata dal browser, l'app deve
       comunque essere già aperta e usabile. Solo l'interruttore nella
       pagina Registro nota la differenza, quando la promessa risolve. */
    notificheAttive()
      .then((attivo) => { notificheStato = attivo ? "attivo" : "inattivo"; disegna(); })
      .catch(() => { notificheStato = "inattivo"; });

    setInterval(() => {
      const o = oraCorrente();
      if (document.documentElement.dataset.ora !== o) {
        document.documentElement.dataset.ora = o;
        tingiBarra();
      }
    }, 60000);

    /* Ruotando lo schermo cambia la larghezza di una pagina: senza
       riportare il ponte sulla pagina giusta si resterebbe a metà fra
       le due. */
    addEventListener("resize", () => {
      const n = paginaCorrente();
      misuraTestata();
      misuraAnello();
      adattaAnello();
      const p = q("#ponte");
      if (p) p.scrollLeft = n * p.clientWidth;
    });
  } catch (e) {
    document.body.innerHTML =
      '<div style="padding:60px 26px;font-family:Georgia,serif;color:#EDEBF2;' +
      'line-height:1.6">' + t("err.archivio") + "</div>";
  }
}

avvio();
