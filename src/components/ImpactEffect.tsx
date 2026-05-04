import { motion, useReducedMotion } from "framer-motion";
import type { PunchPower } from "../types/punch";

type Props = {
  hitKey: number;
  power: PunchPower;
};

const labelByPower: Record<PunchPower, string> = {
  light: "ポンッ",
  normal: "バシッ",
  heavy: "ドゴッ",
};

const sizeByPower: Record<PunchPower, number> = {
  light: 0.85,
  normal: 1,
  heavy: 1.25,
};

export function ImpactEffect({ hitKey, power }: Props) {
  const reduce = useReducedMotion();
  if (hitKey === 0) return null;

  const scale = sizeByPower[power];

  return (
    <div className="impact-wrap" aria-hidden="true">
      <motion.div
        key={hitKey}
        className="impact"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.6 * scale, 1.1 * scale, 0.95 * scale] }}
        transition={{ duration: reduce ? 0.2 : 0.55, times: [0, 0.3, 1] }}
      >
        {!reduce && (
          <motion.span
            className="impact__burst"
            initial={{ opacity: 0.6, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.6 * scale }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
        <span className="impact__text">{labelByPower[power]}</span>
      </motion.div>
    </div>
  );
}
