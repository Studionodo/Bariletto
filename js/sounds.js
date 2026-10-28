/* ============================================================
   NINNA SOUNDS · motore audio interamente sintetizzato, v2
   Ogni suono e' un buffer PCM generato al volo e messo in loop:
   niente file, niente rete. La v1 filtrava lo stesso rumore per
   tutti; qui ogni suono ha una firma propria.
   ============================================================ */

export const SOUNDS = ["white", "pink", "brown", "ocean", "rain", "heart", "shush"].map((id) => ({ id }));

const FADE_S = 1.2;

/* ---------- generatori (puri, testabili anche fuori dal browser) ---------- */

function crossfadeLoop(d, n) {
  // fonde coda e testa del buffer: il punto di loop diventa inudibile
  for (let i = 0; i < n; i++) {
    const k = i / n;
    d[d.length - n + i] = d[d.length - n + i] * (1 - k) + d[i] * k;
  }
}

function normalize(d, peak = 0.9) {
  let max = 0;
  for (let i = 0; i < d.length; i++) max = Math.max(max, Math.abs(d[i]));
  if (max > 0) { const g = peak / max; for (let i = 0; i < d.length; i++) d[i] *= g; }
}

function genWhite(sr) {
  const d = new Float32Array(sr * 8);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  crossfadeLoop(d, sr * 0.4); normalize(d); return d;
}

function genPink(sr) {
  // Voss-McCartney: pendenza -3 dB/ottava, il rumore "morbido" vero
  const d = new Float32Array(sr * 8);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  crossfadeLoop(d, sr * 0.4); normalize(d); return d;
}

function genBrown(sr) {
  const d = new Float32Array(sr * 8);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  crossfadeLoop(d, sr * 0.4); normalize(d); return d;
}

function genOcean(sr) {
  /* Due strati con timbro diverso, non un solo rumore alzato e abbassato:
     un rumore grave costante (la massa d'acqua) e una schiuma acuta filtrata
     che sale solo sulla cresta. Cosi' l'onda cambia colore mentre si rompe,
     come accade davvero, invece di essere una manopola del volume. */
  const DUR = 24, d = new Float32Array(sr * DUR);
  let deep = 0, foamLp = 0, foamHp = 0, prevFoam = 0;
  const aFoam = 1 - Math.exp(-2 * Math.PI * 3200 / sr);   // passa-basso sulla schiuma
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const w = Math.random() * 2 - 1;
    deep = (deep + 0.03 * w) / 1.03;                       // massa grave

    const swell = 0.55
      + 0.3 * Math.sin(2 * Math.PI * (2 / DUR) * t)
      + 0.15 * Math.sin(2 * Math.PI * (5 / DUR) * t + 1.3);

    const w2 = Math.random() * 2 - 1;
    foamLp += aFoam * (w2 - foamLp);                       // toglie il metallico
    foamHp = 0.97 * (foamHp + foamLp - prevFoam);          // toglie il rimbombo
    prevFoam = foamLp;

    const crest = Math.max(0, swell - 0.62) * 2.6;         // 0 fuori dalla cresta
    d[i] = deep * 3 * swell + foamHp * 0.5 * crest * crest;
  }
  crossfadeLoop(d, sr * 0.5); normalize(d); return d;
}

function genRain(sr) {
  /* Le gocce non sono impulsi di rumore bianco (che suonano come un "tic")
     ma sinusoidi smorzate a frequenze diverse: e' la risonanza che da' il
     "ploc". In piu' l'intensita' respira lentamente, perche' la pioggia
     vera non e' mai perfettamente costante. */
  const DUR = 16, d = new Float32Array(sr * DUR);
  let lp = 0;
  const alpha = 1 - Math.exp(-2 * Math.PI * 1400 / sr);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const w = Math.random() * 2 - 1;
    lp += alpha * (w - lp);
    // respiro: 3 cicli interi nella durata, cosi' il loop resta pulito
    const breath = 0.82 + 0.18 * Math.sin(2 * Math.PI * (3 / DUR) * t);
    d[i] = lp * 0.7 * breath;
  }
  const drops = Math.floor(DUR * 42);
  for (let k = 0; k < drops; k++) {
    // le gocce non devono iniziare cosi' vicino alla fine da restare tagliate
    // a meta': un decadimento troncato produce un clic a ogni ripetizione
    const maxDecay = sr * 0.0055, tail = Math.ceil(maxDecay * 5);
    const start = Math.floor(Math.random() * (d.length - tail));
    const freq = 900 + Math.random() * 2600;               // gocce di dimensioni diverse
    const decay = sr * (0.0015 + Math.random() * 0.004);
    const amp = 0.12 + Math.random() * 0.3;
    const len = Math.floor(decay * 5);
    for (let j = 0; j < len && start + j < d.length; j++) {
      d[start + j] += Math.sin(2 * Math.PI * freq * (j / sr)) * amp * Math.exp(-j / decay);
    }
  }
  crossfadeLoop(d, sr * 0.4); normalize(d); return d;
}

function genHeart(sr) {
  // il tu-tum vero: due impulsi bassi smorzati, ~64 bpm, loop esatto
  const PERIOD = 0.94, CYCLES = 4;
  const d = new Float32Array(Math.floor(sr * PERIOD * CYCLES));
  const thump = (at, freq, dur, amp) => {
    const s0 = Math.floor(at * sr), n = Math.floor(dur * sr);
    for (let j = 0; j < n; j++) {
      const t = j / sr;
      d[s0 + j] += amp * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / (dur * 0.32));
    }
  };
  for (let c = 0; c < CYCLES; c++) {
    const base = c * PERIOD;
    thump(base, 56, 0.11, 1);          // lub
    thump(base + 0.30, 44, 0.10, 0.72); // dub
  }
  normalize(d, 0.95); return d;
}

function genShush(sr) {
  // il gesto della voce: shhh... pausa... shhh, con respiro periodico
  const CYCLE = 1.8, CYCLES = 7;
  const d = new Float32Array(Math.floor(sr * CYCLE * CYCLES));
  for (let i = 0; i < d.length; i++) {
    const t = (i / sr) % CYCLE;
    const cyc = Math.floor(i / sr / CYCLE);
    let env = 0;
    if (t < 1.15) {
      const a = Math.min(1, t / 0.18);                   // attacco morbido
      const r = t > 0.85 ? Math.max(0, 1 - (t - 0.85) / 0.3) : 1; // rilascio
      env = a * r * (0.85 + 0.15 * Math.sin(cyc * 2.3)); // lieve varieta' tra i cicli
    }
    d[i] = (Math.random() * 2 - 1) * env;
  }
  crossfadeLoop(d, sr * 0.2); normalize(d); return d;
}

const GENERATORS = { white: genWhite, pink: genPink, brown: genBrown, ocean: genOcean, rain: genRain, heart: genHeart, shush: genShush };

// catena di filtri per suono: [tipo, frequenza, Q, lfoRate, lfoDepth]
const CHAINS = {
  white: [["lowpass", 7500, 0.7]],
  pink: [],
  brown: [],
  ocean: [["lowpass", 700, 0.8, 0.05, 160]],
  rain: [["lowpass", 5200, 0.7]],
  heart: [["lowpass", 210, 0.9]],
  shush: [["bandpass", 1250, 1.1, 0.32, 420]],
};

export function _gen(id, sr = 44100) { return GENERATORS[id](sr); } // per i test

/* ---------- motore ---------- */
export class SoundEngine {
  constructor() {
    this.ctx = null; this.master = null; this.source = null;
    this.playing = null; this.volume = 0.4;
    this._buffers = {}; this._nodes = []; this._timer = null;
  }
  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this._setupOutput();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  /* Uscita diretta agli altoparlanti: la strada semplice, quella che ha
     sempre funzionato. Fra la v1.8.0 e la v2.0.1 l'audio passava da un
     elemento <audio> alimentato da un MediaStream, per ottenere i controlli
     nella notifica di sistema. Su Android quella strada e' risultata muta:
     l'elemento dichiarava di essere in riproduzione (quindi nessun ripiego
     scattava) ma non usciva alcun suono. Abbandonata: meglio un suono che
     funziona senza controlli di sistema, che controlli senza suono.
     Il problema di ergonomia che voleva risolvere e' affrontato altrove,
     con un lettore compatto dentro l'app. */
  _setupOutput() {
    this.master.connect(this.ctx.destination);
  }
  _buffer(id) {
    if (!this._buffers[id]) {
      const sr = this.ctx.sampleRate;
      const data = GENERATORS[id](sr);
      const buf = this.ctx.createBuffer(1, data.length, sr);
      buf.copyToChannel(data, 0);
      this._buffers[id] = buf;
    }
    return this._buffers[id];
  }
  play(id) {
    this._ensure();
    if (this.playing === id) return this.stop();
    this._teardown();
    const src = this.ctx.createBufferSource();
    src.buffer = this._buffer(id);
    src.loop = true;
    let node = src;
    for (const [type, freq, q, lfoRate, lfoDepth] of CHAINS[id] || []) {
      const f = this.ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      if (lfoRate) {
        const lfo = this.ctx.createOscillator();
        const depth = this.ctx.createGain();
        lfo.frequency.value = lfoRate; depth.gain.value = lfoDepth;
        lfo.connect(depth); depth.connect(f.frequency); lfo.start();
        this._nodes.push(lfo, depth);
      }
      node.connect(f); node = f; this._nodes.push(f);
    }
    node.connect(this.master);
    src.start();
    this.source = src; this.playing = id; this.startedAt = Date.now();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0.0001, t);
    this.master.gain.exponentialRampToValueAtTime(Math.max(0.001, this.volume), t + FADE_S);
  }
  stop() {
    if (!this.ctx || !this.playing) return;
    this.startedAt = null;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, FADE_S / 3);
    const src = this.source, nodes = this._nodes;
    setTimeout(() => { try { src && src.stop(); } catch (e) {} nodes.forEach((n) => { try { n.disconnect(); } catch (e) {} }); }, FADE_S * 1000);
    this.source = null; this._nodes = []; this.playing = null;
    clearTimeout(this._timer); this._timer = null;
  }
  _teardown() {
    try { this.source && this.source.stop(); } catch (e) {}
    this._nodes.forEach((n) => { try { n.disconnect(); } catch (e) {} });
    this.source = null; this._nodes = [];
  }
  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.playing) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }
  sleepTimer(min) {
    clearTimeout(this._timer); this._timer = null;
    if (!min || !this.playing) return;
    this._timer = setTimeout(() => {
      if (!this.ctx || !this.playing) return;
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 10);
      setTimeout(() => this.stop(), 35000);
    }, min * 60000);
  }
}
