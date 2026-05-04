import { motion, useReducedMotion } from "framer-motion";
import type { ImpactKind, PunchPower } from "../types/punch";

type Props = {
  hitKey: number;
  power: PunchPower;
  kind: ImpactKind;
  side: number;
};

const PUNCH_LABEL: Record<PunchPower, string> = {
  light: "ポンッ",
  normal: "バシッ",
  heavy: "ドゴッ",
};

const sizeByPower: Record<PunchPower, number> = {
  light: 0.85,
  normal: 1,
  heavy: 1.25,
};

function labelFor(kind: ImpactKind, power: PunchPower): string {
  if (kind === "cat") return "にゃっ";
  if (kind === "crunch") return "ぎゅっ";
  if (kind === "tap") return "ポン";
  return PUNCH_LABEL[power];
}

export function ImpactEffect({ hitKey, power, kind, side }: Props) {
  const reduce = useReducedMotion();
  if (hitKey === 0) return null;

  const scale = sizeByPower[power];
  const showBurst = !reduce && kind !== "crunch";
  const burstColor = kind === "cat" ? "var(--vermilion-soft)" : "var(--vermilion-soft)";
  const offsetPx = (kind === "punch" || kind === "cat") ? side * 30 : 0;
  const wrapStyle = {
    transform: `translate(calc(-50% + ${offsetPx}px), -50%)`,
  };

  return (
    <div className={`impact-wrap impact-wrap--${kind}`} style={wrapStyle} aria-hidden="true">
      <motion.div
        key={hitKey}
        className={`impact impact--${kind}`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.6 * scale, 1.1 * scale, 0.95 * scale],
        }}
        transition={{ duration: reduce ? 0.2 : 0.55, times: [0, 0.3, 1] }}
      >
        {showBurst && (
          <motion.span
            className="impact__burst"
            initial={{ opacity: 0.6, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.6 * scale }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ borderColor: burstColor }}
          />
        )}
        <span className="impact__text">{labelFor(kind, power)}</span>
      </motion.div>
    </div>
  );
}
