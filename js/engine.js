/* ============================================================
   NINNA ENGINE · modelli di calcolo del sonno neonatale
   ES module puro, zero dipendenze, testabile in isolamento.
   Tutte le durate interne sono in MINUTI, i tempi in ms epoch.
   ============================================================ */

/* ------------------------------------------------------------
   1. PROFILI PER ETÀ
   Fasce costruite sulle raccomandazioni pediatriche standard
   (range di sonno totale National Sleep Foundation; finestre di
   veglia e numero pisolini da letteratura divulgativa clinica).
   ------------------------------------------------------------ */
export const AGE_PROFILES = [
  //        settimane  finestra veglia   pisolini   sonno giorno  sonno notte  totale24h   nanna serale
  { maxWeeks: 4,   ww: [45, 60],   naps: [4, 6], day: [4, 8],  night: [8, 9],  total: [14, 17], bedtime: ["20:00", "22:00"] },
  { maxWeeks: 8,   ww: [45, 75],   naps: [4, 5], day: [4, 7],  night: [8, 10], total: [14, 17], bedtime: ["20:00", "21:30"] },
  { maxWeeks: 13,  ww: [60, 90],   naps: [4, 5], day: [4, 6],  night: [9, 10], total: [14, 17], bedtime: ["19:30", "21:00"] },
  { maxWeeks: 17,  ww: [75, 105],  naps: [3, 4], day: [3.5, 5],night: [10, 11],total: [12, 16], bedtime: ["19:00", "20:30"] },
  { maxWeeks: 26,  ww: [90, 150],  naps: [3, 4], day: [3, 4],  night: [10, 11],total: [12, 15], bedtime: ["19:00", "20:00"] },
  { maxWeeks: 39,  ww: [120, 180], naps: [2, 3], day: [2.5, 4],night: [10, 12],total: [12, 15], bedtime: ["19:00", "20:00"] },
  { maxWeeks: 52,  ww: [150, 210], naps: [2, 2], day: [2, 3],  night: [10, 12],total: [12, 15], bedtime: ["19:00", "20:00"] },
  { maxWeeks: 78,  ww: [180, 270], naps: [1, 2], day: [1.5, 3],night: [10, 12],total: [11, 14], bedtime: ["19:00", "20:00"] },
  { maxWeeks: 156, ww: [240, 330], naps: [1, 1], day: [1, 2.5],night: [10, 12],total: [11, 14], bedtime: ["19:00", "20:30"] },
];

/** Età in settimane compiute da una data ISO (YYYY-MM-DD). */
export function ageWeeks(birthISO, now = Date.now()) {
  const b = new Date(birthISO + "T00:00:00").getTime();
  return Math.max(0, (now - b) / (7 * 86400000));
}

/** Profilo di riferimento per l'età. */
export function profileFor(birthISO, now = Date.now()) {
  const w = ageWeeks(birthISO, now);
  return (
    AGE_PROFILES.find((p) => w < p.maxWeeks) ||
    AGE_PROFILES[AGE_PROFILES.length - 1]
  );
}

/* ------------------------------------------------------------
   2. MODELLO ADATTIVO DELLA FINESTRA DI VEGLIA
   - EMA (media mobile esponenziale, alpha 0.3) sugli intervalli
     veglia osservati, con clamp entro [0.75·min, 1.25·max] del
     profilo per impedire derive da dati sporchi.
   - Confidenza = n/6 (satura a 1): con pochi dati pesa il
     profilo, con molti dati pesa il bambino reale.
   - Correzione posizionale: la prima finestra del giorno è
     tipicamente più corta (×0.9), l'ultima più lunga (×1.1).
   ------------------------------------------------------------ */
const EMA_ALPHA = 0.3;
const MAX_SAMPLES = 10;

/**
 * Estrae gli intervalli di veglia (min) dai sonni conclusi.
 * @param {{start:number,end:number}[]} sleeps ordinabili, con end
 */
export function observedIntervals(sleeps) {
  const done = sleeps
    .filter((s) => s.end)
    .sort((a, b) => a.start - b.start);
  const out = [];
  for (let i = 0; i < done.length - 1; i++) {
    const gap = (done[i + 1].start - done[i].end) / 60000;
    if (gap > 20 && gap < 480) out.push(gap);
  }
  return out.slice(-MAX_SAMPLES);
}

export function emaOf(values, alpha = EMA_ALPHA) {
  if (!values.length) return null;
  return values.reduce((acc, v, i) => (i === 0 ? v : alpha * v + (1 - alpha) * acc));
}

/**
 * Finestra di veglia effettiva da usare per la previsione.
 * @returns {{minutes:number, source:'profilo'|'misto'|'osservato',
 *            confidence:number, defaultMid:number, observedEma:number|null}}
 */
export function effectiveWindow(profile, intervals, position = "mid") {
  const [lo, hi] = profile.ww;
  const defaultMid = (lo + hi) / 2;
  const ema = emaOf(intervals);
  const clamped = ema == null ? null : Math.min(hi * 1.25, Math.max(lo * 0.75, ema));
  const confidence = Math.min(1, intervals.length / 6);
  let minutes =
    clamped == null
      ? defaultMid
      : confidence * clamped + (1 - confidence) * defaultMid;
  if (position === "first") minutes *= 0.9;
  if (position === "last") minutes *= 1.1;
  return {
    minutes: Math.round(minutes),
    source: clamped == null ? "profilo" : confidence >= 0.9 ? "osservato" : "misto",
    confidence: +confidence.toFixed(2),
    defaultMid: Math.round(defaultMid),
    observedEma: clamped == null ? null : Math.round(clamped),
  };
}

/* ------------------------------------------------------------
   3. SWEET SPOT: la previsione è un intervallo, non un minuto.
   [-15, +10] min attorno alla finestra effettiva: mettere giù il
   bambino dentro questo intervallo massimizza le probabilità di
   addormentamento sereno.
   ------------------------------------------------------------ */
export function sweetSpot(lastWakeMs, windowMinutes) {
  const center = lastWakeMs + windowMinutes * 60000;
  return {
    from: center - 15 * 60000,
    to: center + 10 * 60000,
    center,
  };
}

/** Pressione del sonno: 0 = appena sveglio, 1 = finestra esaurita. */
export function sleepPressure(lastWakeMs, windowMinutes, now = Date.now()) {
  if (!lastWakeMs) return 0;
  return Math.max(0, Math.min(1.5, (now - lastWakeMs) / (windowMinutes * 60000)));
}

/* ------------------------------------------------------------
   4. PREVISIONE ORA DELLA NANNA SERALE
   Candidata = fine ultimo pisolino + ultima finestra (×1.1),
   poi clampata nel range del profilo. Se il sonno diurno è sotto
   il 75% del target minimo, si suggerisce il bordo anticipato
   (compensazione del debito di sonno con nanna anticipata, non
   posticipata: principio contro-intuitivo ma standard).
   ------------------------------------------------------------ */
function hmToMs(dayMs, hm) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(dayMs);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function bedtimePrediction(profile, lastNapEndMs, daySleepMinutes, intervals, now = Date.now()) {
  const [earlyHM, lateHM] = profile.bedtime;
  const early = hmToMs(now, earlyHM);
  const late = hmToMs(now, lateHM);
  const win = effectiveWindow(profile, intervals, "last").minutes;
  let candidate = lastNapEndMs ? lastNapEndMs + win * 60000 : (early + late) / 2;
  const dayDeficit = daySleepMinutes < profile.day[0] * 60 * 0.75;
  if (dayDeficit) candidate = Math.min(candidate, early);
  candidate = Math.max(early, Math.min(late, candidate));
  return {
    at: candidate,
    range: [early, late],
    earlier: dayDeficit,
  };
}

/* ------------------------------------------------------------
   5. STATISTICHE GIORNALIERE
   ------------------------------------------------------------ */
const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * @param {Array} events  sonni {type:'nap'|'night',start,end} e
 *                        istantanei {type,at}
 */
function overlapMinutes(start, end, dayStart, dayEnd) {
  const s = Math.max(start, dayStart), e = Math.min(end, dayEnd);
  return Math.max(0, (e - s) / 60000);
}

export function dailyStats(events, dateMs, profile) {
  const d0 = new Date(dateMs); d0.setHours(0, 0, 0, 0);
  const dayStart = d0.getTime(), dayEnd = dayStart + 86400000;
  const inDay = (ts) => ts >= dayStart && ts < dayEnd;
  const sleeps = events.filter((e) => (e.type === "nap" || e.type === "night") && e.end);
  // le sessioni vengono spezzate a mezzanotte: ogni giorno conta solo i minuti che gli appartengono
  const napMin = sleeps.filter((s) => s.type === "nap").reduce((a, s) => a + overlapMinutes(s.start, s.end, dayStart, dayEnd), 0);
  const nightMin = sleeps.filter((s) => s.type === "night").reduce((a, s) => a + overlapMinutes(s.start, s.end, dayStart, dayEnd), 0);
  const naps = sleeps.filter((s) => s.type === "nap" && inDay(s.start)).length;
  const feeds = events.filter((e) => ["breast", "bottle", "solid"].includes(e.type) && inDay(e.at));
  const feedTimes = feeds.map((f) => f.at).sort((a, b) => a - b);
  const feedGaps = feedTimes.slice(1).map((ts, i) => (ts - feedTimes[i]) / 60000);
  const diapers = events.filter((e) => e.type === "diaper" && inDay(e.at)).length;
  const nightWakes = events.filter((e) => e.type === "nightwake" && inDay(e.at)).length;
  const totalMin = napMin + nightMin;
  return {
    napMinutes: Math.round(napMin),
    nightMinutes: Math.round(nightMin),
    totalMinutes: Math.round(totalMin),
    naps,
    feeds: feeds.length,
    avgFeedGapMin: feedGaps.length ? Math.round(feedGaps.reduce((a, b) => a + b, 0) / feedGaps.length) : null,
    diapers,
    nightWakes,
    targets: {
      dayMin: profile.day.map((h) => h * 60),
      nightMin: profile.night.map((h) => h * 60),
      totalMin: profile.total.map((h) => h * 60),
      naps: profile.naps,
    },
    vsTotal:
      totalMin < profile.total[0] * 60 ? "sotto" : totalMin > profile.total[1] * 60 ? "sopra" : "in-range",
  };
}

/* ------------------------------------------------------------
   6. RILEVATORE DI TRANSIZIONE PISOLINI
   Se negli ultimi 7 giorni con dati la media dei pisolini è
   sotto il minimo del profilo E il totale di sonno resta in
   range, il bambino sta probabilmente abbandonando un pisolino:
   segnalazione informativa, non prescrittiva.
   ------------------------------------------------------------ */
export function napTransition(events, profile, now = Date.now()) {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const s = dailyStats(events, now - i * 86400000, profile);
    if (s.naps > 0 || s.totalMinutes > 0) days.push(s);
  }
  if (days.length < 4) return { detected: false, reason: "dati insufficienti" };
  const avgNaps = days.reduce((a, d) => a + d.naps, 0) / days.length;
  const inRange = days.filter((d) => d.vsTotal !== "sotto").length / days.length >= 0.6;
  const detected = avgNaps < profile.naps[0] - 0.3 && inRange;
  return {
    detected,
    avgNaps: +avgNaps.toFixed(1),
    expected: profile.naps,
    reason: detected
      ? "Media pisolini sotto il minimo atteso con sonno totale regolare: possibile transizione in corso."
      : "Nessuna transizione evidente.",
  };
}

/* ------------------------------------------------------------
   7. PIANIFICATORE NOTIFICHE
   Funzione pura: restituisce le notifiche da programmare; sarà
   il service worker della PWA a schedularle/mostrarle.
   ------------------------------------------------------------ */
export function notificationPlan({ nextNapAt, bedtimeAt, now = Date.now() }) {
  const plan = [];
  if (nextNapAt && nextNapAt - 30 * 60000 > now) plan.push({ id: "pre-nap", at: nextNapAt - 30 * 60000 });
  if (bedtimeAt && bedtimeAt - 45 * 60000 > now) plan.push({ id: "pre-bed", at: bedtimeAt - 45 * 60000 });
  return plan.sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------
   8. DECISIONE: IL PROSSIMO SONNO È PISOLINO O NANNA?
   Regola trasparente, in ordine di priorità:
   1. siamo già nell'orario della routine serale -> nanna
   2. pisolini di oggi >= massimo atteso per l'età -> nanna
   3. la prossima finestra sfocia nell'orario della nanna -> nanna
   4. altrimenti -> pisolino
   ------------------------------------------------------------ */
export function nextSleepKind({ profile, stats, bedtime, spotCenter, now = Date.now() }) {
  const h = new Date(now).getHours();
  if (h < 6) return { kind: "night", code: "night_hours", params: {} };
  const routineStart = bedtime.at - 45 * 60000;
  if (now >= routineStart) return { kind: "night", code: "routine", params: {} };
  if (stats.naps >= profile.naps[1]) return { kind: "night", code: "max_naps", params: { n: stats.naps } };
  if (spotCenter != null && spotCenter >= bedtime.range[0] - 30 * 60000)
    return { kind: "night", code: "window_into_night", params: {} };
  return stats.naps === 0
    ? { kind: "nap", code: "first_nap", params: {} }
    : { kind: "nap", code: "nap_n", params: { n: stats.naps + 1, lo: profile.naps[0], hi: profile.naps[1] } };
}

/* ------------------------------------------------------------
   9. RIEPILOGO PREVISIONALE UNICO (facade per la UI)
   ------------------------------------------------------------ */
export function forecast({ birthISO, events, now = Date.now() }) {
  const profile = profileFor(birthISO, now);
  const sleeps = events.filter((e) => e.type === "nap" || e.type === "night");
  const intervals = observedIntervals(sleeps);
  const ended = sleeps.filter((s) => s.end).sort((a, b) => b.end - a.end);
  const lastWake = ended.length ? ended[0].end : null;
  const napsToday = dailyStats(events, now, profile).naps;
  const position = napsToday === 0 ? "first" : "mid";
  const win = effectiveWindow(profile, intervals, position);
  const spot = lastWake ? sweetSpot(lastWake, win.minutes) : null;
  const lastNap = ended.find((s) => s.type === "nap") || null;
  const stats = dailyStats(events, now, profile);
  const bed = bedtimePrediction(profile, lastNap ? lastNap.end : null, stats.napMinutes, intervals, now);
  const next = nextSleepKind({ profile, stats, bedtime: bed, spotCenter: spot ? spot.center : null, now });
  return {
    profile,
    window: win,
    next,
    lastWake,
    sweetSpot: spot,
    pressure: lastWake ? sleepPressure(lastWake, win.minutes, now) : 0,
    bedtime: bed,
    stats,
    transition: napTransition(events, profile, now),
    notifications: notificationPlan({ nextNapAt: next.kind === "nap" && spot ? spot.center : null, bedtimeAt: bed.at, now }),
  };
}
