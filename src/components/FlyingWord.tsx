import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FlyingWord as FlyingWordType } from "../types/punch";

type Props = {
  word: FlyingWordType;
  onComplete: (id: string) => void;
};

const flightByPower = {
  light: { duration: 0.8, scaleHit: 1.15 },
  normal: { duration: 0.9, scaleHit: 1.3 },
  heavy: { duration: 1.0, scaleHit: 1.5 },
};

const STAGGER_BUDGET_MS = 380;
const STAGGER_MAX_PER_CHAR_MS = 55;

const SIDE_BASE = 190;
const SIDE_RANGE = 70;
const START_Y_BASE = 70;
const START_Y_RANGE = 80;
const MID_JITTER_X = 26;
const MID_JITTER_Y = 18;
const SCATTER_X = 80;
const SCATTER_Y = 36;

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function visibleChar(c: string): string {
  if (c === " ") return " ";
  return c;
}

export function FlyingWord({ word, onComplete }: Props) {
  const reduce = useReducedMotion();
  const flight = flightByPower[word.power];
  const chars = useMemo(
    () => [...word.text].filter((c) => c !== "\n"),
    [word.text],
  );

  const lastIndex = chars.length - 1;
  const staggerSec =
    Math.min(STAGGER_MAX_PER_CHAR_MS, STAGGER_BUDGET_MS / chars.length) / 1000;

  if (reduce) {
    return (
      <div
        className={`flying-word-group flying-word-group--${word.power}`}
        aria-hidden="true"
      >
        {chars.map((c, i) => (
          <motion.span
            key={i}
            className={`flying-char flying-char--${word.power}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.32, delay: 0.04 + i * 0.005 }}
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
      className={`flying-word-group flying-word-group--${word.power}`}
      aria-hidden="true"
    >
      {chars.map((c, i) => {
        const seed = i + 1;
        const side = i % 2 === 0 ? -1 : 1;
        const startX = side * (SIDE_BASE + pseudoRandom(seed) * SIDE_RANGE);
        const startY = START_Y_BASE + pseudoRandom(seed + 50) * START_Y_RANGE;
        const startRotate = side * (12 + pseudoRandom(seed + 75) * 24);
        const midX = (pseudoRandom(seed + 400) - 0.5) * MID_JITTER_X;
        const midY = (pseudoRandom(seed + 500) - 0.5) * MID_JITTER_Y;
        const endX = (pseudoRandom(seed + 100) - 0.5) * SCATTER_X * 2;
        const endY = -8 + (pseudoRandom(seed + 200) - 0.5) * SCATTER_Y * 2;
        const endRotate = (pseudoRandom(seed + 300) - 0.5) * 80;
        const delay = i * staggerSec;
        const isLast = i === lastIndex;

        return (
          <motion.span
            key={i}
            className={`flying-char flying-char--${word.power}`}
            initial={{ opacity: 0, x: startX, y: startY, scale: 0.5, rotate: startRotate }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [startX, startX * 0.45, midX, endX],
              y: [startY, startY * 0.55, midY, endY],
              scale: [0.5, 1, flight.scaleHit, 0.35],
              rotate: [startRotate, startRotate * 0.4, 0, endRotate],
            }}
            transition={{
              duration: flight.duration,
              delay,
              ease: "easeOut",
              times: [0, 0.5, 0.7, 1],
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
