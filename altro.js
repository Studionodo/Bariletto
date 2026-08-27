/* ------------------------------------------------------------------
   Pagina due — Registro e attrezzi

   Il diario aveva tre righe in fondo a Oggi e un foglio a comparsa per
   il resto: due posti per la stessa cosa. Qui ha una pagina sua, dove
   può crescere quanto vuole senza spingere niente più in basso.
   ------------------------------------------------------------------ */

/* Stato locale della pagina: nessuno di questi valori è un dato, sono
   solo i due tocchi del ripristino e la riga di esito sotto ai comandi. */
let importoArmato = false;
let esitoDati = null;      /* { testo, storto } */
let notificheStato = null; /* null finché non risolto: "attivo" | "inattivo" | "non-supportato" | "rifiutato" | "errore" */

/* Un titolo di sezione con l'icona info accanto — usato da tutte e
   cinque le sezioni di questa pagina, stessa struttura ogni volta. */
function titoloConInfo(classe, testo, titoloInfo, testoInfo) {
  const riga = el("span", "riga-titolo-sezione" + (classe === "gruppo" ? " di-gruppo" : ""));
  riga.append(el("span", classe, testo), infoTocco(titoloInfo, testoInfo));
  return riga;
}

function costruisciAltro() {
  const d = el("div", "colonna testo");
  d.append(sezioneRegistro(), sezioneCollezione(), sezioneAttrezzi(), sezioneCarta(), sezioneDati(), sezioneNotifiche());
  d.append(fondoLingua());
  return d;
}


/* ------------------------------------------------------------------
   Il registro: una riga sola. Prima stava tutto qui — giornate, righe,
   il cestino a due tocchi — e la pagina era lunga quanto la storia
   dell'utente. Ora è un riepilogo che si apre, come l'archivio: la
   riga dice quanto c'è e quando, il foglio mostra tutto.
   ------------------------------------------------------------------ */
function sezioneRegistro() {
  const s = el("section", "sezione");
  s.append(titoloConInfo("titolo-contenuto", t("registro"), t("info.registro.titolo"), [t("info.registro.testo1"), t("info.registro.testo2")]));

  if (!registro.length) {
    s.append(el("p", "nota", t("reg.vuoto")));
    return s;
  }

  const tutte = [...registro].sort((a, b) => b.quando - a.quando);
  const ultima = tutte[0];
  const riga = el("button", "attrezzo");
  /* Prima erano due span appesi di seguito nello stesso rigo: su schermi
     stretti l'ultima parola ("oggi") finiva su una riga a sé, orfana,
     staccata dal resto della frase. Ora sono due righe vere e volute —
     stesso schema già usato per le voci del diario — non un a capo
     lasciato al caso del browser. */
  const corpo = el("div", "voce-corpo");
  corpo.append(el("span", null, t("reg.apri", { n: plurale(tutte.length, "voci", "vociPl") })));
  corpo.append(el("span", "etichetta mini", (ultima.nome || "\u2014") + " \u00B7 " + quando(ultima.quando).toLowerCase()));
  riga.append(corpo, el("span", "freccia", "\u203A"));
  riga.onclick = () => apriRegistro();
  s.append(riga);
  return s;
}


/* ------------------------------------------------------------------
   Gli attrezzi.
   ------------------------------------------------------------------ */
function voceAttrezzo(testo, azione, cls) {
  const b = el("button", "attrezzo" + (cls ? " " + cls : ""));
  b.append(el("span", null, testo), el("span", "freccia", "\u203A"));
  b.onclick = azione;
  return b;
}

function sezioneAttrezzi() {
  const s = el("section", "sezione");
  s.append(titoloConInfo("gruppo", t("reg.attrezzi"), t("info.archivio.titolo"), [t("info.archivio.testo1"), t("info.archivio.testo2")]));
  if (typeof ARCHIVIO !== "undefined" && ARCHIVIO.length) {
    s.append(voceAttrezzo(t("arch.apri", { n: ARCHIVIO.length }), () => apriArchivio()));
  }
  return s;
}

/* La collezione a colpo d'occhio: non è uno strumento, è un'altra vista
   sui dati come il registro — vive accanto a lui, non dentro Attrezzi. */
function sezioneCollezione() {
  const s = el("section", "sezione");
  s.append(titoloConInfo("titolo-contenuto", t("coll.titolo"), t("info.collezione.titolo"), [t("info.collezione.testo1"), t("info.collezione.testo2")]));
  if (!orologi.length) { s.append(el("p", "nota", t("vuoto.oggi"))); return s; }
  s.append(voceAttrezzo(t("coll.apri", { n: plurale(orologi.length, "orologio_", "orologiPl") }),
                        () => apriCollezione()));
  return s;
}

/* La carta: la finestra di stampa del browser è anche il posto da cui si
   salva un PDF. Non serve una libreria per generarlo: serve dirlo. */
function sezioneCarta() {
  const s = el("section", "sezione utility");
  s.append(titoloConInfo("gruppo", t("pdf.gruppo"), t("info.carta.titolo"), [t("info.carta.testo1"), t("info.carta.testo2")]));
  s.append(el("p", "nota", t("pdf.nota")));
  if (orologi.length) s.append(voceAttrezzo(t("stampa"), () => stampa("collezione")));
  if (registro.length) s.append(voceAttrezzo(t("stampa.reg"), () => stampa("registro")));
  if (!orologi.length && !registro.length) s.append(el("p", "nota", t("bak.vuoto")));
  return s;
}

/* I dati: esportare è un tocco, ripristinare ne vuole due — perché
   sostituisce tutto quello che c'è, e non si torna indietro. */
function sezioneDati() {
  const s = el("section", "sezione utility");
  s.append(titoloConInfo("gruppo", t("bak.gruppo"), t("info.dati.titolo"), [t("info.dati.testo1"), t("info.dati.testo2")]));
  s.append(el("p", "nota", t("bak.nota")));

  s.append(voceAttrezzo(t("bak.esporta"), () => {
    if (!orologi.length && !registro.length) {
      esitoDati = { testo: t("bak.vuoto"), storto: true };
      disegna();
      return;
    }
    esportaBackup();
    esitoDati = { testo: t("bak.fatto", {
      n: plurale(orologi.length, "orologio_", "orologiPl"),
      v: plurale(registro.length, "voci", "vociPl") }), storto: false };
    disegna();
  }));

  s.append(voceAttrezzo(
    importoArmato ? t("bak.conferma") : t("bak.importa"),
    () => {
      if (!importoArmato) {
        importoArmato = true;
        disegna();
        setTimeout(() => { if (importoArmato) { importoArmato = false; disegna(); } }, 5000);
        return;
      }
      importoArmato = false;
      scegliFileBackup();
    },
    importoArmato ? "armato" : null));

  if (esitoDati) {
    s.append(el("p", "esito" + (esitoDati.storto ? " storto" : ""), esitoDati.testo));
  }
  return s;
}

/* Il selettore di file vive fuori dal disegno: se stesse nella pagina,
   ogni ridisegno lo ricreerebbe e la scelta in corso si perderebbe. */
function scegliFileBackup() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json,.json";
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    try {
      const conto = await importaBackup(await f.text());
      esitoDati = { testo: t("bak.letto", {
        n: plurale(conto.orologi, "orologio_", "orologiPl"),
        v: plurale(conto.voci, "voci", "vociPl") }), storto: false };
    } catch {
      esitoDati = { testo: t("bak.errore"), storto: true };
    }
    disegna();
  };
  inp.click();
}

/* Notifiche: un interruttore solo, con tre esiti possibili invece di
   un semplice sì/no — "non disponibile" e "permesso negato" sono
   informazioni utili, non lo stesso silenzio di "spento". Lo stato
   vero (notificheStato) arriva da un controllo asincrono fatto
   all'avvio, dopo il primo disegno: non deve mai bloccare l'apertura
   dell'app se il service worker è lento o assente. */
function sezioneNotifiche() {
  const s = el("section", "sezione utility");
  s.append(titoloConInfo("gruppo", t("notif.gruppo"), t("info.notifiche.titolo"), [t("info.notifiche.testo1"), t("info.notifiche.testo2"), t("info.notifiche.testo3")]));
  s.append(el("p", "nota", t("notif.nota")));

  const etichetta = notificheStato === "attivo" ? t("notif.attivo")
                   : notificheStato && notificheStato !== "inattivo"
                   ? t("notif." + notificheStato)
                   : t("notif.attiva");

  const v = voceAttrezzo(etichetta, async () => {
    if (notificheStato === "attivo") {
      await disattivaNotifiche();
      notificheStato = "inattivo";
      disegna();
      return;
    }
    const esito = await attivaNotifiche();
    notificheStato = esito.ok ? "attivo" : esito.motivo;
    disegna();
  });
  if (notificheStato === "attivo") v.classList.add("acceso");
  s.append(v);
  return s;
}

function fondoLingua() {
  const involucro = el("div");
  const fondo = el("div", "fondo-lingua");
  fondo.append(el("span", "etichetta", t("lingua")));
  const gruppo = el("div", "interruttore-lingua");
  ["it", "en"].forEach((k) => {
    const b = el("button", LINGUA === k ? "acceso" : null, k.toUpperCase());
    b.setAttribute("aria-pressed", LINGUA === k);
    b.onclick = () => cambiaLingua(k);
    gruppo.append(b);
  });
  fondo.append(gruppo);
  involucro.append(fondo);

  const caffe = el("a", "quieta caffe");
  caffe.href = "https://ko-fi.com/istantelabs/tip";
  caffe.target = "_blank";
  caffe.rel = "noopener noreferrer";
  caffe.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M7 4c0 .8-1 1-1 2M11 4c0 .8-1 1-1 2"/></svg><span>' + t("caffe") + '</span>';
  involucro.append(caffe);
  involucro.append(colophon());
  return involucro;
}

/* Il colophon: tre righe discrete in fondo alla pagina, ispirate al
   piede di Macinino ma non copiate — quella frase parlava di imparare
   dal caffè, qui non c'è niente da imparare, solo un archivio da
   consultare. La sostituisco con qualcosa che dica cosa fa Bariletto
   invece di dire cosa non fa. Le altre due righe (privacy, copyright)
   sono vere qui esattamente come lì: nessun account, nessuna nuvola.
   Il link GitHub, aggiunto dopo, segue lo stesso posto che ha in Posa:
   in coda alla riga dei diritti, non una riga sua propria — è una nota
   in più su una riga già lì, non un nuovo comando che chiede attenzione. */
function colophon() {
  const c = el("div", "colophon");
  c.append(el("p", null, t("col.riga2")));
  const diritti = el("p", "colophon-diritti");
  diritti.append(document.createTextNode(t("col.riga3") + " · "));
  const gh = el("a", null, "GitHub");
  gh.href = "https://github.com/Studionodo";
  gh.target = "_blank"; gh.rel = "noopener noreferrer";
  diritti.append(gh);
  c.append(diritti);
  return c;
}


/* ------------------------------------------------------------------
   La carta.
   Non è la schermata in bianco e nero: è il documento che la schermata
   non può essere. Solo i dati che fra un anno saranno ancora veri.
   ------------------------------------------------------------------ */
function stampa(quale) {
  costruisciStampa(quale);
  window.print();
}

function testataStampa(sotto) {
  const capo = el("header", "st-capo");
  capo.append(el("h1", "st-nome", NOME_APP), el("p", "st-frase", t("frase")));
  const meta = el("p", "st-meta");
  meta.textContent = sotto + " \u00B7 " + t("st.stampato", {
    d: new Date().toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" }) });
  capo.append(meta);
  return capo;
}

function costruisciStampa(quale) {
  const vecchio = q("#stampa");
  if (vecchio) vecchio.remove();
  const s = el("article"); s.id = "stampa";
  (quale === "registro" ? stampaRegistro : stampaCollezione)(s);
  document.body.append(s);
}

/* Il foglio del cassetto: niente stati e niente date d'uso — la carta
   non si aggiorna, e un dato che invecchia su carta diventa una bugia. */
function stampaCollezione(s) {
  s.append(testataStampa(t("st.orologi", { n: orologi.length })));

  ordinaPerBisogno(orologi).forEach(({ o }) => {
    const b = el("section", "st-orologio");
    b.append(el("h2", null, o.nome));
    if (o.linea) b.append(el("p", "st-linea", o.linea));

    const dl = el("dl", "st-dati");
    const riga = (k, v) => { dl.append(el("dt", null, k), el("dd", null, v)); };
    riga(t("st.dati"), nomeCorto(o.calibroNome));
    riga(t("st.riserva"), etichettaRiserva(o, true));
    if (o.ah) riga(t("ah"), o.ah.toLocaleString(locale()));
    b.append(dl);

    const ol = el("ol", "st-gesti");
    gesti(o).forEach((g) => ol.append(el("li", null, g)));
    b.append(el("h3", null, t("st.gesti")), ol);
    s.append(b);
  });
}

/* Il registro su carta: l'opposto, tutto date e tutto completo. Non è un
   backup — da un foglio non si ripristina niente, si ribatte a mano.
   Il backup vero è il file JSON negli attrezzi. */
function stampaRegistro(s) {
  const voci = [...registro].sort((a, b) => b.quando - a.quando);
  const data = (ms) => new Date(ms).toLocaleDateString(locale(),
    { day: "numeric", month: "short", year: "numeric" });
  const sotto = voci.length > 1
    ? plurale(voci.length, "voci", "vociPl") + " \u00B7 " +
      t("st.periodo", { da: data(voci[voci.length - 1].quando), a: data(voci[0].quando) })
    : t("st.solo");
  s.append(testataStampa(sotto));

  const tab = el("table", "st-registro");
  const intestazione = el("tr");
  [t("st.quando"), t("st.chi"), t("st.azione")].forEach((x) => intestazione.append(el("th", null, x)));
  const testa = el("thead"); testa.append(intestazione);
  const corpo = el("tbody");
  voci.forEach((v) => {
    const o = orologi.find((x) => x.id === v.orologio);
    const r = el("tr");
    r.append(el("td", "st-quando", data(v.quando)),
             el("td", null, (o && o.nome) || v.nome || "\u2014"),
             el("td", "st-cosa", t(v.azione)));
    corpo.append(r);
  });
  tab.append(testa, corpo);
  s.append(tab);
}

/* Dal menu di stampa del browser esce la collezione, che è il documento
   da tenere. Il diario si stampa dal suo comando negli attrezzi. */
addEventListener("beforeprint", () => {
  if (q("#stampa")) return;
  if (orologi.length) costruisciStampa("collezione");
});
addEventListener("afterprint", () => { const s = q("#stampa"); if (s) s.remove(); });
