import type { KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PunchPower } from "../types/punch";

type Props = {
  hitKey: number;
  power: PunchPower;
  onTap?: () => void;
};

const swayByPower: Record<PunchPower, { x: number[]; rotate: number[]; duration: number }> = {
  light: { x: [0, -6, 5, -3, 0], rotate: [0, -2, 2, -1, 0], duration: 0.5 },
  normal: { x: [0, -12, 10, -7, 4, 0], rotate: [0, -5, 4, -3, 2, 0], duration: 0.65 },
  heavy: { x: [0, -20, 17, -12, 7, -3, 0], rotate: [0, -9, 7, -5, 3, -1, 0], duration: 0.85 },
};

const idleSway = {
  rotate: [0, 1.4, -1.4, 0],
  transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const },
};

export function Sandbag({ hitKey, power, onTap }: Props) {
  const reduce = useReducedMotion();
  const sway = swayByPower[power];

  const animate =
    hitKey > 0
      ? reduce
        ? { x: 0, rotate: 0 }
        : { x: sway.x, rotate: sway.rotate }
      : reduce
        ? { rotate: 0 }
        : idleSway;

  const transition =
    hitKey > 0
      ? { duration: reduce ? 0 : sway.duration, ease: "easeOut" as const }
      : reduce
        ? { duration: 0 }
        : idleSway.transition;

  const interactive = typeof onTap === "function";
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onTap) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap();
    }
  };

  return (
    <div
      className={`stage__sandbag-anchor${interactive ? " stage__sandbag-anchor--interactive" : ""}`}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? "サンドバッグを叩く" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onTap}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <motion.div
        className="stage__sandbag-motion"
        key={hitKey}
        animate={animate}
        transition={transition}
        style={{ originY: 0 }}
      >
        <svg
          className="sandbag"
          viewBox="0 0 120 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sandbagGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e35a37" />
              <stop offset="50%" stopColor="#c5392a" />
              <stop offset="100%" stopColor="#7a1d0c" />
            </linearGradient>
          </defs>
          <path className="sandbag__chain" d="M50 6 L60 24" />
          <path className="sandbag__chain" d="M70 6 L60 24" />
          <rect className="sandbag__cap" x="40" y="22" width="40" height="14" rx="4" />
          <path
            className="sandbag__body-main"
            d="M30 40 Q60 32 90 40 L92 156 Q60 168 28 156 Z"
          />
          <rect className="sandbag__band" x="28" y="78" width="64" height="10" />
          <rect className="sandbag__band" x="28" y="118" width="64" height="10" />
          <path
            className="sandbag__shine"
            d="M40 46 Q44 100 42 150 Q38 100 38 50 Z"
          />
          <ellipse className="sandbag__cap" cx="60" cy="160" rx="32" ry="8" />
        </svg>
      </motion.div>
    </div>
  );
}
