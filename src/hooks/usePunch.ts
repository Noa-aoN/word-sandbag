import { useCallback, useEffect, useRef, useState } from "react";
import type { FlyingWord, ImpactKind, PunchKind, PunchPower } from "../types/punch";
import { playImpact, primeAudio } from "../lib/sound";

const COMPLETE_MESSAGES = [
  "その言葉は、ここで消えました。",
  "ここで受け止めました。",
  "保存していません。",
  "少しだけ、軽くなりますように。",
];

const TAP_MESSAGES = ["ポンッ。", "そのままでいいです。", "受け止めました。"];

const CRUNCH_MESSAGES = [
  "ぎゅっと包みました。",
  "そのまま預かります。",
  "ふわっと受け止めました。",
];

const CAT_MESSAGES = ["にゃ。", "猫の手も借りました。", "ねこパンチ完了。"];

const MESSAGE_DURATION_MS = 1800;
const TAP_MESSAGE_DURATION_MS = 900;
const MESSAGE_AFTER_FIRST_IMPACT_MS = 380;

const CAT_TEXT = "にゃーん";

const SPEED_MIN = 0.5;
const SPEED_MAX = 1.7;
const SPEED_DEFAULT = 1.0;

function classifyPower(text: string): PunchPower {
  const len = text.length;
  if (len <= 10) return "light";
  if (len <= 40) return "normal";
  return "heavy";
}

function bumpPower(power: PunchPower): PunchPower {
  if (power === "light") return "normal";
  if (power === "normal") return "heavy";
  return "heavy";
}

function isEmphasized(text: string): boolean {
  const matches = text.match(/[!!??]/gu);
  return (matches?.length ?? 0) >= 3;
}

function vibrate(power: PunchPower) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const ms = power === "light" ? 20 : power === "normal" ? 40 : 70;
  try {
    navigator.vibrate(ms);
  } catch {
    // navigator.vibrate may throw without user activation on some browsers
  }
}

function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function clampSpeed(v: number): number {
  if (Number.isNaN(v)) return SPEED_DEFAULT;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `w-${Date.now().toString(36)}-${idCounter}`;
}

export function usePunch() {
  const [text, setText] = useState("");
  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);
  const [hitKey, setHitKey] = useState(0);
  const [hitPower, setHitPower] = useState<PunchPower>("normal");
  const [hitKind, setHitKind] = useState<ImpactKind>("punch");
  const [hitCount, setHitCount] = useState(0);
  const [message, setMessage] = useState("");
  const [speed, setSpeedState] = useState(SPEED_DEFAULT);
  const [soundOn, setSoundOn] = useState(false);

  const messageTimerRef = useRef<number | null>(null);
  const messageDelayTimerRef = useRef<number | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  useEffect(
    () => () => {
      if (messageTimerRef.current !== null) window.clearTimeout(messageTimerRef.current);
      if (messageDelayTimerRef.current !== null)
        window.clearTimeout(messageDelayTimerRef.current);
    },
    [],
  );

  const showMessage = useCallback((msg: string, duration: number) => {
    if (!msg) return;
    setMessage(msg);
    if (messageTimerRef.current !== null) window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => {
      setMessage("");
      messageTimerRef.current = null;
    }, duration);
  }, []);

  const setSpeed = useCallback((v: number) => {
    setSpeedState(clampSpeed(v));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on;
      if (next) primeAudio();
      return next;
    });
  }, []);

  const dispatchPunch = useCallback(
    (content: string, kind: PunchKind = "punch") => {
      const trimmed = content.trim();
      if (trimmed.length === 0) return;

      let power: PunchPower;
      if (kind === "crunch") {
        power = "light";
      } else if (kind === "cat") {
        power = "normal";
      } else {
        const base = classifyPower(trimmed);
        power = isEmphasized(trimmed) ? bumpPower(base) : base;
      }

      const word: FlyingWord = {
        id: nextId(),
        text: trimmed,
        power,
        kind,
        emphasized: isEmphasized(trimmed),
        speed,
        createdAt: Date.now(),
      };

      setFlyingWords((prev) => [...prev, word]);

      if (messageDelayTimerRef.current !== null)
        window.clearTimeout(messageDelayTimerRef.current);
      const messages =
        kind === "crunch"
          ? CRUNCH_MESSAGES
          : kind === "cat"
            ? CAT_MESSAGES
            : COMPLETE_MESSAGES;
      const msg = pickRandom(messages) ?? "";
      messageDelayTimerRef.current = window.setTimeout(() => {
        showMessage(msg, MESSAGE_DURATION_MS);
        messageDelayTimerRef.current = null;
      }, Math.round(MESSAGE_AFTER_FIRST_IMPACT_MS / speed));
    },
    [showMessage, speed],
  );

  const punch = useCallback(() => {
    setText((current) => {
      dispatchPunch(current, "punch");
      return "";
    });
  }, [dispatchPunch]);

  const crunch = useCallback(() => {
    setText((current) => {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        dispatchPunch(current, "crunch");
        return "";
      }
      setHitPower("light");
      setHitKind("crunch");
      setHitCount((c) => c + 1);
      setHitKey((k) => k + 1);
      showMessage(pickRandom(CRUNCH_MESSAGES) ?? "", MESSAGE_DURATION_MS);
      if (soundOnRef.current) playImpact("crunch", "light");
      return current;
    });
  }, [dispatchPunch, showMessage]);

  const punchWith = useCallback(
    (preset: string) => {
      dispatchPunch(preset, "punch");
    },
    [dispatchPunch],
  );

  const catPunch = useCallback(() => {
    dispatchPunch(CAT_TEXT, "cat");
  }, [dispatchPunch]);

  const tap = useCallback(() => {
    setHitPower("light");
    setHitKind("tap");
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    showMessage(pickRandom(TAP_MESSAGES) ?? "", TAP_MESSAGE_DURATION_MS);
    if (soundOnRef.current) playImpact("tap", "light");
    vibrate("light");
  }, [showMessage]);

  const charImpact = useCallback((power: PunchPower, kind: PunchKind) => {
    setHitPower(power);
    setHitKind(kind);
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    if (soundOnRef.current) playImpact(kind, power);
    if (kind !== "crunch") vibrate(power);
  }, []);

  const removeWord = useCallback((id: string) => {
    setFlyingWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    text,
    setText,
    flyingWords,
    hitKey,
    hitPower,
    hitKind,
    hitCount,
    message,
    speed,
    soundOn,
    setSpeed,
    toggleSound,
    punch,
    punchWith,
    crunch,
    catPunch,
    tap,
    charImpact,
    removeWord,
    speedRange: { min: SPEED_MIN, max: SPEED_MAX, step: 0.1, default: SPEED_DEFAULT },
  };
}
