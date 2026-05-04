import type { ImpactKind, PunchPower } from "../types/punch";

type AnyWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;

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

const PUNCH_PROFILE: Record<PunchPower, {
  freq: number;
  drop: number;
  dur: number;
  vol: number;
  cutoff: number;
}> = {
  light: { freq: 240, drop: 120, dur: 0.13, vol: 0.18, cutoff: 720 },
  normal: { freq: 170, drop: 80, dur: 0.18, vol: 0.24, cutoff: 540 },
  heavy: { freq: 110, drop: 55, dur: 0.26, vol: 0.32, cutoff: 380 },
};

function thump(power: PunchPower) {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const now = c.currentTime;
  const cfg = PUNCH_PROFILE[power];

  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cfg.cutoff, now);

  osc.type = "square";
  osc.frequency.setValueAtTime(cfg.freq, now);
  osc.frequency.exponentialRampToValueAtTime(cfg.drop, now + cfg.dur);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(cfg.vol, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + cfg.dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + cfg.dur + 0.02);
}

function meow() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(720, now);
  osc.frequency.linearRampToValueAtTime(420, now + 0.13);
  osc.frequency.linearRampToValueAtTime(560, now + 0.24);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.32);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.34);
}

function hum() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(180, now + 0.4);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

export function playImpact(kind: ImpactKind, power: PunchPower) {
  switch (kind) {
    case "cat":
      meow();
      return;
    case "crunch":
      hum();
      return;
    case "tap":
      thump("light");
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
}
