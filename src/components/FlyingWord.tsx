import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FlyingWord as FlyingWordType, PunchKind, PunchPower } from "../types/punch";

type Props = {
  word: FlyingWordType;
  onComplete: (id: string) => void;
  onCharImpact: (power: PunchPower, kind: PunchKind) => void;
};

type KindFlight = {
  duration: number;
  delay: number;
  startY: number;
  startYJitter: number;
  startXJitter: number;
  midJitterX: number;
  midJitterY: number;
  scatterX: number;
  scatterY: number;
  scaleHit: number;
  scaleEnd: number;
  endRotateRange: number;
  endY: number;
  times: [number, number, number, number];
};

const KIND_FLIGHT: Record<PunchKind, KindFlight> = {
  punch: {
    duration: 0.78,
    delay: 0.4,
    startY: 180,
    startYJitter: 30,
    startXJitter: 30,
    midJitterX: 14,
    midJitterY: 12,
    scatterX: 130,
    scatterY: 60,
    scaleHit: 1.32,
    scaleEnd: 0.4,
    endRotateRange: 110,
    endY: 30,
    times: [0, 0.3, 0.7, 1],
  },
  cat: {
    duration: 0.55,
    delay: 0.22,
    startY: 170,
    startYJitter: 20,
    startXJitter: 24,
    midJitterX: 10,
    midJitterY: 8,
    scatterX: 90,
    scatterY: 40,
    scaleHit: 1.25,
    scaleEnd: 0.45,
    endRotateRange: 90,
    endY: 18,
    times: [0, 0.25, 0.7, 1],
  },
  crunch: {
    duration: 1.15,
    delay: 0.34,
    startY: 200,
    startYJitter: 18,
    startXJitter: 36,
    midJitterX: 22,
    midJitterY: 18,
    scatterX: 0,
    scatterY: 0,
    scaleHit: 1.05,
    scaleEnd: 0.85,
    endRotateRange: 18,
    endY: 6,
    times: [0, 0.45, 0.8, 1],
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

  const flight = KIND_FLIGHT[word.kind];
  const speed = word.speed > 0 ? word.speed : 1;
  const duration = flight.duration / speed;
  const delay = flight.delay / speed;
  const peakSec = duration * flight.times[2];
  const lastIndex = chars.length - 1;

  const onCharImpactRef = useRef(onCharImpact);
  onCharImpactRef.current = onCharImpact;

  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < chars.length; i++) {
      const at = i * delay + peakSec;
      const t = window.setTimeout(() => {
        onCharImpactRef.current(word.power, word.kind);
      }, at * 1000);
      timers.push(t);
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [chars.length, delay, peakSec, word.id, word.power, word.kind]);

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
        const startX = (pseudoRandom(seed) - 0.5) * flight.startXJitter;
        const startY = flight.startY + pseudoRandom(seed + 50) * flight.startYJitter;
        const midX = (pseudoRandom(seed + 100) - 0.5) * flight.midJitterX;
        const midY = (pseudoRandom(seed + 150) - 0.5) * flight.midJitterY;
        const scatter = word.kind === "crunch";
        const endX = scatter
          ? (pseudoRandom(seed + 200) - 0.5) * flight.scatterX
          : (pseudoRandom(seed + 200) - 0.5) * flight.scatterX;
        const endY = scatter
          ? flight.endY + (pseudoRandom(seed + 250) - 0.5) * 8
          : flight.endY + (pseudoRandom(seed + 250) - 0.5) * flight.scatterY;
        const startRotate = (pseudoRandom(seed + 300) - 0.5) * 26;
        const endRotate = (pseudoRandom(seed + 350) - 0.5) * flight.endRotateRange;
        const charDelay = i * delay;
        const isLast = i === lastIndex;

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
