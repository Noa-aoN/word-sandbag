import { motion, useReducedMotion } from "framer-motion";
import type { FlyingWord as FlyingWordType } from "../types/punch";

type Props = {
  word: FlyingWordType;
  onComplete: (id: string) => void;
};

const flightByPower = {
  light: { duration: 0.65, rise: 180, scaleHit: 1.1 },
  normal: { duration: 0.72, rise: 200, scaleHit: 1.25 },
  heavy: { duration: 0.82, rise: 220, scaleHit: 1.4 },
};

export function FlyingWord({ word, onComplete }: Props) {
  const reduce = useReducedMotion();
  const flight = flightByPower[word.power];

  if (reduce) {
    return (
      <motion.div
        className={`flying-word flying-word--${word.power}`}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        onAnimationComplete={() => onComplete(word.id)}
      >
        {word.text}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flying-word flying-word--${word.power}`}
      initial={{ opacity: 0, y: 0, scale: 0.8, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -flight.rise * 0.4, -flight.rise, -flight.rise + 4],
        scale: [0.8, 1, flight.scaleHit, 0.4],
        rotate: [0, -4, 6, 0],
      }}
      transition={{
        duration: flight.duration,
        ease: "easeOut",
        times: [0, 0.25, 0.7, 1],
      }}
      onAnimationComplete={() => onComplete(word.id)}
    >
      {word.text}
    </motion.div>
  );
}
