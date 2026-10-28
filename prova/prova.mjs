/* Banco di prova: l'app in un Chromium vero, non in un DOM finto.
   Semina un database come lo lascia la v150 (orologi senza «aggiunto»),
   apre l'app e controlla la migrazione, i gesti, la storia, il
   cronocomparatore con un battito sintetico passato come microfono
   finto, le impostazioni, il service worker e la regola delle notifiche.

   Serve Playwright con Chromium:   npm install playwright && npx playwright install chromium
   Poi, da questa cartella:          node prova.mjs
   Esce con codice 1 se qualcosa non torna. */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const { chromium } = createRequire(import.meta.url)("playwright");
const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, "..");
const PORTA = 8799;
const TIPI = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
               ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split("?")[0]);
  if (f === "/") f = "/index.html";
  const p = f === "/seme.html" ? path.join(QUI, "seme.html") : path.join(RADICE, f);
  if (!p.startsWith(RADICE) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { "Content-Type": TIPI[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(r);
}).listen(PORTA);

/* Un battito sintetico: 28.800 alternanze, +12 s/giorno, 0,4 ms di battuta. */
function battito(file) {
  const sr = 48000, dur = 30, T = 3600 / 28800 / (1 + 12 / 86400);
  const x = new Float32Array(sr * dur);
  let seme = 7; const caso = () => ((seme = (seme * 16807) % 2147483647) / 2147483647 - .5) * .004;
  for (let i = 0; i < x.length; i++) x[i] = caso();
  for (let t = .05, k = 0; t < dur - .01; t += T, k++) {
    const i0 = Math.floor((t + (k % 2 ? .0004 : 0)) * sr), n = Math.floor(.004 * sr);
    for (let j = 0; j < n; j++) x[i0 + j] += .5 * Math.exp(-j / (.0006 * sr)) * Math.sin(2 * Math.PI * 4200 * j / sr);
  }
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36);
  b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
const wav = path.join(os.tmpdir(), "bariletto-battito.wav");
battito(wav);

const problemi = [];
const ok = (cond, cosa, dato = "") => { if (cond) console.log("  ok  " + cosa.padEnd(52) + dato); else problemi.push(cosa + (dato ? "  (" + dato + ")" : "")); };

const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
  "--use-file-for-fake-audio-capture=" + wav + "%noloop"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
const p = await ctx.newPage();
const errori = [];
p.on("pageerror", (e) => errori.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errori.push(m.text()); });
const U = "http://localhost:" + PORTA + "/";
const attendi = (ms) => p.waitForTimeout(ms);
const o = (nome, fn) => p.evaluate(([n, f]) => new Function("o", "return (" + f + ")(o)")(orologi.find((x) => x.nome === n)), [nome, fn.toString()]);

try {
  await p.goto(U + "seme.html"); await p.waitForFunction(() => document.title === "seminato");
  await p.goto(U + "index.html"); await p.waitForSelector(".pila .carta"); await attendi(500);

  ok(await p.evaluate(() => orologi.every((x) => x.aggiunto != null)), "migrazione: ogni orologio ha «aggiunto»");
  const davanti = () => p.textContent(".carta.davanti .carta-piena .carta-nome");
  ok(await davanti() === "Seiko SKX007", "davanti il più a riposo", await davanti());
  ok((await p.$$(".pila .carta")).length === 4, "una carta per orologio nella pila");

  await p.click(".carta.davanti"); await attendi(500);
  await p.click(".foglio .bottone.primario"); await attendi(400);
  ok(await o("Seiko SKX007", (x) => alPolsoOggi(x)), "Indossato segna oggi");
  await p.click(".foglio .bottone.secondario.largo"); await attendi(400);
  ok(await o("Seiko SKX007", (x) => giorniSenzaPolso(x)) === 41, "Annulla torna a 41 giorni");
  await p.click("text=Indossato un altro giorno"); await attendi(150);
  const dueGiorniFa = await p.evaluate(() => dataInput(Date.now() - 2 * 86400000));
  await p.fill(".altro-giorno input", dueGiorniFa);
  await p.click(".altro-giorno .bottone"); await attendi(400);
  ok(await o("Seiko SKX007", (x) => giorniSenzaPolso(x)) === 2, "un giorno passato si segna");
  await p.click(".storia .togli >> nth=0"); await attendi(120);
  await p.click(".storia .togli.armato"); await attendi(400);
  ok(await o("Seiko SKX007", (x) => giorniSenzaPolso(x)) === 41, "togliendo la voce le date si rifanno");

  await p.evaluate(() => { const c = document.querySelector(".foglio-corpo"); c.scrollTop = c.scrollHeight; });
  await p.click(".marcia .bottone"); await attendi(400);
  await p.click(".scelta:has-text('28.800')"); await p.click(".scelta:has-text('20 ')");
  await p.click("#mis-via");
  await p.waitForSelector(".esito-misura", { timeout: 40000 });
  const r = await p.evaluate(() => window.__crono.ultimo);
  ok(r.ok && Math.abs(r.marcia - 12) < 1, "cronocomparatore: +12 s/giorno", r.ok ? r.marcia.toFixed(2) : r.motivo);
  await p.click(".esito-misura .bottone.primario"); await attendi(300);
  ok(await p.evaluate(() => registro.some((v) => v.azione === "misura")), "la misura entra nella storia");
  await p.keyboard.press("Escape"); await attendi(200); await p.keyboard.press("Escape"); await attendi(500);

  await p.click(".riassunto"); await attendi(400);
  await p.click(".foglio-capo .chip"); await attendi(400);
  await p.fill(".foglio input[type=search]", "4r36"); await attendi(200);
  await p.click(".esiti .riga-calibro >> nth=0"); await attendi(200);
  await p.fill(".campo-blocco input >> nth=0", "Seiko Presage");
  await p.click("#salva"); await attendi(500);
  ok(await p.evaluate(() => orologi.some((x) => x.nome === "Seiko Presage" && x.calibro === "4R36" && x.aggiunto)), "nuovo orologio dal calibro");
  await p.keyboard.press("Escape"); await attendi(300); await p.keyboard.press("Escape"); await attendi(500);
  ok(await davanti() === "Seiko Presage", "l'orologio appena aggiunto arriva al centro", await davanti());

  await p.click(".testata .tondo"); await attendi(400);
  await p.click(".scelta:has-text('14')"); await attendi(200);
  ok(await p.evaluate(() => soglia) === 14, "la soglia si cambia");
  await p.click(".scelta:has-text('30')"); await attendi(200);
  await p.keyboard.press("Escape"); await attendi(500);

  const sw = await p.evaluate(async () => { await navigator.serviceWorker.ready; await new Promise((r) => setTimeout(r, 1200));
    const k = await caches.keys(); return (await (await caches.open(k[0])).keys()).length; });
  const guscio = (fs.readFileSync(path.join(RADICE, "sw.js"), "utf8").match(/const GUSCIO = \[([\s\S]*?)\]/)[1].match(/"/g).length) / 2;
  ok(sw >= guscio, "il service worker mette in cache tutto il guscio", sw + "/" + guscio);

  const n = await p.evaluate(async () => {
    const testo = await (await fetch("./sw.js")).text();
    const corpo = testo.slice(testo.indexOf("async function controllaRiposi"));
    const uscite = [];
    const registration = { showNotification: async (_, x) => uscite.push(x.body) };
    const fn = new Function("registration", "return (" + corpo.replace(/self\.registration/g, "registration") + ")")(registration);
    await fn(); const primo = uscite.length; await fn();
    db = await apri();
    return [primo, uscite.length, uscite[0]];
  });
  ok(n[0] === 1 && n[1] === 1, "una notifica sola per periodo di riposo", n[2]);

  /* La pila con più orologi, e l'elenco nel foglio. */
  await p.evaluate(async () => {
    const G = 86400000, ora = Date.now();
    const base = orologi.find((x) => x.nome === "Seiko SKX007");
    const giorni = { "Seiko SKX007": 41, "Omega Speedmaster Professional": 75, "Orient Bambino": 33 };
    for (const x of orologi) if (giorni[x.nome]) { x.ultimoPolso = ora - giorni[x.nome] * G; x.ultimaCarica = null; await salva("orologi", x); }
    const nuovi = [["Tudor Black Bay", 120], ["Longines Spirit", 64], ["Hamilton Khaki", 52], ["Sinn 556", 90]];
    for (const [nome, g] of nuovi) await salva("orologi", { ...base, id: "prova-" + g, nome, ultimoPolso: ora - g * G, aggiunto: ora - 200 * G });
    orologi = await leggiTutti("orologi");
    pilaIndice = 0; disegna();
  });
  await attendi(400);
  const stato = () => p.evaluate(() => ({
    nomi: [...document.querySelectorAll(".pila .carta")].map((c) => c.querySelector(".carta-piena .carta-nome").textContent),
    centro: pilaIndice,
    davanti: document.querySelector(".carta.davanti .carta-piena .carta-nome").textContent,
    acceso: [...document.querySelectorAll(".pila-dove .punto")].findIndex((x) => x.classList.contains("acceso")),
    nascoste: [...document.querySelectorAll(".pila .carta")].filter((c) => c.style.visibility === "hidden").length,
  }));
  let m = await stato();
  ok(m.nomi.slice(0, 4).join() === "Tudor Black Bay,Sinn 556,Omega Speedmaster Professional,Longines Spirit",
     "pila: dal più dimenticato", m.nomi.slice(0, 4).join(", "));
  ok(m.nascoste >= 4, "le carte lontane non si disegnano", m.nascoste + " di " + m.nomi.length);
  const giorniVisti = await p.$$eval(".pila .sintesi-numero", (n) => n.map((x) => +x.textContent));
  ok(giorniVisti.every((v, i) => !i || v <= giorniVisti[i - 1]), "l'ordine segue il numero mostrato", giorniVisti.join(" "));

  const box = await p.$eval(".pila", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.wheel(112, 0); await attendi(900);
  m = await stato();
  ok(m.centro === 1 && m.davanti === "Sinn 556" && m.acceso === 1, "scorrendo, centro, punti e bottoni seguono", m.davanti + " / punto " + m.acceso);

  await p.click(".fila-azioni .bottone.primario"); await attendi(700);
  ok(await o("Sinn 556", (x) => alPolsoOggi(x)), "Indossato vale per la carta al centro");
  m = await stato();
  ok(m.centro === 1 && m.davanti === "Omega Speedmaster Professional" && m.nomi[m.nomi.length - 1] === "Sinn 556",
     "dopo il gesto arriva il prossimo, l'indossato va in fondo", m.davanti);

  const lato = await p.$eval(".pila .carta:not(.davanti)", (c) => c.closest(".pila").querySelectorAll(".carta").length);
  /* Il bordo destro dello schermo: lì c'è solo la carta di lato. */
  await p.mouse.click(380, box.y); await attendi(900);
  m = await stato();
  ok(m.centro === 2 && m.davanti === "Longines Spirit", "toccando una carta di lato, viene al centro", m.davanti + " (" + lato + ")");
  await p.click(".carta.davanti"); await attendi(400);
  ok(await p.textContent(".foglio .foglio-titolo") !== null && (await p.$(".foglio .storia")) !== null, "toccando quella al centro, si apre la scheda");
  await p.keyboard.press("Escape"); await attendi(500);

  await p.focus(".pila"); await p.keyboard.press("ArrowRight"); await attendi(900);
  ok((await stato()).centro === 3, "la pila si muove con le frecce");
  await p.evaluate(() => disegna()); await attendi(200);
  ok((await stato()).centro === 3, "un ridisegno non rimanda alla prima carta");
  await p.screenshot({ path: path.join(os.tmpdir(), "bariletto-pila.png") });

  const riassunto = await p.textContent(".riassunto");
  ok(/6 da far girare/.test(riassunto) && /9 orologi/.test(riassunto), "il riassunto conta", riassunto.trim());
  await p.click(".riassunto"); await attendi(500);
  const righe = await p.$$eval(".foglio .elenco .riga-orologio", (r) => r.map((x) => x.querySelector(".riga-nome").textContent));
  ok(righe.length === 9 && righe.join() === [...righe].sort((a, b) => a.localeCompare(b, "it")).join(), "l'elenco: tutti, in ordine alfabetico", righe.length + " righe");
  await p.fill(".foglio input[type=search]", "sinn"); await attendi(150);
  const visibili = await p.$$eval(".foglio .elenco .riga-orologio", (r) => r.filter((x) => !x.hidden).length);
  ok(visibili === 1 && await p.isHidden(".foglio .nota:has-text('Nessun')"), "la ricerca filtra", visibili + " visibili");
  await p.fill(".foglio input[type=search]", "6r35"); await attendi(150);
  ok(await p.$$eval(".foglio .elenco .riga-orologio", (r) => r.filter((x) => !x.hidden).length) >= 1, "si cerca anche per calibro");
  await p.fill(".foglio input[type=search]", "zzzz"); await attendi(150);
  ok(await p.isVisible(".foglio .nota:has-text('Nessun')"), "nessun esito: lo dice");
  await p.screenshot({ path: path.join(os.tmpdir(), "bariletto-elenco.png") });
  await p.keyboard.press("Escape"); await attendi(500);

  const testo = await p.evaluate(() => document.body.innerText);
  const crude = [...testo.matchAll(/\b(?:bak|arch|reg|st|coll|sch|mis|eroe|pila|el|imp|notif|soglia|ora|r|c|g|s|m)\.[a-zA-Z]+\b/g)].map((x) => x[0]);
  ok(!crude.length, "nessuna chiave di dizionario a schermo", [...new Set(crude)].join(", "));
  ok(!errori.length, "nessun errore in console", errori.join(" | "));
} catch (e) {
  problemi.push("la prova si è interrotta: " + e.message.split("\n")[0]);
}
await b.close();
server.close();
console.log();
if (problemi.length) { problemi.forEach((x) => console.log("  PROBLEMA  " + x)); process.exit(1); }
console.log("  L'app si apre, conta e misura senza errori.");
