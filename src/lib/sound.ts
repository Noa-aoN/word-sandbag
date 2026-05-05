import type { ImpactKind, PunchPower } from "../types/punch";
import catMeowSrc from "../assets/sandbag/cat-meow.mp3";

type AnyWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let catMeowBuf: AudioBuffer | null = null;
let catMeowLoading = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const w = window as AnyWindow;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

function ensureRunning(c: AudioContext) {
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }
  loadCatMeow(c);
}

function loadCatMeow(c: AudioContext) {
  if (catMeowBuf || catMeowLoading) return;
  catMeowLoading = true;
  fetch(catMeowSrc)
    .then((r) => r.arrayBuffer())
    .then((buf) => c.decodeAudioData(buf))
    .then((decoded) => {
      catMeowBuf = decoded;
    })
    .finally(() => {
      catMeowLoading = false;
    });
}

function getMaster(c: AudioContext): GainNode {
  if (masterGain && masterGain.context === c) return masterGain;
  const master = c.createGain();
  master.gain.value = 0.7;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -8;
  comp.knee.value = 6;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.12;
  master.connect(comp);
  comp.connect(c.destination);
  masterGain = master;
  return master;
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuf = buf;
  return buf;
}

function noiseSourceWithOffset(c: AudioContext): { node: AudioBufferSourceNode; offset: number } {
  const node = c.createBufferSource();
  const buf = getNoiseBuffer(c);
  node.buffer = buf;
  const maxOffset = Math.max(0, buf.duration - 0.06);
  return { node, offset: Math.random() * maxOffset };
}

type PunchProfile = {
  bodyFreqStart: number;
  bodyFreqEnd: number;
  bodyDur: number;
  bodyVol: number;
  subFreqStart: number;
  subFreqEnd: number;
  subDur: number;
  subVol: number;
  slapBP: number;
  slapBPQ: number;
  slapDur: number;
  slapVol: number;
  clickVol: number;
  clickDur: number;
};

const PUNCH_PROFILE: Record<PunchPower, PunchProfile> = {
  light: {
    bodyFreqStart: 180,
    bodyFreqEnd: 80,
    bodyDur: 0.14,
    bodyVol: 0.22,
    subFreqStart: 70,
    subFreqEnd: 40,
    subDur: 0.1,
    subVol: 0.1,
    slapBP: 1900,
    slapBPQ: 1.4,
    slapDur: 0.038,
    slapVol: 0.11,
    clickVol: 0.05,
    clickDur: 0.012,
  },
  normal: {
    bodyFreqStart: 140,
    bodyFreqEnd: 55,
    bodyDur: 0.2,
    bodyVol: 0.3,
    subFreqStart: 55,
    subFreqEnd: 32,
    subDur: 0.16,
    subVol: 0.16,
    slapBP: 1450,
    slapBPQ: 1.6,
    slapDur: 0.045,
    slapVol: 0.14,
    clickVol: 0.06,
    clickDur: 0.013,
  },
  heavy: {
    bodyFreqStart: 100,
    bodyFreqEnd: 38,
    bodyDur: 0.32,
    bodyVol: 0.34,
    subFreqStart: 45,
    subFreqEnd: 26,
    subDur: 0.24,
    subVol: 0.22,
    slapBP: 1100,
    slapBPQ: 1.8,
    slapDur: 0.055,
    slapVol: 0.18,
    clickVol: 0.07,
    clickDur: 0.014,
  },
};

function playNoiseLayer(
  c: AudioContext,
  master: GainNode,
  now: number,
  filter: BiquadFilterNode,
  vol: number,
  attack: number,
  dur: number,
) {
  const { node, offset } = noiseSourceWithOffset(c);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  node.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  node.start(now, offset);
  node.stop(now + dur + 0.01);
}

function playToneLayer(
  c: AudioContext,
  master: GainNode,
  now: number,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  vol: number,
  attack: number,
  dur: number,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function thumpInto(
  c: AudioContext,
  master: GainNode,
  now: number,
  cfg: PunchProfile,
) {
  playToneLayer(c, master, now, "sine", cfg.bodyFreqStart, cfg.bodyFreqEnd, cfg.bodyVol, 0.006, cfg.bodyDur);
  playToneLayer(c, master, now, "sine", cfg.subFreqStart, cfg.subFreqEnd, cfg.subVol, 0.012, cfg.subDur);

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(cfg.slapBP, now);
  bp.Q.setValueAtTime(cfg.slapBPQ, now);
  playNoiseLayer(c, master, now, bp, cfg.slapVol, 0.003, cfg.slapDur);

  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(3500, now);
  playNoiseLayer(c, master, now, hp, cfg.clickVol, 0.001, cfg.clickDur);
}

function thump(power: PunchPower) {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;
  thumpInto(c, master, now, PUNCH_PROFILE[power]);
}

function meow() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  if (!catMeowBuf) return;

  const node = c.createBufferSource();
  node.buffer = catMeowBuf;
  node.playbackRate.value = 0.94 + Math.random() * 0.16;

  const cap = Math.min(catMeowBuf.duration, 1.6);
  const playDur = cap / node.playbackRate.value;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.012);
  gain.gain.setValueAtTime(0.7, now + Math.max(0, playDur - 0.18));
  gain.gain.exponentialRampToValueAtTime(0.0006, now + playDur);

  node.connect(gain);
  gain.connect(master);
  node.start(now, 0, cap);
  node.stop(now + playDur + 0.05);
}

function softTone(
  c: AudioContext,
  destination: AudioNode,
  type: OscillatorType,
  freq: number,
  vol: number,
  startAt: number,
  attackSec: number,
  durSec: number,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(vol, startAt + attackSec);
  gain.gain.exponentialRampToValueAtTime(0.0006, startAt + durSec);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(startAt);
  osc.stop(startAt + durSec + 0.02);
}

function hugChord() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  // Heavier lowpass + gentler bus for a hazier, pillowy chord
  const bus = c.createGain();
  bus.gain.value = 0.6;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, now);
  lp.Q.setValueAtTime(0.5, now);
  bus.connect(lp);
  lp.connect(master);

  // Slow-blooming pad with longer attacks and lower volumes
  softTone(c, bus, "sine", 196.0, 0.04, now, 0.7, 2.0); // G3 sub
  softTone(c, bus, "sine", 392.0, 0.05, now, 0.65, 2.0); // G4 root
  softTone(c, bus, "sine", 493.88, 0.035, now + 0.18, 0.7, 1.7); // B4 third
  softTone(c, bus, "sine", 587.33, 0.025, now + 0.3, 0.7, 1.5); // D5 fifth

  // Warm triangle breath under the chord
  softTone(c, bus, "triangle", 98.0, 0.022, now, 0.75, 1.9); // G2 deep
}

function hookSwing() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  thumpInto(c, master, now, {
    bodyFreqStart: 120,
    bodyFreqEnd: 42,
    bodyDur: 0.28,
    bodyVol: 0.34,
    subFreqStart: 50,
    subFreqEnd: 28,
    subDur: 0.22,
    subVol: 0.22,
    slapBP: 1300,
    slapBPQ: 1.7,
    slapDur: 0.07,
    slapVol: 0.2,
    clickVol: 0.06,
    clickDur: 0.014,
  });

  const swoosh = noiseSourceWithOffset(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(2400, now);
  bp.frequency.exponentialRampToValueAtTime(900, now + 0.1);
  bp.Q.setValueAtTime(1.2, now);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.11);
  swoosh.node.connect(bp);
  bp.connect(gain);
  gain.connect(master);
  swoosh.node.start(now, swoosh.offset);
  swoosh.node.stop(now + 0.13);
}

function upperLift() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  thumpInto(c, master, now, {
    bodyFreqStart: 80,
    bodyFreqEnd: 32,
    bodyDur: 0.34,
    bodyVol: 0.36,
    subFreqStart: 38,
    subFreqEnd: 22,
    subDur: 0.28,
    subVol: 0.26,
    slapBP: 900,
    slapBPQ: 1.4,
    slapDur: 0.05,
    slapVol: 0.14,
    clickVol: 0.05,
    clickDur: 0.012,
  });
}

export function playErupt() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  // Phase 1: heavy break thud (chain snaps, bag tears off)
  thumpInto(c, master, now, {
    bodyFreqStart: 110,
    bodyFreqEnd: 28,
    bodyDur: 0.45,
    bodyVol: 0.4,
    subFreqStart: 48,
    subFreqEnd: 22,
    subDur: 0.4,
    subVol: 0.3,
    slapBP: 1000,
    slapBPQ: 2.2,
    slapDur: 0.08,
    slapVol: 0.22,
    clickVol: 0.1,
    clickDur: 0.02,
  });

  // Metallic crack of the chain
  {
    const { node, offset } = noiseSourceWithOffset(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(3800, now);
    bp.Q.setValueAtTime(4, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.07);
    node.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    node.start(now, offset);
    node.stop(now + 0.09);
  }

  // Phase 2: whoosh as the bag spins off-screen
  const whooshAt = now + 0.08;

  {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(820, whooshAt);
    osc.frequency.exponentialRampToValueAtTime(180, whooshAt + 1.0);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, whooshAt);
    gain.gain.linearRampToValueAtTime(0.07, whooshAt + 0.06);
    gain.gain.linearRampToValueAtTime(0.05, whooshAt + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0008, whooshAt + 1.15);
    osc.connect(gain);
    gain.connect(master);
    osc.start(whooshAt);
    osc.stop(whooshAt + 1.2);
  }

  {
    const { node, offset } = noiseSourceWithOffset(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2200, whooshAt);
    bp.frequency.exponentialRampToValueAtTime(380, whooshAt + 1.0);
    bp.Q.setValueAtTime(2.4, whooshAt);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, whooshAt);
    gain.gain.linearRampToValueAtTime(0.14, whooshAt + 0.08);
    gain.gain.linearRampToValueAtTime(0.09, whooshAt + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0008, whooshAt + 1.15);
    node.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    node.start(whooshAt, offset);
    node.stop(whooshAt + 1.2);
  }
}

export function playClank() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const master = getMaster(c);
  const now = c.currentTime;

  // First strike: hard metallic hit (carabiner closes onto the hook)
  {
    const { node, offset } = noiseSourceWithOffset(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(4200, now);
    bp.Q.setValueAtTime(5, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);
    node.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    node.start(now, offset);
    node.stop(now + 0.1);
  }

  // Tonal ring of the metal ring/chain link
  const ringTones: Array<[number, number]> = [
    [1480, 0.18],
    [2360, 0.14],
    [3120, 0.1],
  ];
  for (const [freq, vol] of ringTones) {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0006, now + 0.42);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Low body thunk (the bag's weight settling on the chain)
  {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Second tap a hair later (chain link settles)
  const tapAt = now + 0.05;
  {
    const { node, offset } = noiseSourceWithOffset(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(3200, tapAt);
    bp.Q.setValueAtTime(3.5, tapAt);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, tapAt);
    gain.gain.linearRampToValueAtTime(0.12, tapAt + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0006, tapAt + 0.07);
    node.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    node.start(tapAt, offset);
    node.stop(tapAt + 0.08);
  }
}

export function playImpact(kind: ImpactKind, power: PunchPower) {
  switch (kind) {
    case "cat":
      meow();
      return;
    case "crunch":
      hugChord();
      return;
    case "tap":
      thump("light");
      return;
    case "hook":
      hookSwing();
      return;
    case "upper":
      upperLift();
      return;
    case "punch":
    default:
      thump(power);
  }
}

export function primeAudio() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  getMaster(c);
}
