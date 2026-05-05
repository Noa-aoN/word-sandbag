import type { ImpactKind, PunchPower } from "../types/punch";

type AnyWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

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

  // Vocal source: sawtooth carries harmonics that pass through formant filters
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  // にゃーん contour: low → rise → dip → rise → fall
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.linearRampToValueAtTime(720, now + 0.08);
  osc.frequency.linearRampToValueAtTime(620, now + 0.18);
  osc.frequency.linearRampToValueAtTime(760, now + 0.3);
  osc.frequency.linearRampToValueAtTime(360, now + 0.46);

  // Two formant bandpasses simulate vocal tract (vowel-like)
  const f1 = c.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.setValueAtTime(900, now);
  f1.Q.setValueAtTime(4.5, now);

  const f2 = c.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.setValueAtTime(2400, now);
  f2.Q.setValueAtTime(3, now);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.32);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

  osc.connect(f1);
  f1.connect(f2);
  f2.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.58);

  // Vibrato (~7Hz) on pitch for natural mew warble
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(7, now);
  lfoGain.gain.setValueAtTime(18, now);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(now);
  lfo.stop(now + 0.58);
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

  // Soft lowpass keeps overtones gentle. Lower cutoff than before for a more
  // pillowy timbre; bus gain slightly attenuated for overall softness.
  const bus = c.createGain();
  bus.gain.value = 0.85;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1400, now);
  lp.Q.setValueAtTime(0.6, now);
  bus.connect(lp);
  lp.connect(master);

  // Slow-blooming pad: longer attacks, lower volumes, sparkle removed
  softTone(c, bus, "sine", 196.0, 0.06, now, 0.45, 1.6); // G3 sub
  softTone(c, bus, "sine", 392.0, 0.075, now, 0.42, 1.6); // G4 root
  softTone(c, bus, "sine", 493.88, 0.05, now + 0.12, 0.46, 1.4); // B4 third
  softTone(c, bus, "sine", 587.33, 0.04, now + 0.2, 0.48, 1.2); // D5 fifth
  softTone(c, bus, "sine", 783.99, 0.022, now + 0.32, 0.5, 1.0); // G5 octave (subtle)

  // Warm triangle breath under the chord
  softTone(c, bus, "triangle", 98.0, 0.035, now, 0.5, 1.5); // G2 deep
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
