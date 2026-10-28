/* ------------------------------------------------------------------
   Cornice: attrezzi comuni, l'ora del giorno, il foglio, l'avvio.

   La struttura dell'app è questa, e niente di più:
     una pagina      la collezione, con in cima chi riposa da più tempo
     un foglio       sale dal basso sopra la pagina e ospita tutto il
                     resto: la scheda di un orologio, il modulo per
                     aggiungerlo, il cronocomparatore, le impostazioni,
                     l'archivio. Dentro il foglio si va avanti e
                     indietro come in una pila, senza aprire un foglio
                     sopra l'altro.
   ------------------------------------------------------------------ */

const el = (tag, cls, testo) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (testo != null) n.textContent = testo;
  return n;
};
const q = (s) => document.querySelector(s);

/* Icone a tratto sottile, tutte sulla stessa griglia da 24. */
const ICONA = {
  impostazioni: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  piu: '<path d="M12 5v14M5 12h14"/>',
  indietro: '<path d="M15 5l-7 7 7 7"/>',
  avanti: '<path d="M9 5l7 7-7 7"/>',
  su: '<path d="M6 15l6-6 6 6"/>',
  polso: '<path d="M8 3h8l-1 4H9zM9 17h6l1 4H8z"/><circle cx="12" cy="12" r="5"/><path d="M12 10v2l1.3 1.3"/>',
  corona: '<circle cx="11" cy="12" r="6"/><path d="M17 10.5h2.5v3H17"/><path d="M11 9v3h2.5"/>',
  microfono: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  libro: '<path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M17 20h2V7.5"/><path d="M8 8.5h6M8 12h6"/>',
  matita: '<path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M13.5 7.5l3 3"/>',
  cestino: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  alba: '<path d="M4 18h16M7 14a5 5 0 0 1 10 0"/><path d="M12 4v3M5.6 7.6l1.4 1.4M18.4 7.6 17 9M3 21h18"/>',
  giorno: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  crepuscolo: '<path d="M4 17h16M7.5 13.5a4.5 4.5 0 0 1 9 0"/><path d="M12 9V6M9 7l3-3 3 3M3 20.5h18"/>',
  notte: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  caffe: '<path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M7 4c0 .8-1 1-1 2M11 4c0 .8-1 1-1 2"/>',
};
function icona(nome, misura = 20) {
  return '<svg class="icona" viewBox="0 0 24 24" width="' + misura + '" height="' + misura +
    '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONA[nome] || "") + "</svg>";
}
/* Un bottone con icona e testo, il mattone di quasi ogni comando. */
function bottone(cls, testo, nomeIcona, azione) {
  const b = el("button", cls);
  b.innerHTML = (nomeIcona ? icona(nomeIcona, 18) : "") + "<span></span>";
  b.querySelector("span").textContent = testo;
  if (azione) b.onclick = azione;
  return b;
}


/* ------------------------------------------------------------------
   L'ora del giorno.
   I colori dell'app seguono l'ora vera, in quattro fasce: è il concetto
   del quadrante Vanac, l'orizzonte di Tokyo che cambia da solo. Non c'è
   un comando per sceglierli: la pillola in testata dice in che fascia
   siamo, e toccandola si legge la regola.
   ------------------------------------------------------------------ */
const FASCE = [
  { id: "alba", da: 5, a: 9 },
  { id: "giorno", da: 9, a: 17 },
  { id: "crepuscolo", da: 17, a: 21 },
  { id: "notte", da: 21, a: 5 },
];
function oraCorrente() {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return "alba";
  if (h >= 9 && h < 17) return "giorno";
  if (h >= 17 && h < 21) return "crepuscolo";
  return "notte";
}

/* La barra del browser è parte della schermata: se resta ferma mentre
   l'app cambia ora, si vede la cucitura. */
function tingiBarra() {
  const m = q('meta[name="theme-color"]');
  if (!m) return;
  const c = getComputedStyle(document.documentElement).getPropertyValue("--room").trim();
  if (c) m.setAttribute("content", c);
}


/* ------------------------------------------------------------------
   Il disegno. Ridisegnare a ogni tocco riportava in cima: lo
   scorrimento si conserva, sia della pagina sia del foglio aperto.
   ------------------------------------------------------------------ */
function disegna() {
  const app = q("#app");
  if (!app) return;
  const scorso = window.scrollY;
  app.innerHTML = "";
  app.append(costruisciPagina());
  window.scrollTo(0, scorso);
}

/* Chi modifica i dati chiama questa e non pensa ad altro: si ridisegna
   la pagina e, se è aperto, il foglio. */
function ridisegnaTutto() {
  disegna();
  disegnaFoglio();
}


/* ------------------------------------------------------------------
   Il foglio.
   Una pila di schermate: in cima quella visibile. Ogni schermata è un
   tipo e i suoi dati; il disegno lo fa il costruttore registrato per
   quel tipo in COSTRUTTORI (scheda.js, misura.js, impostazioni.js).
   ------------------------------------------------------------------ */
const COSTRUTTORI = {};
let pila = [];

function apriFoglio(tipo, dati) {
  if (q("#velo.su") && pila.length) { pila.push({ tipo, dati }); disegnaFoglio(true); return; }
  const uscente = q("#velo");
  if (uscente) uscente.remove();
  pila = [{ tipo, dati }];
  const velo = el("div"); velo.id = "velo";
  const foglio = el("div", "foglio"); foglio.id = "foglio";
  foglio.setAttribute("role", "dialog");
  foglio.setAttribute("aria-modal", "true");
  velo.append(foglio);
  document.body.append(velo);
  velo.addEventListener("pointerdown", (e) => { if (e.target === velo) chiudiFoglio(); });
  addEventListener("keydown", tastoFoglio);
  q("#app").setAttribute("inert", "");
  disegnaFoglio(true);
  requestAnimationFrame(() => velo.classList.add("su"));
}

/* Avanti dentro il foglio, o indietro di un passo. */
const avantiFoglio = (tipo, dati) => apriFoglio(tipo, dati);
function indietroFoglio() {
  if (pila.length <= 1) return chiudiFoglio();
  const uscente = pila.pop();
  const c = COSTRUTTORI[uscente.tipo];
  if (c && c.chiudi) c.chiudi(uscente.dati);
  disegnaFoglio(true);
}

/* Sostituisce la schermata in cima senza aggiungere un passo: da
   «dettaglio» a «modifica» dello stesso orologio, per esempio. */
function sostituisciFoglio(tipo, dati) {
  if (!pila.length) return apriFoglio(tipo, dati);
  pila[pila.length - 1] = { tipo, dati };
  disegnaFoglio(true);
}

function disegnaFoglio(nuovo) {
  const f = q("#foglio");
  if (!f || !pila.length) return;
  const cima = pila[pila.length - 1];
  const c = COSTRUTTORI[cima.tipo];
  if (!c) return;
  /* Una schermata che sta lavorando (il cronocomparatore mentre
     ascolta) non si ridisegna sotto le mani: perderebbe la tela. */
  if (!nuovo && c.occupato && c.occupato(cima.dati)) return;
  const corpoPrima = f.querySelector(".foglio-corpo");
  const scorso = !nuovo && corpoPrima ? corpoPrima.scrollTop : 0;
  f.innerHTML = "";
  f.className = "foglio" + (c.classe ? " " + c.classe : "");
  const esito = c.disegna(cima.dati, f);
  if (esito === false) { indietroFoglio(); return; }
  const corpo = f.querySelector(".foglio-corpo");
  if (corpo) corpo.scrollTop = scorso;
}

function chiudiFoglio() {
  const v = q("#velo"); if (!v) return;
  pila.forEach((p) => { const c = COSTRUTTORI[p.tipo]; if (c && c.chiudi) c.chiudi(p.dati); });
  pila = [];
  removeEventListener("keydown", tastoFoglio);
  q("#app").removeAttribute("inert");
  v.classList.remove("su");
  setTimeout(() => { if (!pila.length) v.remove(); }, 380);
}

function tastoFoglio(e) {
  if (e.key === "Escape") { e.preventDefault(); indietroFoglio(); }
}

/* La testata comune a ogni schermata del foglio: a sinistra si torna
   indietro (o si chiude, se è la prima), al centro il titolo, a destra
   un comando facoltativo. */
function capoFoglio(f, titolo, destra) {
  const capo = el("div", "foglio-capo");
  const primo = pila.length <= 1;
  const sx = el("button", "tondo piccolo");
  sx.innerHTML = icona(primo ? "piu" : "indietro", 20);
  if (primo) sx.classList.add("chiudi-x");
  sx.setAttribute("aria-label", t(primo ? "chiudi" : "indietro"));
  sx.onclick = indietroFoglio;
  capo.append(sx, el("span", "foglio-titolo", titolo || ""));
  if (destra) capo.append(destra); else capo.append(el("span", "segnaposto"));
  f.append(el("div", "maniglia"), capo);
  const corpo = el("div", "foglio-corpo");
  f.append(corpo);
  return corpo;
}

/* Un pannello di sola lettura: titolo e qualche riga. */
COSTRUTTORI.info = {
  classe: "corto",
  disegna(d, f) {
    const corpo = capoFoglio(f, d.titolo);
    (Array.isArray(d.testi) ? d.testi : [d.testi]).forEach((r) => {
      if (typeof r === "string") corpo.append(el("p", "prosa", r));
      else corpo.append(r);
    });
  },
};
const apriInfo = (titolo, testi) => apriFoglio("info", { titolo, testi });


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
        if (nuovo.state === "installed" && navigator.serviceWorker.controller) avvisoVersione(nuovo);
      });
    });
  }).catch(() => {});

  /* Alla primissima visita il service worker prende il controllo da
     solo: non c'è niente di vecchio da sostituire, e ricaricare la
     pagina in quel momento la faceva lampeggiare senza motivo. */
  const avevaControllo = !!navigator.serviceWorker.controller;
  let ricaricato = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (ricaricato || !avevaControllo) return;
    ricaricato = true;
    location.reload();
  });
}

function avvisoVersione(worker) {
  if (q("#aggiorna")) return;
  const barra = el("div"); barra.id = "aggiorna";
  barra.append(el("span", null, t("agg.pronta")));
  const b = el("button", null, t("agg.ora"));
  b.onclick = () => {
    worker.postMessage({ tipo: "salta" });
    /* Se il cambio di controllo non arriva, si ricarica comunque. */
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
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    db = await apri();

    LINGUA = await leggiStato("lingua", linguaPredefinita());
    document.documentElement.lang = LINGUA;
    soglia = await leggiSoglia();

    orologi = await leggiTutti("orologi");
    registro = await leggiTutti("registro");
    await assicuraAggiunto();

    disegna();
    tingiBarra();
    registraAggiornamenti();

    /* Fuori dal percorso critico: se il service worker è lento o la
       funzione manca, l'app è già aperta e usabile. */
    notificheAttive()
      .then((attivo) => { notificheStato = attivo ? "attivo" : "inattivo"; disegnaFoglio(); })
      .catch(() => { notificheStato = "inattivo"; });

    /* Ogni minuto: l'ora del giorno, e a mezzanotte i conti dei giorni. */
    let giornoVisto = new Date().toDateString();
    setInterval(() => {
      const o = oraCorrente();
      if (document.documentElement.dataset.ora !== o) {
        document.documentElement.dataset.ora = o;
        tingiBarra();
        disegna();
      }
      const g = new Date().toDateString();
      if (g !== giornoVisto) { giornoVisto = g; ridisegnaTutto(); }
    }, 60000);
  } catch (e) {
    document.body.innerHTML =
      '<div style="padding:60px 26px;font-family:Georgia,serif;color:#EDEBF2;line-height:1.6">' +
      t("err.archivio") + "</div>";
  }
}

/* La cornice si carica prima delle schermate, che si registrano in
   COSTRUTTORI: l'avvio aspetta che tutti gli script siano stati letti. */
if (document.readyState === "loading") addEventListener("DOMContentLoaded", avvio);
else avvio();
