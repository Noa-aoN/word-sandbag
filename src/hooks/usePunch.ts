import { useCallback, useEffect, useRef, useState } from "react";
import type { FlyingWord, PunchPower } from "../types/punch";

const COMPLETE_MESSAGES = [
  "その言葉は、ここで消えました。",
  "ここで受け止めました。",
  "保存していません。",
  "少しだけ、軽くなりますように。",
];

const TAP_MESSAGES = [
  "ポンッ。",
  "そのままでいいです。",
  "受け止めました。",
];

const MESSAGE_DURATION_MS = 1800;
const TAP_MESSAGE_DURATION_MS = 900;
const IMPACT_DELAY_MS_BY_POWER: Record<PunchPower, number> = {
  light: 380,
  normal: 430,
  heavy: 500,
};

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
  const [hitCount, setHitCount] = useState(0);
  const [message, setMessage] = useState("");
  const messageTimerRef = useRef<number | null>(null);
  const impactTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (messageTimerRef.current !== null) {
        window.clearTimeout(messageTimerRef.current);
      }
      if (impactTimerRef.current !== null) {
        window.clearTimeout(impactTimerRef.current);
      }
    },
    [],
  );

  const showMessage = useCallback((msg: string, duration: number) => {
    setMessage(msg);
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage("");
      messageTimerRef.current = null;
    }, duration);
  }, []);

  const dispatchPunch = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (trimmed.length === 0) return;

      const basePower = classifyPower(trimmed);
      const power = isEmphasized(trimmed) ? bumpPower(basePower) : basePower;

      const word: FlyingWord = {
        id: nextId(),
        text: trimmed,
        power,
        emphasized: isEmphasized(trimmed),
        createdAt: Date.now(),
      };

      setFlyingWords((prev) => [...prev, word]);

      if (impactTimerRef.current !== null) {
        window.clearTimeout(impactTimerRef.current);
      }
      impactTimerRef.current = window.setTimeout(() => {
        setHitPower(power);
        setHitCount((c) => c + 1);
        setHitKey((k) => k + 1);
        showMessage(pickRandom(COMPLETE_MESSAGES) ?? "", MESSAGE_DURATION_MS);
        vibrate(power);
        impactTimerRef.current = null;
      }, IMPACT_DELAY_MS_BY_POWER[power]);
    },
    [showMessage],
  );

  const punch = useCallback(() => {
    setText((current) => {
      dispatchPunch(current);
      return "";
    });
  }, [dispatchPunch]);

  const punchWith = useCallback(
    (preset: string) => {
      dispatchPunch(preset);
    },
    [dispatchPunch],
  );

  const tap = useCallback(() => {
    setHitPower("light");
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    showMessage(pickRandom(TAP_MESSAGES) ?? "", TAP_MESSAGE_DURATION_MS);
    vibrate("light");
  }, [showMessage]);

  const removeWord = useCallback((id: string) => {
    setFlyingWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    text,
    setText,
    flyingWords,
    hitKey,
    hitPower,
    hitCount,
    message,
    punch,
    punchWith,
    tap,
    removeWord,
  };
}
