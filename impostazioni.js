/* ------------------------------------------------------------------
   Impostazioni, archivio dei movimenti, dati, carta.
   Tutto quello che non serve ogni giorno, raccolto dietro l'icona in
   testata: la pagina resta la collezione e basta.
   ------------------------------------------------------------------ */

let notificheStato = null;  /* null finché non risolto: "attivo" | "inattivo" | "non-supportato" | "rifiutato" | "errore" */
let importoArmato = false;
let esitoDati = null;       /* { testo, storto } */

function rigaComando(testo, azione, nota, cls) {
  const b = el("button", "riga-comando" + (cls ? " " + cls : ""));
  const corpo = el("div", "riga-corpo");
  corpo.append(el("span", "riga-nome piccolo", testo));
  if (nota) corpo.append(el("span", "riga-sotto", nota));
  b.append(corpo);
  b.insertAdjacentHTML("beforeend", icona("avanti", 16));
  b.onclick = azione;
  return b;
}

COSTRUTTORI.impostazioni = {
  classe: "alto",
  disegna(d, f) {
    const corpo = capoFoglio(f, t("imp.titolo"));

    /* Il promemoria: dopo quanti giorni un orologio va fatto girare. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("imp.promemoria")));
    const fila = el("div", "scelte segmenti");
    SOGLIE.forEach((n) => {
      const b = el("button", "scelta" + (n === soglia ? " accesa" : ""), t("soglia." + n));
      b.setAttribute("aria-pressed", String(n === soglia));
      b.onclick = () => cambiaSoglia(n);
      fila.append(b);
    });
    corpo.append(fila);
    corpo.append(el("p", "nota", t("imp.sogliaNota")));
    corpo.append(el("p", "nota", t("imp.fermiNota")));

    /* Le notifiche ad app chiusa. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("notif.gruppo")));
    const etichetta = notificheStato === "attivo" ? t("notif.attivo")
      : notificheStato && notificheStato !== "inattivo" ? t("notif." + notificheStato)
      : t("notif.attiva");
    const n = el("button", "interruttore" + (notificheStato === "attivo" ? " acceso" : ""));
    n.setAttribute("role", "switch");
    n.setAttribute("aria-checked", String(notificheStato === "attivo"));
    n.append(el("span", null, etichetta), el("span", "pallina"));
    n.onclick = async () => {
      if (notificheStato === "attivo") { await disattivaNotifiche(); notificheStato = "inattivo"; }
      else { const e = await attivaNotifiche(); notificheStato = e.ok ? "attivo" : e.motivo; }
      disegnaFoglio();
    };
    corpo.append(n);
    corpo.append(el("p", "nota", t("notif.nota")));
    corpo.append(el("p", "nota", t("info.notifiche.testo3")));

    /* L'aspetto: la regola dei colori, scritta. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("aspetto.titolo")));
    corpo.append(el("p", "nota", t("aspetto.testo")));
    corpo.append(elencoFasce());

    /* L'archivio dei movimenti, per chi vuole leggere oltre i propri. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("arch.titolo")));
    corpo.append(rigaComando(t("arch.apri", { n: ARCHIVIO.length }), () => avantiFoglio("archivio", {}), t("info.archivio.testo2")));

    /* I dati: esportare è un tocco, ripristinare ne vuole due. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("bak.gruppo")));
    corpo.append(el("p", "nota", t("bak.nota")));
    corpo.append(rigaComando(t("bak.esporta"), () => {
      if (!orologi.length && !registro.length) { esitoDati = { testo: t("bak.vuoto"), storto: true }; disegnaFoglio(); return; }
      esportaBackup();
      esitoDati = { testo: t("bak.fatto", { n: plurale(orologi.length, "orologio_", "orologiPl"),
                                            v: plurale(registro.length, "voci", "vociPl") }), storto: false };
      disegnaFoglio();
    }));
    corpo.append(rigaComando(importoArmato ? t("bak.conferma") : t("bak.importa"), () => {
      if (!importoArmato) {
        importoArmato = true; disegnaFoglio();
        setTimeout(() => { if (importoArmato) { importoArmato = false; disegnaFoglio(); } }, 5000);
        return;
      }
      importoArmato = false;
      scegliFileBackup();
    }, null, importoArmato ? "armato" : null));
    if (esitoDati) corpo.append(el("p", "esito" + (esitoDati.storto ? " storto" : ""), esitoDati.testo));

    /* Su carta: la finestra di stampa è anche il posto da cui si salva
       un PDF. */
    if (orologi.length || registro.length) {
      corpo.append(el("h2", "etichetta sezione-titolo", t("pdf.gruppo")));
      corpo.append(el("p", "nota", t("pdf.nota")));
      if (orologi.length) corpo.append(rigaComando(t("stampa"), () => stampa("collezione")));
      if (registro.length) corpo.append(rigaComando(t("stampa.reg"), () => stampa("registro")));
    }

    /* La lingua. */
    corpo.append(el("h2", "etichetta sezione-titolo", t("lingua")));
    const lingue = el("div", "scelte segmenti");
    ["it", "en"].forEach((k) => {
      const b = el("button", "scelta" + (LINGUA === k ? " accesa" : ""), k === "it" ? "Italiano" : "English");
      b.setAttribute("aria-pressed", String(LINGUA === k));
      b.onclick = () => cambiaLingua(k);
      lingue.append(b);
    });
    corpo.append(lingue);

    /* La firma: mai in arancio, non è un'azione dell'app. */
    const caffe = el("a", "caffe");
    caffe.href = "https://ko-fi.com/istantelabs/tip";
    caffe.target = "_blank"; caffe.rel = "noopener noreferrer";
    caffe.innerHTML = icona("caffe", 18) + "<span></span>";
    caffe.querySelector("span").textContent = t("caffe");
    corpo.append(caffe);
    const col = el("div", "colophon");
    col.append(el("p", null, t("col.riga2")), el("p", null, t("col.riga3")));
    corpo.append(col);
  },
};

/* Il selettore di file vive fuori dal disegno: se stesse nel foglio,
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
      await assicuraAggiunto();
      esitoDati = { testo: t("bak.letto", { n: plurale(conto.orologi, "orologio_", "orologiPl"),
                                            v: plurale(conto.voci, "voci", "vociPl") }), storto: false };
    } catch {
      esitoDati = { testo: t("bak.errore"), storto: true };
    }
    ridisegnaTutto();
  };
  inp.click();
}

/* Il cambio di lingua scrive nello stato e ridisegna tutto, foglio
   aperto compreso. */
async function cambiaLingua(k) {
  if (k === LINGUA) return;
  LINGUA = k;
  document.documentElement.lang = k;
  await scriviStato("lingua", k);
  ridisegnaTutto();
}


/* ======================= l'archivio, sfogliato ===================== */

COSTRUTTORI.archivio = {
  classe: "alto",
  disegna(d, f) {
    const corpo = capoFoglio(f, t("arch.titolo"));
    corpo.append(el("p", "nota", t("info.archivio.testo2")));
    const cerca = el("input", "campo");
    cerca.type = "search"; cerca.placeholder = t("arch.cerca");
    cerca.value = d.filtro || "";
    corpo.append(cerca);
    const box = el("div", "esiti");
    corpo.append(box);
    function riempi() {
      d.filtro = cerca.value;
      box.innerHTML = "";
      const q0 = (d.filtro || "").trim().toLowerCase();
      const filtrate = ARCHIVIO.filter((v) => !q0 || v.nome.toLowerCase().includes(q0)
        || v.marca.toLowerCase().includes(q0) || v.paese.toLowerCase().includes(q0)
        || v.paese_en.toLowerCase().includes(q0));
      if (!filtrate.length) { box.append(el("p", "nota", t("arch.nulla"))); return; }
      let paese = null;
      filtrate.sort((a, b) => fogliaPaese(a).localeCompare(fogliaPaese(b)) || a.nome.localeCompare(b.nome))
        .forEach((v) => {
          const pv = fogliaPaese(v);
          if (pv !== paese) { paese = pv; box.append(el("h3", "etichetta piccola gruppo-paese", pv)); }
          box.append(rigaCalibro({ nome: v.nome, sotto: v.marca }, () => avantiFoglio("voce", { id: v.id })));
        });
    }
    cerca.oninput = riempi;
    riempi();
  },
};


/* ============================ la carta ============================
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
  meta.textContent = sotto + " · " + t("st.stampato", {
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

/* Il foglio del cassetto: niente stati e niente date d'uso, perché la
   carta non si aggiorna. */
function stampaCollezione(s) {
  s.append(testataStampa(t("st.orologi", { n: orologi.length })));
  [...orologi].sort((a, b) => a.nome.localeCompare(b.nome)).forEach((o) => {
    const b = el("section", "st-orologio");
    b.append(el("h2", null, o.nome));
    if (o.linea) b.append(el("p", "st-linea", o.linea));
    const dl = el("dl", "st-dati");
    const riga = (k, v) => dl.append(el("dt", null, k), el("dd", null, v));
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

/* Il registro su carta: l'opposto, tutto date e tutto completo. */
function stampaRegistro(s) {
  const voci = [...registro].sort((a, b) => b.quando - a.quando);
  const data = (ms) => new Date(ms).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
  const sotto = voci.length > 1
    ? plurale(voci.length, "voci", "vociPl") + " · " +
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
    let cosa = t(v.azione);
    if (v.azione === "misura" && v.misura) cosa += " · " + segnoMarcia(v.misura.marcia) + " " + t("mis.sg");
    r.append(el("td", "st-quando", data(v.quando)),
             el("td", null, (o && o.nome) || v.nome || "·"),
             el("td", "st-cosa", cosa));
    corpo.append(r);
  });
  tab.append(testa, corpo);
  s.append(tab);
}

addEventListener("beforeprint", () => { if (!q("#stampa") && orologi.length) costruisciStampa("collezione"); });
addEventListener("afterprint", () => { const s = q("#stampa"); if (s) s.remove(); });
