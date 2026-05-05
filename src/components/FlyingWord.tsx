import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FlyingWord as FlyingWordType, PunchKind, PunchPower } from "../types/punch";
import pawLeftSrc from "../assets/sandbag/paw-left.png";
import pawRightSrc from "../assets/sandbag/paw-right.png";

type Props = {
  word: FlyingWordType;
  onComplete: (id: string) => void;
  onCharImpact: (power: PunchPower, kind: PunchKind, side: number) => void;
};

type KindFlight = {
  duration: number;
  delay: number;
  startSide: number;
  startSideJitter: number;
  startY: number;
  startYJitter: number;
  midSide: number;
  midSideJitter: number;
  midYJitter: number;
  endSide: number;
  endSideJitter: number;
  endY: number;
  endYJitter: number;
  scaleHit: number;
  scaleEnd: number;
  endRotateRange: number;
  centered: boolean;
  times: [number, number, number, number];
};

const KIND_FLIGHT: Record<PunchKind, KindFlight> = {
  punch: {
    duration: 0.78,
    delay: 0.4,
    startSide: 150,
    startSideJitter: 30,
    startY: 130,
    startYJitter: 30,
    midSide: 28,
    midSideJitter: 6,
    midYJitter: 12,
    endSide: 70,
    endSideJitter: 40,
    endY: 28,
    endYJitter: 24,
    scaleHit: 1.32,
    scaleEnd: 0.4,
    endRotateRange: 110,
    centered: false,
    times: [0, 0.3, 0.7, 1],
  },
  cat: {
    duration: 0.55,
    delay: 0.22,
    startSide: 130,
    startSideJitter: 24,
    startY: 110,
    startYJitter: 22,
    midSide: 22,
    midSideJitter: 5,
    midYJitter: 10,
    endSide: 60,
    endSideJitter: 30,
    endY: 22,
    endYJitter: 18,
    scaleHit: 1.25,
    scaleEnd: 0.45,
    endRotateRange: 90,
    centered: false,
    times: [0, 0.25, 0.7, 1],
  },
  crunch: {
    duration: 1.15,
    delay: 0.34,
    startSide: 36,
    startSideJitter: 30,
    startY: 200,
    startYJitter: 18,
    midSide: 0,
    midSideJitter: 22,
    midYJitter: 18,
    endSide: 0,
    endSideJitter: 40,
    endY: 6,
    endYJitter: 12,
    scaleHit: 1.05,
    scaleEnd: 0.85,
    endRotateRange: 18,
    centered: true,
    times: [0, 0.45, 0.8, 1],
  },
  hook: {
    duration: 0.9,
    delay: 0.42,
    startSide: 170,
    startSideJitter: 30,
    startY: 90,
    startYJitter: 30,
    midSide: 32,
    midSideJitter: 6,
    midYJitter: 12,
    endSide: 90,
    endSideJitter: 40,
    endY: 36,
    endYJitter: 24,
    scaleHit: 1.4,
    scaleEnd: 0.4,
    endRotateRange: 130,
    centered: false,
    times: [0, 0.3, 0.7, 1],
  },
  upper: {
    duration: 0.85,
    delay: 0.38,
    startSide: 30,
    startSideJitter: 24,
    startY: 220,
    startYJitter: 26,
    midSide: 0,
    midSideJitter: 18,
    midYJitter: 14,
    endSide: 0,
    endSideJitter: 60,
    endY: -40,
    endYJitter: 24,
    scaleHit: 1.35,
    scaleEnd: 0.4,
    endRotateRange: 80,
    centered: true,
    times: [0, 0.3, 0.65, 1],
  },
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function visibleChar(c: string): string {
  if (c === " ") return " ";
  return c;
}

export function FlyingWord({ word, onComplete, onCharImpact }: Props) {
  const reduce = useReducedMotion();
  const chars = useMemo(
    () => [...word.text].filter((c) => c !== "\n"),
    [word.text],
  );

  const flight = KIND_FLIGHT[word.kind] ?? KIND_FLIGHT.punch;
  const speed = word.speed > 0 ? Math.min(3, word.speed) : 1;
  const duration = flight.duration / speed;
  const delay = flight.delay / speed;
  const peakSec = duration * flight.times[2];
  const lastIndex = chars.length - 1;
  const forcedSide = word.side === -1 || word.side === 1 ? word.side : null;

  const onCharImpactRef = useRef(onCharImpact);
  onCharImpactRef.current = onCharImpact;

  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < chars.length; i++) {
      const at = i * delay + peakSec;
      const charSide = flight.centered
        ? 0
        : forcedSide ?? (i % 2 === 0 ? -1 : 1);
      const t = window.setTimeout(() => {
        onCharImpactRef.current(word.power, word.kind, charSide);
      }, at * 1000);
      timers.push(t);
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [chars.length, delay, peakSec, flight.centered, forcedSide, word.id, word.power, word.kind]);

  if (reduce) {
    return (
      <div
        className={`flying-word-group flying-word-group--${word.kind} flying-word-group--${word.power}`}
        aria-hidden="true"
      >
        {chars.map((c, i) => (
          <motion.span
            key={i}
            className={`flying-char flying-char--${word.kind} flying-char--${word.power}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.45,
              delay: i * delay,
              times: [0, 0.4, 1],
            }}
            onAnimationComplete={
              i === lastIndex ? () => onComplete(word.id) : undefined
            }
          >
            {visibleChar(c)}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flying-word-group flying-word-group--${word.kind} flying-word-group--${word.power}`}
      aria-hidden="true"
    >
      {chars.map((c, i) => {
        const seed = i + 1;
        const side = flight.centered ? 0 : forcedSide ?? (i % 2 === 0 ? -1 : 1);

        const startX = flight.centered
          ? (pseudoRandom(seed) - 0.5) * flight.startSideJitter * 2
          : side * (flight.startSide + pseudoRandom(seed) * flight.startSideJitter);
        const startY = flight.startY + pseudoRandom(seed + 50) * flight.startYJitter;

        const midX = flight.centered
          ? (pseudoRandom(seed + 100) - 0.5) * flight.midSideJitter * 2
          : side * (flight.midSide + pseudoRandom(seed + 100) * flight.midSideJitter);
        const midY = (pseudoRandom(seed + 150) - 0.5) * flight.midYJitter;

        const endX = flight.centered
          ? (pseudoRandom(seed + 200) - 0.5) * flight.endSideJitter * 2
          : side * (flight.endSide + pseudoRandom(seed + 200) * flight.endSideJitter);
        const endY = flight.endY + (pseudoRandom(seed + 250) - 0.5) * flight.endYJitter;

        const startRotate =
          word.kind === "cat"
            ? (pseudoRandom(seed + 300) - 0.5) * 360
            : flight.centered
              ? (pseudoRandom(seed + 300) - 0.5) * 30
              : side * (12 + pseudoRandom(seed + 300) * 22);
        const endRotate =
          word.kind === "cat"
            ? startRotate + (pseudoRandom(seed + 350) - 0.5) * 220
            : (pseudoRandom(seed + 350) - 0.5) * flight.endRotateRange;
        const charDelay = i * delay;
        const isLast = i === lastIndex;

        if (word.kind === "cat") {
          const pawSrc = side === -1 ? pawLeftSrc : pawRightSrc;
          return (
            <motion.img
              key={i}
              className={`flying-paw flying-paw--${side === -1 ? "left" : "right"}`}
              src={pawSrc}
              alt=""
              draggable={false}
              initial={{ opacity: 0, x: startX, y: startY, scale: 0.45, rotate: startRotate }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [startX, startX * 0.55, midX, endX],
                y: [startY, startY * 0.55, midY, endY],
                scale: [0.45, 1, flight.scaleHit * 1.15, flight.scaleEnd],
                rotate: [startRotate, startRotate * 0.4, 0, endRotate],
              }}
              transition={{
                duration,
                delay: charDelay,
                ease: "easeOut",
                times: flight.times,
              }}
              onAnimationComplete={isLast ? () => onComplete(word.id) : undefined}
            />
          );
        }

        return (
          <motion.span
            key={i}
            className={`flying-char flying-char--${word.kind} flying-char--${word.power}`}
            initial={{ opacity: 0, x: startX, y: startY, scale: 0.55, rotate: startRotate }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [startX, startX * 0.55, midX, endX],
              y: [startY, startY * 0.55, midY, endY],
              scale: [0.55, 1, flight.scaleHit, flight.scaleEnd],
              rotate: [startRotate, startRotate * 0.4, 0, endRotate],
            }}
            transition={{
              duration,
              delay: charDelay,
              ease: "easeOut",
              times: flight.times,
            }}
            onAnimationComplete={isLast ? () => onComplete(word.id) : undefined}
          >
            {visibleChar(c)}
          </motion.span>
        );
      })}
    </div>
  );
}
