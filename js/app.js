/* ============================================================
   NINNA · app.js v3 (UI vanilla + i18n IT/EN)
   Il motore parla per codici; l'i18n traduce; la UI compone.
   ============================================================ */
import { forecast, dailyStats, profileFor, ageWeeks } from "./engine.js";
import { SoundEngine, SOUNDS } from "./sounds.js";
import { I18N } from "./i18n.js";
import { loadStore, saveStore, exportCSV, exportJSON, importJSON } from "./content-store.js";

const TYPE_ICONS = {
  nap: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M6.5 17.2h10.2a3 3 0 0 0 .3-6 4.6 4.6 0 0 0-8.7-1.5A3.4 3.4 0 0 0 6.5 17.2z\"/></svg>",
  night: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M17.2 13.8A7 7 0 1 1 10.2 3.3a5.6 5.6 0 0 0 7 10.5z\"/></svg>",
  breast: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M12 20s-7.2-4.4-9.4-8.8A5 5 0 0 1 12 6.3a5 5 0 0 1 9.4 4.9C19.2 15.6 12 20 12 20z\"/></svg>",
  bottle: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M10.2 3.5h3.6M10.7 3.5v2c0 .6-.4 1-.9 1.3-.9.5-1.5 1.4-1.5 2.4V19a1.3 1.3 0 0 0 1.3 1.3h5a1.3 1.3 0 0 0 1.3-1.3V9.2c0-1-.6-1.9-1.5-2.4-.5-.3-.9-.7-.9-1.3v-2M8.4 13.5h7.2M8.4 16.5h7.2\"/></svg>",
  solid: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><ellipse cx=\"12\" cy=\"10.5\" rx=\"7.3\" ry=\"1.7\"/><path d=\"M4.7 10.5c0 4 2.9 7.2 7.3 7.2s7.3-3.2 7.3-7.2\"/><path d=\"M8.4 10.3h7.2\"/><path d=\"M16.3 6.8 18.7 4.4M17.5 5.6a1.15 1.15 0 1 0 1.6-1.6\"/></svg>",
  diaper: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><circle cx=\"7\" cy=\"16\" r=\"2.1\"/><path d=\"M8.6 14.4 15.5 7.5a2.3 2.3 0 0 1 3.2 3.2l-2.2 2.2\"/><path d=\"M17.8 11.8a1.9 1.9 0 1 1-2.7-2.7\"/></svg>",
  nightwake: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M2.5 12S6 6.3 12 6.3 21.5 12 21.5 12 18 17.7 12 17.7 2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"2.1\"/></svg>",
  pump: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M10.3 3.8h3.4M9 3.8v3.6c0 .5-.2.9-.5 1.3-1 1.1-1.5 3-1.5 4.9 0 3.5 2 6.6 5 6.6s5-3.1 5-6.6c0-1.9-.5-3.8-1.5-4.9-.3-.4-.5-.8-.5-1.3V3.8\"/><path d=\"M7.6 13.2h8.8\"/></svg>",
  vitamins: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><path d=\"M12 3.2c3.2 4.6 6.2 8.6 6.2 12A6.2 6.2 0 1 1 5.8 15.2c0-3.4 3-7.4 6.2-12z\"/></svg>",
  med: "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico\"><rect x=\"3.2\" y=\"9.3\" width=\"17.6\" height=\"5.4\" rx=\"2.7\" transform=\"rotate(-40 12 12)\"/><path d=\"M9.8 8.6 14.2 15.4\" transform=\"rotate(-40 12 12)\"/></svg>"
};
const EDIT_ICON = "<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"ico ico-edit\"><path d=\"M4 20l.9-3.6L15.5 6a1.7 1.7 0 0 1 2.4 0l.1.1a1.7 1.7 0 0 1 0 2.4L7.6 19.1 4 20z\"/><path d=\"M13.8 7.7l2.5 2.5\"/></svg>";
const INSTANT = ["breast", "bottle", "solid", "diaper", "nightwake", "pump"];
const HEALTH = ["vitamins", "med"];

/* ---------- promemoria di dosi: farmaci/integratori con ripetizione ----------
   Aggancio al NOME, non all'evento: se registri di nuovo lo stesso farmaco,
   e' quella voce piu' recente a valere, non quella con cui avevi impostato
   la ripetizione la prima volta. Nessun server, nessuna sveglia garantita a
   telefono chiuso: solo un calcolo mostrato ogni volta che apri l'app, piu'
   una notifica se capita di averla aperta all'ora giusta. */
function doseReminders() {
  // il nome piu' recente vince SEMPRE, anche se quell'ultima registrazione
  // non ha ripetizione: e' cosi' che "interrompi" deve poter cancellare un
  // promemoria, invece di lasciare riemergere una versione piu' vecchia
  const byName = new Map();
  for (const e of store.events) {
    if (!HEALTH.includes(e.type) || !e.note) continue;
    const prev = byName.get(e.note);
    if (!prev || e.at > prev.at) byName.set(e.note, e);
  }
  return [...byName.entries()]
    .filter(([, e]) => e.repeatH)
    .map(([name, e]) => ({ name, type: e.type, repeatH: e.repeatH, lastAt: e.at, due: e.at + e.repeatH * 3600000 }))
    .sort((a, b) => a.due - b.due);
}
const KOFI = "https://ko-fi.com/istantelabs/tip";
const GITHUB = "https://github.com/Studionodo";
const STOP_ICON = '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>';
const VOL_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>';
const APP_VERSION = "2.12.0";
const CUP = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4.5 9h11v5.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4V9z"/><path d="M15.5 10h1.6a2.4 2.4 0 0 1 0 4.8h-1.6"/><path d="M8 4.5c0 .9.9 1.1.9 2M11.5 4c0 .9.9 1.1.9 2"/></svg>`;

/* ---------- stato ---------- */
let store = loadStore();
let lang = store.prefs.lang === "en" ? "en" : "it";
let logOnly = store.prefs.logOnly === true;
let showAbout = false;
let miniCollapsed = false;
let showReport = false;
let showGrowth = false, showGrowthForm = false;
let profileFrom = "settings";
let ackedDoses = {};  // { nome: orario_dovuto_gia_visto } — un nuovo orario dovuto (nuova dose registrata) fa ripartire da capo il lampeggio
let nightMode = false;
let nightSoundListOpen = false;
let nightLastSound = null;
let theme = store.prefs.theme || "auto";
let view = "oggi";
let showWhy = false, showManual = false, showHealth = false, showPressureInfo = false;
let sound = new SoundEngine();
let timerMin = 0;
let notifTimeouts = [];

const $app = document.getElementById("app");
const $tabbar = document.getElementById("tabbar");
const $toast = document.getElementById("toast");
const $modal = document.getElementById("modal-root");
const $mini = document.getElementById("miniplayer-root");

/* ---------- i18n ---------- */
const t = (k, params) => {
  let s = (I18N[lang].ui[k] ?? k);
  if (params) for (const [key, v] of Object.entries(params)) s = s.replaceAll(`{${key}}`, v);
  return s;
};
const LOCALE = () => (lang === "it" ? "it-IT" : "en-US");
const typeLabel = (type) => t("type_" + type);

/* ---------- utilita' ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtHM = (ts) => new Date(ts).toLocaleTimeString(LOCALE(), { hour: "2-digit", minute: "2-digit" });
// Math.max(0, ...): un orologio che si sposta o un evento datato di poco nel
// futuro producevano durate negative a schermo ("sveglio da -7 min").
const fmtDur = (ms) => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h > 0 ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m} min`; };
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const localTodayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function persist() { saveStore(store); }
function toast(msg) {
  $toast.textContent = msg; $toast.hidden = false;
  // in modalita' notte la pillola menta accesa e' fuori luogo: stessa
  // sobrieta' del resto di quella schermata, che esiste per non fare luce
  $toast.classList.toggle("night", nightMode);
  clearTimeout(toast._t); toast._t = setTimeout(() => ($toast.hidden = true), 2200);
}

/* ---------- composizione testi dal motore (codici -> lingua) ---------- */
const reasonText = (next) => t("r_" + { routine:"routine", max_naps:"max", window_into_night:"window", first_nap:"first", nap_n:"napn", night_hours:"nighth" }[next.code], next.params);
const notifText = (id, babyName, extra) =>
  id === "pre-nap"
    ? { title: t("n_nap_t", { name: babyName }), body: t("n_nap_b") }
    : id === "pre-bed"
    ? { title: t("n_bed_t"), body: t("n_bed_b") }
    : { title: t("n_dose_t", { name: extra }), body: t("n_dose_b") };

/* ---------- notifiche (client-side, approccio Bariletto) ---------- */
const hasNotif = () => "Notification" in window;
async function askNotifPermission() {
  if (!hasNotif()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
async function showNotif(title, body) {
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) reg.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "ninna" });
    else if (hasNotif()) new Notification(title, { body, icon: "icons/icon-192.png" });
  } catch (e) { console.warn("notifica fallita", e); }
}
function scheduleNotifications(plan) {
  notifTimeouts.forEach(clearTimeout); notifTimeouts = [];
  if (!hasNotif() || Notification.permission !== "granted") return;
  const now = Date.now();
  plan.filter((n) => n.at > now && n.at - now < 12 * 3600000).forEach((n) => {
    notifTimeouts.push(setTimeout(() => {
      const { title, body } = notifText(n.id, store.baby ? store.baby.name : "", n.name);
      showNotif(title, body);
    }, n.at - now));
  });
}

/* ---------- azioni ---------- */
window.NINNA = {
  setView(v) {
    // lasciando Suoni con un audio attivo, il player torna a piena
    // dimensione: e' il momento in cui conferma che il suono e' ancora
    // acceso, anche se prima l'avevi ridotto apposta
    if (view === "suoni" && v !== "suoni" && sound.playing) miniCollapsed = false;
    view = v;
    render();
  },
  setLang(l) { lang = l === "en" ? "en" : "it"; store.prefs.lang = lang; persist(); render(); if (showAbout) renderAbout(); else if (showReport) renderReport(); else if ($modal.innerHTML) renderSettings(); },
  setTheme(v) {
    theme = v;
    store.prefs.theme = v;
    persist();
    applyTheme();
    if ($modal.innerHTML) renderSettings();
  },
  toggleLogOnly() {
    logOnly = !logOnly;
    store.prefs.logOnly = logOnly;
    persist();
    if (logOnly && (view === "stat")) view = "oggi";   // la vista nascosta non resta aperta
    toast(logOnly ? t("logonly_on") : t("logonly_off"));
    render();
    if ($modal.innerHTML) renderSettings();
  },
  startSleep(kind) {
    store.events.push({ id: uid(), type: kind, start: Date.now(), end: null });
    persist(); toast(typeLabel(kind) + " · " + t("started")); render();
    if (kind === "night" && !nightMode && !store.prefs.nightPromptSeen) {
      store.prefs.nightPromptSeen = true; persist();
      $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.dismissNightPrompt()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="card-title">${t("night_prompt_title")}</div>
          <p class="dim small" style="line-height:1.55">${t("night_prompt_body")}</p>
          <button class="primary block" onclick="NINNA.acceptNightPrompt()">${t("night_prompt_yes")}</button>
          <button class="link block" onclick="NINNA.dismissNightPrompt()">${t("night_prompt_no")}</button>
        </div>
      </div>`;
    }
  },
  endSleep(id) {
    const e = store.events.find((x) => x.id === id);
    if (e) { e.end = Date.now(); persist(); toast(t("logged") + fmtDur(e.end - e.start)); }
    render();
  },
  logInstant(type) {
    if (HEALTH.includes(type)) return this.askHealthName(type);
    store.events.push({ id: uid(), type, at: Date.now() });
    persist(); toast(t("logged_type", { label: typeLabel(type) })); render();
  },
  /* i farmaci e gli integratori hanno bisogno di un nome: "Farmaco" e basta
     non dice nulla se il bambino ne prende piu' di uno. I nomi gia' usati
     compaiono come scorciatoie, cosi' il caso frequente resta a due tocchi. */
  askHealthName(type) {
    const recent = [...new Set(store.events.filter((e) => e.type === type && e.note)
      .sort((a, b) => b.at - a.at).map((e) => e.note))].slice(0, 4);
    $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.closeSettings()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="card-title">${TYPE_ICONS[type]} ${typeLabel(type)}</div>
        ${recent.length ? `<div class="dim small">${t("health_recent")}</div>
        <div class="chiprow">${recent.map((r) => `<button class="chip" onclick="NINNA.saveHealth('${type}', ${esc(JSON.stringify(r))})">${esc(r)}</button>`).join("")}</div>` : ""}
        <label class="field"><span>${t("health_which")}</span>
          <input id="h-name" placeholder="${t("health_ph_" + type)}" autocomplete="off"></label>
        <label class="field"><span>${t("health_repeat")}</span>
          <select id="h-repeat">
            <option value="0">${t("health_repeat_none")}</option>
            ${[4, 6, 8, 12, 24].map((h) => `<option value="${h}">${t("health_repeat_in", { h })}</option>`).join("")}
          </select></label>
        <button class="secondary block" onclick="NINNA.saveHealth('${type}')">${t("save")}</button>
        <button class="link block" onclick="NINNA.saveHealth('${type}', '')">${t("health_skip")}</button>
      </div>
    </div>`;
    const el = document.getElementById("h-name");
    if (el) el.focus();
  },
  saveHealth(type, preset) {
    const el = document.getElementById("h-name");
    const repEl = document.getElementById("h-repeat");
    const note = (preset !== undefined ? preset : (el ? el.value : "")).trim();
    const repeatH = repEl ? parseInt(repEl.value, 10) || 0 : 0;
    const ev = { id: uid(), type, at: Date.now() };
    if (note) ev.note = note;
    // il promemoria si aggancia al NOME: se domani registri di nuovo lo
    // stesso farmaco, e' quella la voce piu' recente a contare, non questa
    if (note && repeatH) ev.repeatH = repeatH;
    store.events.push(ev);
    showHealth = false;
    persist(); this.closeSettings();
    toast(note ? note : t("logged_type", { label: typeLabel(type) }));
    render();
  },
  removeEvent(id) { store.events = store.events.filter((e) => e.id !== id); persist(); render(); },
  openEdit(id) {
    const e = store.events.find((x) => x.id === id);
    if (!e) return;
    const hm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    const dur = e.start != null;
    $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.closeSettings()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="card-title">${t("edit_title")}</div>
        <div class="dim small">${TYPE_ICONS[e.type]} ${typeLabel(e.type)}</div>
        ${dur ? `<div class="row2">
            <label class="field"><span>${t("manual_start")}</span><input type="time" id="e-start" value="${hm(e.start)}"></label>
            ${e.end ? `<label class="field"><span>${t("manual_end")}</span><input type="time" id="e-end" value="${hm(e.end)}"></label>` : ""}
          </div>` : `<label class="field"><span>${t("edit_time")}</span><input type="time" id="e-at" value="${hm(e.at)}"></label>`}
        ${HEALTH.includes(e.type) ? `<label class="field"><span>${t("health_which")}</span>
          <input id="e-note" value="${esc(e.note || "")}" placeholder="${t("health_ph_" + e.type)}" autocomplete="off"></label>` : ""}
        <button class="secondary block" onclick="NINNA.saveEdit('${e.id}')">${t("save")}</button>
        <button class="link block" onclick="NINNA.closeSettings()">${t("close")}</button>
      </div>
    </div>`;
  },
  saveEdit(id) {
    const e = store.events.find((x) => x.id === id);
    if (!e) return;
    const anchor = (ts, hmStr) => {
      const [h, m] = hmStr.split(":").map(Number);
      const d = new Date(ts); d.setHours(h, m, 0, 0); return d.getTime();
    };
    if (e.start != null) {
      const sv = document.getElementById("e-start");
      if (!sv || !sv.value) return toast(t("invalid_times"));
      const ns = anchor(e.start, sv.value);
      let ne = e.end;
      if (e.end) {
        const ev = document.getElementById("e-end");
        if (!ev || !ev.value) return toast(t("invalid_times"));
        ne = anchor(e.start, ev.value);
        if (ne <= ns) ne += 86400000;   // fine oltre mezzanotte, stessa regola dell'inserimento manuale
      }
      e.start = ns; e.end = ne;
    } else {
      const av = document.getElementById("e-at");
      if (!av || !av.value) return toast(t("invalid_times"));
      e.at = anchor(e.at, av.value);
    }
    const nv = document.getElementById("e-note");
    if (nv) { const n = nv.value.trim(); if (n) e.note = n; else delete e.note; }
    persist(); this.closeSettings(); toast(t("edit_done")); render();
  },
  toggleWhy() { showWhy = !showWhy; render(); },
  togglePressureInfo() { showPressureInfo = !showPressureInfo; render(); },
  toggleManual() { showManual = !showManual; render(); },
  toggleHealth() { showHealth = !showHealth; render(); },
  addManual() {
    const kind = document.getElementById("m-kind").value;
    const s = document.getElementById("m-start").value;
    const e = document.getElementById("m-end").value;
    if (!s || !e) return toast(t("missing_times"));
    const iso = localTodayISO();
    let sMs = new Date(`${iso}T${s}:00`).getTime();
    let eMs = new Date(`${iso}T${e}:00`).getTime();
    if (isNaN(sMs) || isNaN(eMs)) return toast(t("invalid_times"));
    if (eMs <= sMs) eMs += 86400000;
    if (sMs > Date.now()) { sMs -= 86400000; eMs -= 86400000; } // "ieri sera" inserito stamattina
    store.events.push({ id: uid(), type: kind, start: sMs, end: eMs });
    persist(); showManual = false; toast(t("added")); render();
  },
  playSound(id) {
    sound.setVolume(store.prefs.volume ?? 0.4);
    sound.play(id);
    nightSoundListOpen = false;
    updateMiniPlayer();
    render();
  },
  stopSound() { sound.stop(); nightSoundListOpen = false; nightLastSound = null; updateMiniPlayer(); render(); },
  toggleMiniPlayer() { miniCollapsed = !miniCollapsed; updateMiniPlayer(); },
  setVolume(v) {
    const f = parseFloat(v);
    sound.setVolume(f);
    // il valore in memoria si aggiorna subito: ogni ridisegno ricostruisce lo
    // slider da qui, e se restasse indietro mostrerebbe il valore vecchio
    // mentre l'audio suona a quello nuovo. Solo la scrittura su disco resta
    // ritardata, per non scrivere a ogni pixel trascinato.
    store.prefs.volume = f;
    document.querySelectorAll(".ctl-value").forEach((el) => { el.textContent = Math.round(f * 100) + "%"; });
    clearTimeout(this._volT);
    this._volT = setTimeout(() => persist(), 400);
  },
  setSleepTimer(min) {
    const n = parseInt(min, 10) || 0;
    timerMin = n;
    sound.sleepTimer(n);
    toast(n > 0 ? t("timer_set", { n }) : t("timer_off"));
  },
  toggleArticle(id) { const el = document.getElementById("art-" + id); if (el) el.hidden = !el.hidden; },
  openSettings() { renderSettings(); },
  openProfile(from) { profileFrom = from || "settings"; renderProfileEdit(); },
  openDoseReminder(name) {
    const d = doseReminders().find((x) => x.name === name);
    if (!d) return;
    ackedDoses[name] = d.due;  // il tocco ferma il lampeggio, a prescindere da cosa si fa dopo
    renderDoseReminder(name);
    render();
  },
  logDoseAgain(name, keepRepeat) {
    const d = doseReminders().find((x) => x.name === name);
    if (!d) return;
    const ev = { id: uid(), type: d.type, at: Date.now(), note: name };
    if (keepRepeat) ev.repeatH = d.repeatH;
    store.events.push(ev);
    delete ackedDoses[name];
    persist(); this.closeSettings();
    toast(t("logged_type", { label: name }));
    render();
  },
  closeProfile() { if (profileFrom === "settings") NINNA.openSettings(); else { $modal.innerHTML = ""; } },
  saveProfile() {
    const n = document.getElementById("p-name").value.trim();
    const d = document.getElementById("p-birth").value;
    if (!n) return toast(t("ob_need_name"));
    if (!d) return toast(t("ob_need_birth"));
    // una data futura falserebbe eta' e previsioni
    if (new Date(d + "T00:00:00").getTime() > Date.now()) return toast(t("profile_future"));
    store.baby.name = n;
    store.baby.birth = d;
    persist(); toast(t("edit_done")); NINNA.closeProfile(); render();
  },
  openAbout() { showAbout = true; renderAbout(); },
  toggleNightMode() { nightMode = !nightMode; if (!nightMode) { nightSoundListOpen = false; nightLastSound = null; } render(); },
  resumeNightSound() { if (nightLastSound) this.playSound(nightLastSound); },
  pauseNightSound() { sound.stop(); updateMiniPlayer(); render(); },
  toggleNightSoundList() { nightSoundListOpen = !nightSoundListOpen; render(); },
  acceptNightPrompt() { nightMode = true; this.closeSettings(); render(); },
  dismissNightPrompt() { this.closeSettings(); },
  closeAbout() { showAbout = false; $modal.innerHTML = ""; },
  closeSettings() { $modal.innerHTML = ""; },
  openReport() { showReport = true; renderReport(); },
  closeReport() { showReport = false; $modal.innerHTML = ""; },
  openGrowth() { showGrowth = true; showGrowthForm = false; renderGrowth(); },
  closeGrowth() { showGrowth = false; showGrowthForm = false; $modal.innerHTML = ""; render(); },
  toggleGrowthForm() { showGrowthForm = !showGrowthForm; renderGrowth(); },
  setSex(sex) { store.baby.sex = sex; persist(); renderGrowth(); },
  saveGrowth() {
    const dateEl = document.getElementById("g-date");
    const w = parseFloat(document.getElementById("g-weight").value);
    const h = parseFloat(document.getElementById("g-height").value);
    const hc = parseFloat(document.getElementById("g-head").value);
    if (!(w > 0) && !(h > 0) && !(hc > 0)) return toast(t("growth_empty_error"));
    const rec = { id: uid(), date: dateEl.value || localTodayISO() };
    if (w > 0) rec.weight = w;
    if (h > 0) rec.height = h;
    if (hc > 0) rec.head = hc;
    store.growth.push(rec);
    store.growth.sort((a, b) => a.date.localeCompare(b.date));
    showGrowthForm = false;
    persist(); toast(t("added")); renderGrowth(); render();
  },
  deleteGrowth(id) {
    if (!confirm(t("growth_delete_confirm"))) return;
    store.growth = store.growth.filter((g) => g.id !== id);
    persist(); renderGrowth(); render();
  },
  exportCSVFile() {
    const labels = Object.fromEntries(["nap","night","breast","bottle","solid","diaper","nightwake","pump"].map((k) => [k, typeLabel(k)]));
    const header = [t("csv_type"), t("csv_start"), t("csv_end"), t("csv_dur"), t("health_which")];
    const blob = new Blob([exportCSV(store.events, labels, header)], { type: "text/csv" });
    downloadBlob(blob, "ninna-data.csv"); toast(t("csv_done"));
  },
  exportJSONFile() {
    const blob = new Blob([exportJSON(store)], { type: "application/json" });
    downloadBlob(blob, "ninna-backup.json"); toast(t("backup_done"));
  },
  importJSONFile(input) {
    const f = input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        store = importJSON(r.result);
        lang = store.prefs.lang === "en" ? "en" : "it";
        logOnly = store.prefs.logOnly === true;
        theme = store.prefs.theme || "auto";
        applyTheme();
        persist(); NINNA.closeSettings(); toast(t("import_done")); render();
      } catch { toast(t("import_bad")); }
    };
    r.readAsText(f);
  },
  async enableNotifs() {
    const ok = await askNotifPermission();
    toast(ok ? t("notif_on") : t("notif_denied"));
    render();
  },
  wipe() {
    if (!confirm(t("wipe_confirm"))) return;
    store = { version: 1, baby: null, events: [], growth: [], prefs: { volume: 0.4, lang, logOnly, theme } };
    persist(); this.closeSettings(); render();
  },
  saveBaby() {
    const name = document.getElementById("ob-name").value.trim();
    const birth = document.getElementById("ob-birth").value;
    if (!name || !birth) return toast(t("ob_missing"));
    store.baby = { name, birth }; persist(); render();
  },
};

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- viste ---------- */
function ringSVG(pct, sleeping) {
  const R = 52, C = 2 * Math.PI * R, filled = C * Math.min(1, pct);
  const color = sleeping ? "var(--sleeping)" : pct < 0.75 ? "var(--mint)" : "var(--rose)";
  // il numero non supera mai il 100%, come il disegno: un valore "150%" legge
  // come un errore. Oltre la soglia, la classe "over" fa pulsare l'anello,
  // che diventa l'unico segnale di "stiamo andando oltre", senza testo nuovo.
  const label = sleeping ? "zZ" : Math.round(Math.min(1, pct) * 100) + "%";
  const sub = sleeping ? (lang === "it" ? "sta dormendo" : "sleeping") : t("pressure_label");
  return `<svg width="120" height="120" viewBox="0 0 128 128" class="ring${!sleeping && pct > 1 ? " over" : ""}">
    <circle cx="64" cy="64" r="${R}" stroke="var(--stroke)" stroke-width="10" fill="none"/>
    <circle cx="64" cy="64" r="${R}" fill="none" stroke-width="10" stroke-linecap="round"
      stroke="${color}" stroke-dasharray="${filled} ${C}" transform="rotate(-90 64 64)"/>
    <text x="64" y="60" text-anchor="middle" fill="var(--text)" font-size="26">${label}</text>
    <text x="64" y="80" text-anchor="middle" fill="var(--sub)" font-size="10">${sub}</text>
  </svg>`;
}


/* ---------- tema chiaro/scuro/automatico ---------- */
function applyTheme() {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") root.classList.add("theme-light");
  else if (theme === "dark") root.classList.add("theme-dark");
  // "auto": nessuna classe, decide la media query prefers-color-scheme in styles.css
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    if (bg) meta.setAttribute("content", bg);
  }
}
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (theme === "auto") applyTheme();   // il sistema cambia mentre siamo in automatico
  });
}

/* ---------- mini player persistente ---------- */
function updateMiniPlayer() {
  // niente sulla scheda Suoni: la riga del suono attivo ha gia' il suo
  // controllo, un secondo indicatore lì sarebbe rumore, non informazione
  let html = "";
  if (sound.playing && view !== "suoni") {
    const label = t("sound_" + sound.playing);
    html = miniCollapsed
      ? `<button class="miniplayer collapsed" onclick="NINNA.toggleMiniPlayer()" aria-label="${t("mp_expand")}">
          <span class="mp-dot"></span>
        </button>`
      : `<div class="miniplayer">
          <button class="mp-name" onclick="NINNA.setView('suoni')">${label}</button>
          <button class="mp-btn mp-collapse" onclick="NINNA.toggleMiniPlayer()" aria-label="${t("mp_collapse")}">–</button>
          <button class="mp-btn mp-stop" onclick="NINNA.stopSound()" aria-label="${t("mp_stop")}">${STOP_ICON}</button>
        </div>`;
  }
  // ridisegna solo se il contenuto cambia davvero: il render periodico dei
  // 30s non deve far ripartire l'animazione di apertura senza motivo
  if ($mini.innerHTML !== html) $mini.innerHTML = html;
}

const githubLink = () => `<a href="${GITHUB}" target="_blank" rel="noopener">GitHub</a>`;

function footerHTML(kind) {
  const langBlock = `<div class="langrow">
      <span class="langlabel">${t("language").toUpperCase()}</span>
      <div class="langpill">
        <button class="langopt ${lang === "it" ? "on" : ""}" onclick="NINNA.setLang('it')">IT</button>
        <button class="langopt ${lang === "en" ? "on" : ""}" onclick="NINNA.setLang('en')">EN</button>
      </div>
    </div>`;
  if (kind === "onboarding") {
    return `<div class="appfooter">${langBlock}
    <div class="hairline"></div>
    <div class="finelines">${t("footer1")}</div>
  </div>`;
  }
  // kind === "full": solo in coda alla Guida
  return `<div class="appfooter">${langBlock}
    <a class="coffee" href="${KOFI}" target="_blank" rel="noopener">${CUP}<span>${t("coffee")}</span></a>
    <div class="hairline"></div>
    <div class="finelines">${t("footer1")}<br>${t("footer2")} · ${githubLink()}</div>
  </div>`;
}

function timelineHTML(events, now) {
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const dayStart = d0.getTime(), dayEnd = dayStart + 86400000;
  const pct = (ts) => Math.max(0, Math.min(100, ((ts - dayStart) / 86400000) * 100));

  const sleepSegs = events
    .filter((e) => (e.type === "nap" || e.type === "night") && e.start < dayEnd && (e.end || now) > dayStart)
    .map((e) => {
      const s = Math.max(e.start, dayStart);
      const en = Math.min(e.end || now, dayEnd);
      return { left: pct(s), width: pct(en) - pct(s), night: e.type === "night" };
    })
    .filter((seg) => seg.width > 0.3);

  const feedDots = events
    .filter((e) => ["breast", "bottle", "solid"].includes(e.type) && e.at >= dayStart && e.at < dayEnd)
    .map((e) => pct(e.at));

  const hourMarks = [0, 6, 12, 18, 24];
  return `<div class="timeline">
    <div class="timeline-track">
      ${sleepSegs.map((sgt) => `<div class="tl-sleep${sgt.night ? " night" : ""}" style="left:${sgt.left}%;width:${sgt.width}%"></div>`).join("")}
      ${feedDots.map((p) => `<div class="tl-feed" style="left:${p}%"></div>`).join("")}
      <div class="tl-now" style="left:${pct(now)}%"></div>
    </div>
    <div class="timeline-labels">${hourMarks.map((h) => `<span>${String(h).padStart(2, "0")}</span>`).join("")}</div>
    <div class="tl-legend">
      <span><i class="sw nap"></i>${t("tl_legend_nap")}</span>
      <span><i class="sw night"></i>${t("tl_legend_night")}</span>
      <span><i class="sw feed"></i>${t("tl_legend_feed")}</span>
    </div>
  </div>`;
}

function renderOggi(f) {
  const active = store.events.find((e) => (e.type === "nap" || e.type === "night") && !e.end);
  const b = store.baby;
  let hero;
  if (active) {
    hero = `${ringSVG(1, true)}
      <div class="hero-text">
        <div class="hero-label">${typeLabel(active.type)} · ${t("hero_sleeping")}</div>
        <div class="hero-big">${fmtDur(Date.now() - active.start)}</div>
        <button class="primary" onclick="NINNA.endSleep('${active.id}')">${t("btn_awake")}</button>
      </div>`;
  } else if (logOnly) {
    hero = `<div class="hero-text">
      <div class="hero-label">${t("today")}</div>
      <div class="hero-sub">${t("logonly_hint")}</div>
    </div>`;
  } else if (f.lastWake) {
    const s = f.sweetSpot;
    const isNight = f.next.kind === "night";
    hero = `<button class="ringtap" onclick="NINNA.togglePressureInfo()" aria-label="${t("pressure_label")}">${ringSVG(f.pressure, false)}</button>
      <div class="hero-text">
        <div class="hero-label">${isNight ? t("hero_night") : t("hero_nap")}</div>
        <div class="hero-big">${isNight ? fmtHM(f.bedtime.at) : fmtHM(s.from) + "–" + fmtHM(s.to)}</div>
        <div class="hero-sub">${isNight
          ? t("routine_at", { time: fmtHM(f.bedtime.at - 45 * 60000) })
          : s.center > Date.now()
            ? t("center_in", { dur: fmtDur(s.center - Date.now()) })
            : t("window_over", { dur: fmtDur(Date.now() - s.center) })} · ${t("awake_for", { dur: fmtDur(Date.now() - f.lastWake) })}</div>
        <button class="link" onclick="NINNA.toggleWhy()">${showWhy ? t("why_close") : t("why_open")}</button>
        ${showWhy ? `<div class="why">${reasonText(f.next)}<br>${t("why_window", { lo: f.profile.ww[0], hi: f.profile.ww[1] })}
          ${f.window.observedEma
            ? t("why_observed", { name: esc(b.name), ema: f.window.observedEma, conf: Math.round(f.window.confidence * 100), min: f.window.minutes })
            : t("why_default", { min: f.window.minutes })}
          ${t("why_bed", { time: fmtHM(f.bedtime.at) })}</div>` : ""}
        ${showPressureInfo ? `<div class="why">${t("pressure_info")}</div>` : ""}
      </div>`;
  } else if (store.events.length === 0) {
    // il riquadro introduttivo sparisce dopo la prima registrazione: da li'
    // in poi la timeline e il diario dicono gia' cosa sta succedendo
    hero = `<div class="hero-text">
      <div class="hero-label">${t("hero_start")}</div>
      <div class="hero-sub">${t("hero_start_sub", { name: esc(b.name) })}</div>
    </div>`;
  } else {
    hero = null;
  }

  const todayEvents = [...store.events]
    .filter((e) => sameDay(e.start || e.at, Date.now()))
    .sort((a, b2) => (b2.start || b2.at) - (a.start || a.at));

  return `
    ${!logOnly && f.transition.detected ? `<div class="banner">${t("transition", { avg: f.transition.avgNaps, lo: f.transition.expected[0], hi: f.transition.expected[1] })}</div>` : ""}
    ${todayEvents.length > 0 ? timelineHTML(store.events, Date.now()) : ""}
    ${hero ? `<div class="card hero">${hero}</div>` : ""}
    ${!active ? (() => {
      const k = logOnly ? null : f.next.kind;
      const btn = (kind, label) => `<button class="bigbtn ${k === kind ? "" : "alt"}" onclick="NINNA.startSleep('${kind}')">${TYPE_ICONS[kind]} ${label}${k === kind ? `<span class="rec">${t("recommended")}</span>` : ""}</button>`;
      return `<div class="row2">${btn("nap", t("btn_nap"))}${btn("night", t("btn_night"))}</div>`;
    })() : ""}
    ${!active && !logOnly && f.lastWake && f.next.kind === "nap" ? `<div class="card slim">
      <div class="hero-sub">${TYPE_ICONS.night} ${t("bed_card")} <b class="lit">${fmtHM(f.bedtime.at)}</b>
      ${f.bedtime.earlier ? `<br><span class="amber">${t("bed_earlier")}</span>` : ""}</div>
    </div>` : ""}
    ${doseReminders().map((d) => {
      const soon = d.due - Date.now() < 30 * 60000;
      const ready = d.due <= Date.now();
      const acked = ackedDoses[d.name] === d.due;
      const cls = ready ? (acked ? "dose-ready" : "dose-ready dose-pulse") : soon ? "dose-soon" : "";
      const label = ready ? t("dose_ready", { name: esc(d.name) }) : t("dose_next", { name: esc(d.name), time: fmtHM(d.due) });
      return `<button class="card slim dosecard ${cls}" onclick="NINNA.openDoseReminder(${esc(JSON.stringify(d.name))})">
        <div class="hero-sub">${TYPE_ICONS.med} ${label}</div>
      </button>`;
    }).join("")}
    <div class="grid3">
      ${INSTANT.map((ty) => `<button class="tile" onclick="NINNA.logInstant('${ty}')">
        <span class="tile-icon">${TYPE_ICONS[ty]}</span><span>${typeLabel(ty)}</span>
      </button>`).join("")}
    </div>
    <button class="link block" onclick="NINNA.toggleHealth()">${showHealth ? "− " + t("salute") : "+ " + t("salute")}</button>
    ${showHealth ? `<div class="grid3 salute">
      ${HEALTH.map((ty) => `<button class="tile" onclick="NINNA.logInstant('${ty}')">
        <span class="tile-icon">${TYPE_ICONS[ty]}</span><span>${typeLabel(ty)}</span>
      </button>`).join("")}
    </div>` : ""}
    <button class="link block" onclick="NINNA.toggleManual()">${showManual ? t("manual_close") : t("manual_open")}</button>
    ${showManual ? `<div class="card">
      <label class="field"><span>${t("manual_type")}</span>
        <select id="m-kind"><option value="nap">${typeLabel("nap")}</option><option value="night">${typeLabel("night")}</option></select>
      </label>
      <div class="row2">
        <label class="field"><span>${t("manual_start")}</span><input type="time" id="m-start" value="13:00"></label>
        <label class="field"><span>${t("manual_end")}</span><input type="time" id="m-end" value="14:00"></label>
      </div>
      <button class="secondary block" onclick="NINNA.addManual()">${t("save")}</button>
    </div>` : ""}
    <div class="card">
      <div class="card-title">${t("today")}</div>
      ${todayEvents.length === 0 ? `<div class="dim">${t("today_empty")}</div>` : ""}
      ${todayEvents.map((e) => `<div class="logrow tap" onclick="NINNA.openEdit('${e.id}')">
        <span class="logicon">${TYPE_ICONS[e.type]}</span>
        <span class="loglabel">${typeLabel(e.type)}${e.note ? ` <span class="lognote">${esc(e.note)}</span>` : ""}</span>
        <span class="logtime">${e.at
          ? fmtHM(e.at)
          : fmtHM(e.start) + (e.end ? "–" + fmtHM(e.end) + " · " + fmtDur(e.end - e.start) : " · " + t("in_progress"))}</span>
        <span class="edithint">${EDIT_ICON}</span>
        <button class="del" onclick="event.stopPropagation(); NINNA.removeEvent('${e.id}')">✕</button>
      </div>`).join("")}
    </div>
    ${hasNotif() && Notification.permission === "default"
      ? `<button class="secondary block" onclick="NINNA.enableNotifs()">${t("notif_enable")}</button>` : ""}`;
}

function renderStat(f) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const ts = Date.now() - i * 86400000;
    const s = dailyStats(store.events, ts, profileFor(store.baby.birth, ts));
    days.push({ label: new Date(ts).toLocaleDateString(LOCALE(), { weekday: "short" }), total: s.totalMinutes / 60 });
  }
  const st = f.stats, pr = f.profile;
  /* Il grafico non parte piu' da zero: con valori tipici fra 12 e 15 ore le
     barre da zero risultavano tutte uguali e la variazione, l'unica cosa che
     interessa, era invisibile. La fascia mostra l'intervallo tipico per
     l'eta': si legge la posizione della barra rispetto alla fascia, non la
     sua lunghezza. Il giorno in corso e' tratteggiato: confrontarlo pieno
     con giorni completi mostrava un crollo che non esiste. */
  const TRACK = 106;
  // il giorno in corso non partecipa alla scala: le sue ore parziali
  // stirerebbero il dominio verso il basso comprimendo la variazione dei
  // giorni completi, che e' proprio cio' che il grafico deve mostrare
  const complete = days.slice(0, 6).filter((d) => d.total > 0);
  const dataMax = Math.max(...complete.map((d) => d.total), pr.total[1]);
  const dataMin = complete.length ? Math.min(...complete.map((d) => d.total), pr.total[0]) : pr.total[0];
  const lo = Math.max(0, dataMin - 1.5), hi = dataMax + 0.5;
  const px = (v) => Math.max(3, Math.round(((v - lo) / (hi - lo)) * TRACK));
  const bandBottom = Math.round(((pr.total[0] - lo) / (hi - lo)) * TRACK);
  const bandH = Math.round(((pr.total[1] - pr.total[0]) / (hi - lo)) * TRACK);
  const row = (k, v) => `<div class="logrow"><span class="loglabel">${k}</span><span class="logtime">${v}</span></div>`;
  return `
    <div class="card">
      <div class="card-title">${t("stat_title")}</div>
      <div class="chart">
        <div class="chart-vals">${days.map((d, i) => `<span class="${i === 6 ? "dimv" : ""}">${d.total ? d.total.toFixed(1) + "h" : "·"}</span>`).join("")}</div>
        <div class="chart-track">
          <div class="chart-band" style="bottom:${bandBottom}px;height:${bandH}px"></div>
          <div class="chart-bars">${days.map((d, i) => `<div class="cbar ${i === 6 ? "today" : ""}" style="height:${d.total ? px(d.total) : 3}px"></div>`).join("")}</div>
        </div>
        <div class="chart-labels">${days.map((d, i) => `<span>${i === 6 ? t("stat_today_short") : d.label}</span>`).join("")}</div>
      </div>
      <div class="chart-legend">
        <span class="lg-band"></span>${t("stat_band")}
        <span class="lg-today"></span>${t("stat_inprogress")}
      </div>
    </div>
    <div class="card">
      <div class="card-title">${t("stat_today")}</div>
      <div class="dim small" style="margin-bottom:6px">${t("stat_today_note")}</div>
      ${row(t("stat_day"), t("stat_rangefmt", { v: Math.round(st.napMinutes / 6) / 10, lo: pr.day[0], hi: pr.day[1] }))}
      ${row(t("stat_night"), t("stat_rangefmt", { v: Math.round(st.nightMinutes / 6) / 10, lo: pr.night[0], hi: pr.night[1] }))}
      ${row(t("stat_naps"), t("count_rangefmt", { v: st.naps, lo: pr.naps[0], hi: pr.naps[1] }))}
      <div class="hairline slim"></div>
      ${row(t("stat_feeds"), `${st.feeds}${st.avgFeedGapMin ? " · " + t("stat_every", { h: Math.round(st.avgFeedGapMin / 6) / 10 }) : ""}`)}
      ${row(t("stat_diapers"), st.diapers)}
      ${row(t("stat_wakes"), st.nightWakes)}
      <div class="dim small">${t("stat_variability")}</div>
    </div>
    <div class="card">
      <div class="card-title">${t("growth")}</div>
      ${(() => {
        if (!store.growth.length) return `<div class="dim">${t("growth_none")}</div>`;
        const last = [...store.growth].sort((a, b2) => b2.date.localeCompare(a.date))[0];
        return `<div class="logrow"><span class="loglabel">${t("growth_latest", { date: new Date(last.date + "T00:00:00").toLocaleDateString(LOCALE(), { day: "2-digit", month: "short" }), summary: growthSummary(last) })}</span></div>`;
      })()}
      <button class="link block" onclick="NINNA.openGrowth()">${t("growth_open")} →</button>
    </div>
    <button class="secondary block" onclick="NINNA.exportCSVFile()">${t("export_csv")}</button>`;
}

// "0 min" nei primi 30 secondi sembra un dato rotto, non un dato vero
function elapsedLabel(ms) {
  return ms < 45000 ? t("just_started") : t("playing_for", { dur: fmtDur(ms) });
}

function renderSuoni() {
  const vol = store.prefs.volume ?? 0.4;
  const soundCtl = (inline) => `<div class="soundctl${inline ? " inline" : ""}">
    ${inline && sound.startedAt ? `<div class="ctl-elapsed">${elapsedLabel(Date.now() - sound.startedAt)}</div>` : ""}
    <div class="ctl-compact">
      <span class="ctl-ico" aria-hidden="true">${VOL_ICON}</span>
      <input class="ctl-range" type="range" min="0" max="1" step="0.01" value="${vol}"
        aria-label="${t("volume")}" oninput="NINNA.setVolume(this.value)">
      <span class="ctl-value">${Math.round(vol * 100)}%</span>
      <span class="ctl-sep" aria-hidden="true"></span>
      <span class="ctl-ico" aria-hidden="true">${CLOCK_ICON}</span>
      <select class="ctl-select" aria-label="${t("sleep_timer")}" onchange="NINNA.setSleepTimer(this.value)">
        <option value="0"${timerMin === 0 ? " selected" : ""}>${t("never")}</option>
        ${[15, 30, 45, 60].map((n) => `<option value="${n}"${timerMin === n ? " selected" : ""}>${t("timer_min", { n })}</option>`).join("")}
      </select>
    </div>
  </div>`;
  const activeId = sound.playing;
  return `
    <div class="card">
      <div class="card-title">${t("sounds_title")}</div>
      <div class="dim small">${t("sounds_note")}</div>
      ${SOUNDS.map((s) => {
        const on = s.id === activeId;
        const icon = on
          ? `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>`
          : `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>`;
        const row = `<button class="soundrow ${on ? "on" : ""}" onclick="NINNA.playSound('${s.id}')">
        <span class="soundtext"><b>${t("sound_" + s.id)}</b><small>${t("sounddesc_" + s.id)}</small></span>
        <span class="soundstate ${on ? "stop" : "play"}">${icon}</span>
      </button>`;
        // il suono attivo e il pannello vivono in un unico contenitore reale,
        // non due elementi separati con un trucco css a farli combaciare:
        // quel trucco (:has() + margine negativo) lasciava artefatti visibili
        // in alcuni contesti di rendering
        return on ? `<div class="soundgroup active">${row}${soundCtl(true)}</div>` : row;
      }).join("")}
    </div>`;
}

function renderGuida() {
  const { cats, articles } = I18N[lang];
  return cats.map((c) => `
    <div class="catlabel">${c.label}</div>
    ${articles.filter((a) => a.cat === c.id).map((a) => `
      <div class="card artcard" onclick="NINNA.toggleArticle('${a.id}')">
        <div class="art-head">
          <span class="art-title">${a.t}</span>
          <span class="art-min">${t("read_min", { n: a.min })}</span>
        </div>
        <p class="artbody" id="art-${a.id}" hidden>${a.b}</p>
      </div>`).join("")}
  `).join("") + `<div class="dim small pad">${t("guide_disclaimer")}</div>`;
}

function renderNightMode(f) {
  if (sound.playing) nightLastSound = sound.playing;  // memoria: sopravvive alla pausa

  /* La scelta del suono SOSTITUISCE la schermata invece di galleggiarci sopra:
     e' l'unico modo per cui, a qualunque altezza di schermo e con la barra del
     browser aperta, non possa mai sovrapporsi al tasto centrale. */
  if (nightSoundListOpen) {
    return `<div class="night-overlay night-picker">
      <button class="night-exit" onclick="NINNA.toggleNightSoundList()">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>
        <span>${t("close")}</span>
      </button>
      <div class="picker-list">
        <div class="picker-title">${t("sounds_title")}</div>
        ${SOUNDS.map((s) => {
          const on = sound.playing === s.id;
          const nctl = `<div class="nctl">
            ${sound.startedAt ? `<div class="ctl-elapsed">${elapsedLabel(Date.now() - sound.startedAt)}</div>` : ""}
            <div class="ctl-compact">
              <span class="ctl-ico" aria-hidden="true">${VOL_ICON}</span>
              <input class="ctl-range" type="range" min="0" max="1" step="0.01" value="${store.prefs.volume ?? 0.4}"
                aria-label="${t("volume")}" oninput="NINNA.setVolume(this.value)">
              <span class="ctl-value">${Math.round((store.prefs.volume ?? 0.4) * 100)}%</span>
              <span class="ctl-sep" aria-hidden="true"></span>
              <span class="ctl-ico" aria-hidden="true">${CLOCK_ICON}</span>
              <select class="ctl-select" aria-label="${t("sleep_timer")}" onchange="NINNA.setSleepTimer(this.value)">
                <option value="0"${timerMin === 0 ? " selected" : ""}>${t("never")}</option>
                ${[15, 30, 45, 60].map((n) => `<option value="${n}"${timerMin === n ? " selected" : ""}>${t("timer_min", { n })}</option>`).join("")}
              </select>
            </div>
          </div>`;
          return `<button class="picker-row${on ? " on" : ""}" onclick="NINNA.${on ? "pauseNightSound()" : `playSound('${s.id}')`}">
            <span>${t("sound_" + s.id)}</span>${on ? PAUSE_ICON : PLAY_ICON}
          </button>${on ? nctl : ""}`;
        }).join("")}
        ${nightLastSound ? `<button class="picker-stop" onclick="NINNA.stopSound()">${t("mp_stop")}</button>` : ""}
      </div>
    </div>`;
  }

  const active = store.events.find((e) => (e.type === "nap" || e.type === "night") && !e.end);
  let status, big;
  if (active) {
    status = `${typeLabel(active.type)} · ${t("hero_sleeping")}`;
    big = `<button class="night-btn" onclick="NINNA.endSleep('${active.id}')">${t("btn_awake")}</button>`;
  } else {
    status = f.lastWake ? t("awake_for", { dur: fmtDur(Date.now() - f.lastWake) }) : "";
    const kind = f.next ? f.next.kind : "night";
    const label = kind === "night" ? t("btn_night") : t("btn_nap");
    big = `<button class="night-btn" onclick="NINNA.startSleep('${kind}')">${label}</button>`;
  }
  return `<div class="night-overlay">
    <button class="night-exit" onclick="NINNA.toggleNightMode()">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      <span>${t("night_exit")}</span>
    </button>
    ${nightLastSound ? `<div class="night-sound">
      <button class="ns-name" onclick="NINNA.toggleNightSoundList()">${t("sound_" + nightLastSound)}</button>
      <button class="ns-stop ${sound.playing ? "" : "paused"}" onclick="${sound.playing ? "NINNA.pauseNightSound()" : "NINNA.resumeNightSound()"}" aria-label="${sound.playing ? t("night_pause") : t("night_resume")}">${sound.playing ? PAUSE_ICON : PLAY_ICON}</button>
    </div>
    ${sound.playing && sound.startedAt ? `<div class="ns-elapsed">${elapsedLabel(Date.now() - sound.startedAt)}</div>` : ""}` : `<button class="night-sound ns-empty" onclick="NINNA.toggleNightSoundList()">${PLAY_ICON}<span>${t("tab_suoni")}</span></button>`}
    <div class="night-head">
      <div class="night-status">${status}</div>
      ${active ? `<div class="night-timer">${fmtDur(Date.now() - active.start)}</div>` : ""}
    </div>
    ${big}
    <div class="night-secondary">
      <button onclick="NINNA.logInstant('breast')"><span class="night-circle">${TYPE_ICONS.breast}</span><span class="night-lbl">${typeLabel("breast")}</span></button>
      <button onclick="NINNA.logInstant('bottle')"><span class="night-circle">${TYPE_ICONS.bottle}</span><span class="night-lbl">${typeLabel("bottle")}</span></button>
    </div>
    <div class="night-caption">${t("night_caption")}</div>
  </div>`;
}

function renderOnboarding() {
  return `<div class="onboard">
    <img class="brandmark" src="icons/brandmark.png" alt="Ninna">
    <h1>Ninna</h1>
    <p class="dim">${t("ob_title_sub")}<br>${t("ob_sub2")}</p>
    <label class="field"><span>${t("ob_name")}</span>
      <input id="ob-name" placeholder="${t("ob_name_ph")}"></label>
    <label class="field"><span>${t("ob_birth")}</span>
      <input id="ob-birth" type="date"></label>
    <button class="primary block" onclick="NINNA.saveBaby()">${t("ob_start")}</button>
  </div>` + footerHTML("onboarding");
}


/* ---------- riepilogo per il pediatra: schermata in-app ----------
   Vive dentro l'app, non in una scheda separata: niente window.open, niente
   popup, niente Blob. window.print() e' chiamato sulla finestra principale,
   che esiste sempre. La regola @media print isola solo questo contenuto
   sulla pagina stampata, forzando colori chiari a prescindere dal tema. */
function reportContentHTML(days = 14) {
  const b = store.baby;
  const rows = [];
  let sumDay = 0, sumNight = 0, sumNaps = 0, sumWakes = 0, sumFeeds = 0, sumDiapers = 0, counted = 0;
  const hm = (m) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;
  for (let i = days - 1; i >= 0; i--) {
    const ts = Date.now() - i * 86400000;
    const st = dailyStats(store.events, ts, profileFor(b.birth, ts));
    if (st.totalMinutes === 0 && st.feeds === 0 && st.diapers === 0) continue;
    counted++;
    sumDay += st.napMinutes; sumNight += st.nightMinutes; sumNaps += st.naps;
    sumWakes += st.nightWakes; sumFeeds += st.feeds; sumDiapers += st.diapers;
    rows.push(`<tr>
      <td>${new Date(ts).toLocaleDateString(LOCALE(), { day: "2-digit", month: "2-digit" })}</td>
      <td>${hm(st.napMinutes)}</td><td>${hm(st.nightMinutes)}</td><td><b>${hm(st.totalMinutes)}</b></td>
      <td>${st.naps}</td><td>${st.nightWakes}</td><td>${st.feeds}</td><td>${st.diapers}</td>
    </tr>`);
  }
  const n = Math.max(1, counted);
  const pr = profileFor(b.birth);
  const w = Math.floor(ageWeeks(b.birth));
  const cutoff = Date.now() - days * 86400000;
  const healthList = (ty) => {
    const evs = store.events.filter((e) => e.type === ty && e.at >= cutoff);
    if (!evs.length) return null;
    const byName = {};
    evs.forEach((e) => { const k = e.note || "-"; byName[k] = (byName[k] || 0) + 1; });
    return Object.entries(byName).map(([k, n]) => `${esc(k)} (${n})`).join(", ");
  };
  const vitL = healthList("vitamins"), medL = healthList("med");
  const vit = store.events.filter((e) => e.type === "vitamins" && e.at >= cutoff).length;
  const med = store.events.filter((e) => e.type === "med" && e.at >= cutoff).length;
  return `
    <div class="about-title" style="font-size:26px">${t("report_title")}</div>
    <div class="report-meta">
      <b>${t("report_child")}:</b> ${esc(b.name)} · <b>${t("report_age")}:</b> ${w} ${t("u_weeks")}<br>
      <b>${t("report_period")}:</b> ${counted} ${t("u_days")} · <b>${t("report_generated")}:</b> ${new Date().toLocaleString(LOCALE())}<br>
      ${t("stat_target", { lo: pr.total[0], hi: pr.total[1], nlo: pr.naps[0], nhi: pr.naps[1] })}
    </div>
    <table class="report-table">
      <thead><tr>
        <th>${t("report_day")}</th><th>${t("report_daysleep")}</th><th>${t("report_nightsleep")}</th>
        <th>${t("report_tot")}</th><th>${t("report_naps")}</th><th>${t("report_wakes")}</th>
        <th>${t("report_feeds")}</th><th>${t("report_diapers")}</th>
      </tr></thead>
      <tbody>${rows.join("")}</tbody>
      <tfoot><tr>
        <td>${t("report_avg")}</td><td>${hm(sumDay / n)}</td><td>${hm(sumNight / n)}</td>
        <td>${hm((sumDay + sumNight) / n)}</td><td>${(sumNaps / n).toFixed(1)}</td>
        <td>${(sumWakes / n).toFixed(1)}</td><td>${(sumFeeds / n).toFixed(1)}</td><td>${(sumDiapers / n).toFixed(1)}</td>
      </tr></tfoot>
    </table>
    ${vit + med > 0 ? `<div class="report-meta" style="margin-top:12px"><b>${t("report_health")}</b><br>
      ${vitL ? `${typeLabel("vitamins")}: ${vitL}<br>` : ""}${medL ? `${typeLabel("med")}: ${medL}` : ""}</div>` : ""}
    ${store.growth.length ? `<div class="report-meta" style="margin-top:12px"><b>${t("report_growth")}</b>${b.sex ? ` · ${b.sex === "m" ? t("growth_male") : t("growth_female")}` : ""}<br>
      ${[...store.growth].sort((a, b2) => a.date.localeCompare(b2.date)).map((g) => `${new Date(g.date + "T00:00:00").toLocaleDateString(LOCALE())}: ${growthSummary(g)}`).join("<br>")}</div>` : ""}
    <p class="about-p" style="margin-top:16px">${t("report_note")}<br>${t("stat_variability")}</p>`;
}

/* ---------- schermata Crescita: peso, altezza, circonferenza cranica.
   Niente curve, niente percentili, nessun confronto con popolazioni di
   riferimento: solo l'andamento del proprio bambino nel tempo. ---------- */
function growthSummary(g) {
  const parts = [];
  if (g.weight) parts.push(`${g.weight} kg`);
  if (g.height) parts.push(`${g.height} cm`);
  if (g.head) parts.push(`${t("growth_head_short")} ${g.head} cm`);
  return parts.join(" · ");
}
function renderGrowth() {
  const list = [...store.growth].sort((a, b) => b.date.localeCompare(a.date));
  const trend = [...store.growth].filter((g) => g.weight).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
  const maxW = Math.max(1, ...trend.map((g) => g.weight));
  const b = store.baby;
  $modal.innerHTML = `<div class="about-overlay">
    <button class="ghost about-back" onclick="NINNA.closeGrowth()">←</button>
    <div class="about-scroll">
      <div class="about-title" style="font-size:26px">${t("growth")}</div>
      <div class="report-meta" style="margin-bottom:18px">
        <span>${t("growth_sex")}:</span>
        <div class="langpill" style="display:inline-flex;margin-left:8px;vertical-align:middle">
          <button class="langopt ${b.sex === "m" ? "on" : ""}" onclick="NINNA.setSex('m')">${t("growth_male")}</button>
          <button class="langopt ${b.sex === "f" ? "on" : ""}" onclick="NINNA.setSex('f')">${t("growth_female")}</button>
        </div>
      </div>

      ${trend.length >= 2 ? `<div class="card-title" style="font-size:15px">${t("growth_trend")}</div>
      <div class="bars" style="margin-bottom:18px">${trend.map((g) => `
        <div class="barcol">
          <div class="barval">${g.weight}</div>
          <div class="bar" style="height:${(g.weight / maxW) * 75}%"></div>
          <div class="barlabel">${new Date(g.date + "T00:00:00").toLocaleDateString(LOCALE(), { day: "2-digit", month: "2-digit" })}</div>
        </div>`).join("")}</div>` : ""}

      <button class="link block" onclick="NINNA.toggleGrowthForm()">${showGrowthForm ? t("close") : t("growth_add")}</button>
      ${showGrowthForm ? `<div class="card">
        <label class="field"><span>${t("growth_date")}</span><input type="date" id="g-date" value="${localTodayISO()}"></label>
        <div class="row2">
          <label class="field"><span>${t("growth_weight")}</span><input type="number" step="0.01" min="0" id="g-weight" placeholder="—"></label>
          <label class="field"><span>${t("growth_height")}</span><input type="number" step="0.1" min="0" id="g-height" placeholder="—"></label>
        </div>
        <label class="field"><span>${t("growth_head")}</span><input type="number" step="0.1" min="0" id="g-head" placeholder="—"></label>
        <div class="dim small" style="margin:6px 0 10px">${t("growth_save_hint")}</div>
        <button class="secondary block" onclick="NINNA.saveGrowth()">${t("save")}</button>
      </div>` : ""}

      <div class="card-title" style="font-size:15px;margin-top:8px">${t("growth_history")}</div>
      ${list.length === 0 ? `<div class="dim">${t("growth_none")}</div>` : list.map((g) => `
        <div class="logrow">
          <span class="loglabel">${new Date(g.date + "T00:00:00").toLocaleDateString(LOCALE(), { day: "2-digit", month: "short", year: "numeric" })}</span>
          <span class="logtime">${growthSummary(g)}</span>
          <button class="del" onclick="NINNA.deleteGrowth('${g.id}')">✕</button>
        </div>`).join("")}
    </div>
  </div>`;
}

function renderReport() {
  $modal.innerHTML = `<div class="about-overlay report-overlay" id="print-area">
    <button class="ghost about-back no-print" onclick="NINNA.closeReport()">←</button>
    <button class="report-print-btn no-print" onclick="window.print()">${t("report_print")}</button>
    <div class="about-scroll">${reportContentHTML(14)}</div>
  </div>`;
}

function renderAbout() {
  $modal.innerHTML = `<div class="about-overlay">
    <button class="ghost about-back" onclick="NINNA.closeAbout()">←</button>
    <div class="about-scroll">
      <div class="about-title">Ninna<span class="about-dot">.</span></div>
      <p class="about-tagline">${t("ob_title_sub")}</p>
      <div class="langpill about-langpill">
        <button class="langopt ${lang === "it" ? "on" : ""}" onclick="NINNA.setLang('it')">ITALIANO</button>
        <button class="langopt ${lang === "en" ? "on" : ""}" onclick="NINNA.setLang('en')">ENGLISH</button>
      </div>
      ${I18N[lang].about.map((p) => `<p class="about-p">${p}</p>`).join("")}
      <div class="hairline"></div>
      <a class="coffee about-coffee" href="${KOFI}" target="_blank" rel="noopener">${CUP}<span>${t("coffee")}</span></a>
      <div class="finelines">${t("footer2")} · ${githubLink()}</div>
    </div>
  </div>`;
}

function renderDoseReminder(name) {
  const d = doseReminders().find((x) => x.name === name);
  if (!d) return;
  const ready = d.due <= Date.now();
  $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.closeSettings()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="card-title">${TYPE_ICONS.med} ${esc(name)}</div>
      <div class="dim small" style="margin-bottom:14px">${t("dose_last_at", { time: fmtHM(d.lastAt) })}</div>
      <div class="hero-sub" style="margin-bottom:18px">${ready
        ? t("dose_ready", { name: esc(name) })
        : t("dose_next", { name: esc(name), time: fmtHM(d.due) })}</div>
      <button class="secondary block" onclick="NINNA.logDoseAgain(${esc(JSON.stringify(name))}, true)">${t("dose_log_repeat", { h: d.repeatH })}</button>
      <button class="link block" onclick="NINNA.logDoseAgain(${esc(JSON.stringify(name))}, false)">${t("dose_log_stop")}</button>
      <button class="link block" onclick="NINNA.closeSettings()">${t("close")}</button>
    </div>
  </div>`;
}

function renderProfileEdit() {
  const b = store.baby;
  $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.closeProfile()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="card-title">${t("profile_title")}</div>
      <label class="field"><span>${t("profile_name")}</span>
        <input id="p-name" value="${esc(b.name)}" maxlength="40" autocomplete="off"></label>
      <label class="field"><span>${t("profile_birth")}</span>
        <input type="date" id="p-birth" value="${b.birth}" max="${localTodayISO()}"></label>
      <div class="dim small" style="margin:2px 0 12px">${t("profile_birth_hint")}</div>
      <button class="secondary block" onclick="NINNA.saveProfile()">${t("save")}</button>
      <button class="link block" onclick="NINNA.closeProfile()">${t("close")}</button>
    </div>
  </div>`;
  const el = document.getElementById("p-name");
  if (el) el.focus();
}

function renderSettings() {
  const b = store.baby;
  $modal.innerHTML = `<div class="modal-wrap" onclick="NINNA.closeSettings()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="card-title">${t("settings")}</div>
      <div class="dim small" style="opacity:.6">Ninna v${APP_VERSION}</div>
      <button class="dim small profile-edit" onclick="NINNA.openProfile()">${t("profile_line", { name: esc(b.name), date: new Date(b.birth + "T00:00:00").toLocaleDateString(LOCALE()), w: Math.floor(ageWeeks(b.birth)) })} ${EDIT_ICON}</button>
      <div class="langrow inmodal">
        <span class="langlabel">${t("appearance").toUpperCase()}</span>
        <div class="langpill theme3">
          <button class="langopt ${theme === "light" ? "on" : ""}" onclick="NINNA.setTheme('light')">${t("theme_light")}</button>
          <button class="langopt ${theme === "dark" ? "on" : ""}" onclick="NINNA.setTheme('dark')">${t("theme_dark")}</button>
          <button class="langopt ${theme === "auto" ? "on" : ""}" onclick="NINNA.setTheme('auto')">${t("theme_auto")}</button>
        </div>
      </div>
      <div class="langrow inmodal">
        <span class="langlabel">${t("language").toUpperCase()}</span>
        <div class="langpill">
          <button class="langopt ${lang === "it" ? "on" : ""}" onclick="NINNA.setLang('it')">IT</button>
          <button class="langopt ${lang === "en" ? "on" : ""}" onclick="NINNA.setLang('en')">EN</button>
        </div>
      </div>
      <button class="secondary block" onclick="NINNA.exportJSONFile()">${t("backup_json")}</button>
      <label class="secondary block" style="cursor:pointer">${t("import_json")}
        <input type="file" accept="application/json" hidden onchange="NINNA.importJSONFile(this)">
      </label>
      <button class="secondary block" onclick="NINNA.exportCSVFile()">${t("export_csv")}</button>
      ${logOnly ? "" : `<button class="secondary block" onclick="NINNA.openReport()">${t("report")}</button>`}
      <div class="logonly-row">
        <button class="secondary block" style="margin:0" onclick="NINNA.toggleLogOnly()">${logOnly ? "◉ " : "○ "}${t("logonly")}</button>
        <div class="dim small">${t("logonly_desc")}</div>
      </div>
      <button class="danger block" onclick="NINNA.wipe()">${t("wipe")}</button>
      <button class="link block" onclick="NINNA.closeSettings()">${t("close")}</button>
    </div>
  </div>`;
}

/* ---------- render principale ---------- */
function render() {
  document.documentElement.lang = lang;
  if (!store.baby) {
    $app.innerHTML = renderOnboarding();
    $tabbar.innerHTML = "";
    return;
  }
  const f = forecast({ birthISO: store.baby.birth, events: store.events });
  if (nightMode) {
    $app.innerHTML = renderNightMode(f);
    $tabbar.innerHTML = "";
    return;
  }
  scheduleNotifications([
    ...f.notifications,
    ...doseReminders().map((d) => ({ id: "dose:" + d.name, at: d.due, name: d.name })),
  ]);

  const w = ageWeeks(store.baby.birth);
  const ageLabel = w < 5 ? `${Math.round(w * 7)} ${t("u_days")}` : `${Math.floor(w / 4.345)} ${t("u_months")}`;

  if (logOnly && view === "stat") view = "oggi";
  let body = "";
  if (view === "oggi") body = renderOggi(f);
  if (view === "stat") body = renderStat(f);
  if (view === "suoni") body = renderSuoni();
  if (view === "guida") body = renderGuida();

  $app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="wordmark">Ninna<span class="wm-dot">.</span></div>
        ${view === "oggi" ? `<button class="about-link" onclick="NINNA.openAbout()">${t("about_link")}</button>` : ""}
        <button class="babyname babyname-tap" onclick="NINNA.openProfile('oggi')">${esc(store.baby.name)}<span class="agechip">${ageLabel}</span><span class="name-edit">${EDIT_ICON}</span></button>
      </div>
      <div class="topbar-actions">
        ${view === "oggi" ? `<button class="nightbtn" onclick="NINNA.toggleNightMode()">${TYPE_ICONS.night} ${t("night_btn")}</button>` : ""}
        <button class="ghost" onclick="NINNA.openSettings()">⋯</button>
      </div>
    </header>
    ${body}
    ${view === "guida" ? footerHTML("full") : ""}`;

  const tabs = logOnly
    ? [["oggi", t("tab_oggi")], ["suoni", t("tab_suoni")], ["guida", t("tab_guida")]]
    : [["oggi", t("tab_oggi")], ["stat", t("tab_stat")], ["suoni", t("tab_suoni")], ["guida", t("tab_guida")]];
  $tabbar.innerHTML = tabs
    .map(([id, label]) => `<button class="tab ${view === id ? "active" : ""}" onclick="NINNA.setView('${id}')">${label}</button>`)
    .join("");

  updateMiniPlayer();
}

/* ---------- scorciatoie da long-press sull'icona ---------- */
function handleShortcut() {
  const azione = new URLSearchParams(location.search).get("azione");
  if (!azione) return;
  // ripulisce subito l'URL: un refresh non deve registrare un secondo sonno
  history.replaceState(null, "", location.pathname);
  if (!store.baby) return;                       // profilo non ancora creato
  const active = store.events.find((e) => (e.type === "nap" || e.type === "night") && !e.end);
  if (active) return toast(typeLabel(active.type) + " · " + t("in_progress"));
  const kind = azione === "nanna" ? "night" : azione === "pisolino" ? "nap" : null;
  if (kind) NINNA.startSleep(kind);
}

applyTheme();
handleShortcut();
render();
setInterval(() => {
  const tag = document.activeElement && document.activeElement.tagName;
  const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
  // il contatore "in riproduzione da..." vive anche sulla scheda Suoni, non
  // solo su Oggi: senza questo secondo caso resterebbe fermo al valore di
  // quando la scheda e' stata aperta
  const onOggi = view === "oggi" && !$modal.innerHTML && !showManual;
  const onSuoni = view === "suoni" && sound.playing;
  if ((onOggi || onSuoni) && !typing) render();
}, 30000);
