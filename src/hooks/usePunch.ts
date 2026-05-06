import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BagState,
  FlyingWord,
  ImpactKind,
  PunchKind,
  PunchPower,
} from "../types/punch";
import { playClank, playErupt, playImpact, playTowel, primeAudio } from "../lib/sound";
import { bumpPower, classifyPower, isEmphasized } from "../lib/power";
import { clampNumber, sanitizeInput } from "../lib/sanitize";

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

const CAT_TEXT = "ニ";
const CASH_TEXT = "万";


const SPEED_MIN = 0.7;
const SPEED_MAX = 2.4;
const SPEED_DEFAULT = 1.6;

const STRENGTH_MIN = 0.7;
const STRENGTH_MAX = 1.8;
const STRENGTH_DEFAULT = 1.0;

// 強度 (strength) は「言葉パンチ」の発動 kind を切り替える階段:
//   弱め (~0.7)  → 通常の punch
//   ふつう (~1.0) → upper (アッパー)
//   強め (~1.4)  → hook (フック)
//   全力 (~1.8)  → kick (キック)
// punch 以外で発動された kind (cat / cash / crunch) はそのまま尊重する。
function strengthToPunchKind(s: number): PunchKind {
  if (s >= 1.65) return "kick";
  if (s >= 1.25) return "hook";
  if (s >= 0.85) return "upper";
  return "punch";
}

const INTENSITY_MIN = 1.0;
const INTENSITY_MAX = 3.0;
const INTENSITY_INC = 0.15;
const INTENSITY_CRUNCH_DEC = 0.25;
const INTENSITY_DECAY_MS = 1800;

const BREAK_AT = 300;
const DEPART_DURATION_MS = 1400;
const MISSING_DURATION_MS = 1500;
const RETURN_MESSAGE = "新しいの持ってきたよ。";
const RETURN_MESSAGE_DURATION_MS = 2400;

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
  const [hitKind, setHitKind] = useState<ImpactKind>("punch");
  const [hitSide, setHitSide] = useState(0);
  const [hitIntensity, setHitIntensity] = useState(INTENSITY_MIN);
  const [hitCount, setHitCount] = useState(0);
  const [message, setMessage] = useState("");
  const [speed, setSpeedState] = useState(SPEED_DEFAULT);
  const [strength, setStrengthState] = useState(STRENGTH_DEFAULT);
  const [soundOn, setSoundOn] = useState(true);
  const [bagState, setBagState] = useState<BagState>("active");
  const [towelKey, setTowelKey] = useState(0);

  const messageTimerRef = useRef<number | null>(null);
  const messageDelayTimerRef = useRef<number | null>(null);
  const intensityDecayRef = useRef<number | null>(null);
  const eruptTimersRef = useRef<number[]>([]);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const bagStateRef = useRef(bagState);
  bagStateRef.current = bagState;
  const hitCountRef = useRef(hitCount);
  hitCountRef.current = hitCount;
  const strengthRef = useRef(strength);
  strengthRef.current = strength;

  useEffect(
    () => () => {
      if (messageTimerRef.current !== null) window.clearTimeout(messageTimerRef.current);
      if (messageDelayTimerRef.current !== null)
        window.clearTimeout(messageDelayTimerRef.current);
      if (intensityDecayRef.current !== null)
        window.clearTimeout(intensityDecayRef.current);
      for (const t of eruptTimersRef.current) window.clearTimeout(t);
      eruptTimersRef.current = [];
    },
    [],
  );

  // Trigger the bag-departure cinematic only when the threshold is crossed AND
  // any in-flight word punch has fully resolved (flyingWords.length === 0).
  // This satisfies the "finish the current word first" requirement.
  useEffect(() => {
    if (bagState !== "active") return;
    if (hitCount < BREAK_AT) return;
    if (flyingWords.length > 0) return;

    setMessage("");
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    if (messageDelayTimerRef.current !== null) {
      window.clearTimeout(messageDelayTimerRef.current);
      messageDelayTimerRef.current = null;
    }
    if (intensityDecayRef.current !== null) {
      window.clearTimeout(intensityDecayRef.current);
      intensityDecayRef.current = null;
    }

    setBagState("departing");
    if (soundOnRef.current) playErupt();

    const t1 = window.setTimeout(() => {
      setBagState("missing");
    }, DEPART_DURATION_MS);
    eruptTimersRef.current.push(t1);

    const t2 = window.setTimeout(() => {
      setBagState("active");
      setHitCount(0);
      setHitIntensity(INTENSITY_MIN);
      if (soundOnRef.current) playClank();
    }, DEPART_DURATION_MS + MISSING_DURATION_MS);
    eruptTimersRef.current.push(t2);

    // Show the "new bag arrived" message once it's actually back on stage.
    const t3 = window.setTimeout(() => {
      setMessage(RETURN_MESSAGE);
      if (messageTimerRef.current !== null) window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = window.setTimeout(() => {
        setMessage("");
        messageTimerRef.current = null;
      }, RETURN_MESSAGE_DURATION_MS);
    }, DEPART_DURATION_MS + MISSING_DURATION_MS + 80);
    eruptTimersRef.current.push(t3);
  }, [bagState, hitCount, flyingWords.length]);

  const scheduleIntensityDecay = useCallback(() => {
    if (intensityDecayRef.current !== null) {
      window.clearTimeout(intensityDecayRef.current);
    }
    intensityDecayRef.current = window.setTimeout(() => {
      setHitIntensity(INTENSITY_MIN);
      intensityDecayRef.current = null;
    }, INTENSITY_DECAY_MS);
  }, []);

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
    setSpeedState(clampNumber(v, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT));
  }, []);

  const setStrength = useCallback((v: number) => {
    setStrengthState(clampNumber(v, STRENGTH_MIN, STRENGTH_MAX, STRENGTH_DEFAULT));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on;
      if (next) primeAudio();
      return next;
    });
  }, []);

  const dispatchPunch = useCallback(
    (content: string, kind: PunchKind = "punch", forcedSide?: -1 | 1) => {
      if (bagStateRef.current !== "active") return;
      if (hitCountRef.current >= BREAK_AT) return;
      const trimmed = sanitizeInput(content);
      if (trimmed.length === 0) return;

      const effectiveKind: PunchKind =
        kind === "punch" ? strengthToPunchKind(strengthRef.current) : kind;

      let power: PunchPower;
      if (effectiveKind === "crunch") {
        power = "light";
      } else if (effectiveKind === "cat") {
        power = "normal";
      } else if (
        effectiveKind === "upper" ||
        effectiveKind === "hook" ||
        effectiveKind === "kick"
      ) {
        // 強め以上の置換 kind は常に heavy 扱い (アッパー/フック/キックボタンと揃える)
        power = "heavy";
      } else {
        const base = classifyPower(trimmed);
        power = isEmphasized(trimmed) ? bumpPower(base) : base;
      }

      const word: FlyingWord = {
        id: nextId(),
        text: trimmed,
        power,
        kind: effectiveKind,
        emphasized: isEmphasized(trimmed),
        speed,
        side: forcedSide,
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
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    setText((current) => {
      dispatchPunch(current, "punch");
      return "";
    });
  }, [dispatchPunch]);

  const crunch = useCallback(() => {
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    setText((current) => {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        dispatchPunch(current, "crunch");
        return "";
      }
      setHitPower("light");
      setHitKind("crunch");
      setHitSide(0);
      setHitCount((c) => c + 1);
      setHitKey((k) => k + 1);
      setHitIntensity((prev) => Math.max(INTENSITY_MIN, prev - INTENSITY_CRUNCH_DEC));
      if (intensityDecayRef.current !== null) {
        window.clearTimeout(intensityDecayRef.current);
        intensityDecayRef.current = null;
      }
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
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    dispatchPunch(CAT_TEXT, "cat", side);
  }, [dispatchPunch]);

  const cashPunch = useCallback(() => {
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    dispatchPunch(CASH_TEXT, "cash", side);
  }, [dispatchPunch]);

  const tap = useCallback(
    (side: number = 0) => {
      if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
      setHitPower("light");
      setHitKind("tap");
      setHitSide(side);
      setHitCount((c) => c + 1);
      setHitKey((k) => k + 1);
      setHitIntensity((prev) => Math.min(INTENSITY_MAX, prev + INTENSITY_INC * 0.6));
      scheduleIntensityDecay();
      showMessage(pickRandom(TAP_MESSAGES) ?? "", TAP_MESSAGE_DURATION_MS);
      if (soundOnRef.current) playImpact("tap", "light");
      vibrate("light");
    },
    [showMessage, scheduleIntensityDecay],
  );

  const hook = useCallback(() => {
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    setHitPower("heavy");
    setHitKind("hook");
    setHitSide(side);
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    setHitIntensity((prev) => Math.min(INTENSITY_MAX, prev + INTENSITY_INC * 1.6));
    scheduleIntensityDecay();
    if (soundOnRef.current) playImpact("hook", "heavy");
    vibrate("heavy");
  }, [scheduleIntensityDecay]);

  const upper = useCallback(() => {
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    setHitPower("heavy");
    setHitKind("upper");
    setHitSide(0);
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    setHitIntensity((prev) => Math.min(INTENSITY_MAX, prev + INTENSITY_INC * 1.4));
    scheduleIntensityDecay();
    if (soundOnRef.current) playImpact("upper", "heavy");
    vibrate("heavy");
  }, [scheduleIntensityDecay]);

  const kick = useCallback(() => {
    if (bagStateRef.current !== "active" || hitCountRef.current >= BREAK_AT) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    setHitPower("heavy");
    setHitKind("kick");
    setHitSide(side);
    setHitCount((c) => c + 1);
    setHitKey((k) => k + 1);
    setHitIntensity((prev) => Math.min(INTENSITY_MAX, prev + INTENSITY_INC * 1.6));
    scheduleIntensityDecay();
    if (soundOnRef.current) playImpact("kick", "heavy");
    vibrate("heavy");
  }, [scheduleIntensityDecay]);

  const charImpact = useCallback(
    (power: PunchPower, kind: PunchKind, side: number) => {
      setHitPower(power);
      setHitKind(kind);
      setHitSide(side);
      setHitCount((c) => c + 1);
      setHitKey((k) => k + 1);

      if (kind === "crunch") {
        setHitIntensity((prev) => Math.max(INTENSITY_MIN, prev - INTENSITY_CRUNCH_DEC));
        if (intensityDecayRef.current !== null) {
          window.clearTimeout(intensityDecayRef.current);
          intensityDecayRef.current = null;
        }
      } else {
        setHitIntensity((prev) => Math.min(INTENSITY_MAX, prev + INTENSITY_INC));
        scheduleIntensityDecay();
      }

      if (soundOnRef.current) playImpact(kind, power);
      if (kind !== "crunch") vibrate(power);
    },
    [scheduleIntensityDecay],
  );

  const removeWord = useCallback((id: string) => {
    setFlyingWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const throwTowel = useCallback(() => {
    // Cancel every in-flight word and pending message — FlyingWord's effect
    // cleanup clears its char-impact timers when it unmounts.
    setFlyingWords([]);
    setText("");
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    if (messageDelayTimerRef.current !== null) {
      window.clearTimeout(messageDelayTimerRef.current);
      messageDelayTimerRef.current = null;
    }
    setTowelKey((k) => k + 1);
    if (soundOnRef.current) playTowel();
    setMessage("タオル投入。今日はここまで。");
    messageTimerRef.current = window.setTimeout(() => {
      setMessage("");
      messageTimerRef.current = null;
    }, 1600);
  }, []);

  return {
    text,
    setText,
    flyingWords,
    hitKey,
    hitPower,
    hitKind,
    hitSide,
    hitIntensity,
    hitCount,
    message,
    speed,
    soundOn,
    bagState,
    setSpeed,
    toggleSound,
    punch,
    punchWith,
    crunch,
    catPunch,
    cashPunch,
    hook,
    upper,
    kick,
    tap,
    charImpact,
    removeWord,
    throwTowel,
    towelKey,
    speedRange: { min: SPEED_MIN, max: SPEED_MAX, step: 0.1, default: SPEED_DEFAULT },
    strength,
    setStrength,
    strengthRange: { min: STRENGTH_MIN, max: STRENGTH_MAX, step: 0.1, default: STRENGTH_DEFAULT },
  };
}
