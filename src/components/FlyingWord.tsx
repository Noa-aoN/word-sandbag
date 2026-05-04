import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FlyingWord as FlyingWordType } from "../types/punch";

type Props = {
  word: FlyingWordType;
  onComplete: (id: string) => void;
};

const flightByPower = {
  light: { duration: 0.7, rise: 190, scaleHit: 1.15 },
  normal: { duration: 0.78, rise: 210, scaleHit: 1.3 },
  heavy: { duration: 0.88, rise: 230, scaleHit: 1.5 },
};

const STAGGER_BUDGET_MS = 360;
const STAGGER_MAX_PER_CHAR_MS = 50;

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function renderChar(c: string): string {
  if (c === " ") return " ";
  return c;
}

export function FlyingWord({ word, onComplete }: Props) {
  const reduce = useReducedMotion();
  const flight = flightByPower[word.power];
  const chars = useMemo(() => [...word.text], [word.text]);

  const animatedIndices = useMemo(
    () => chars.map((c, i) => (c === "\n" ? -1 : i)).filter((i) => i >= 0),
    [chars],
  );
  const lastAnimated = animatedIndices[animatedIndices.length - 1] ?? -1;
  const animatedCount = animatedIndices.length || 1;
  const staggerSec =
    Math.min(STAGGER_MAX_PER_CHAR_MS, STAGGER_BUDGET_MS / animatedCount) / 1000;

  if (reduce) {
    return (
      <div
        className={`flying-word-group flying-word-group--${word.power}`}
        aria-hidden="true"
      >
        {chars.map((c, i) =>
          c === "\n" ? (
            <span key={i} className="flying-char--break" />
          ) : (
            <motion.span
              key={i}
              className={`flying-char flying-char--${word.power}`}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.32, delay: 0.05 + i * 0.005 }}
              onAnimationComplete={
                i === lastAnimated ? () => onComplete(word.id) : undefined
              }
            >
              {renderChar(c)}
            </motion.span>
          ),
        )}
      </div>
    );
  }

  let order = 0;

  return (
    <div
      className={`flying-word-group flying-word-group--${word.power}`}
      aria-hidden="true"
    >
      {chars.map((c, i) => {
        if (c === "\n") {
          return <span key={i} className="flying-char--break" />;
        }

        const charOrder = order;
        order += 1;
        const seed = charOrder + 1;
        const dxStart = (pseudoRandom(seed) - 0.5) * 16;
        const dxScatter = (pseudoRandom(seed + 100) - 0.5) * 80;
        const dyScatter = (pseudoRandom(seed + 200) - 0.5) * 28;
        const rotEnd = (pseudoRandom(seed + 300) - 0.5) * 60;
        const delay = charOrder * staggerSec;

        return (
          <motion.span
            key={i}
            className={`flying-char flying-char--${word.power}`}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, -flight.rise * 0.35, -flight.rise, -flight.rise + dyScatter],
              x: [0, dxStart, 0, dxScatter],
              scale: [0.6, 1, flight.scaleHit, 0.35],
              rotate: [0, rotEnd * 0.2, 0, rotEnd],
            }}
            transition={{
              duration: flight.duration,
              delay,
              ease: "easeOut",
              times: [0, 0.25, 0.7, 1],
            }}
            onAnimationComplete={
              i === lastAnimated ? () => onComplete(word.id) : undefined
            }
          >
            {renderChar(c)}
          </motion.span>
        );
      })}
    </div>
  );
}
