import { useMemo, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ImpactKind, PunchPower } from "../types/punch";

type Props = {
  hitKey: number;
  power: PunchPower;
  kind: ImpactKind;
  side: number;
  intensity: number;
  onTap?: () => void;
};

const punchSwayByPower: Record<
  PunchPower,
  { x: number[]; rotate: number[]; duration: number }
> = {
  light: { x: [0, -6, 5, -3, 0], rotate: [0, -2, 2, -1, 0], duration: 0.5 },
  normal: { x: [0, -12, 10, -7, 4, 0], rotate: [0, -5, 4, -3, 2, 0], duration: 0.65 },
  heavy: { x: [0, -20, 17, -12, 7, -3, 0], rotate: [0, -9, 7, -5, 3, -1, 0], duration: 0.85 },
};

const catSwayByPower: Record<
  PunchPower,
  { x: number[]; rotate: number[]; duration: number }
> = {
  light: { x: [0, -7, 6, -5, 0], rotate: [0, -1.5, 1.2, -0.8, 0], duration: 0.32 },
  normal: { x: [0, -10, 9, -7, 4, 0], rotate: [0, -2, 1.8, -1, 0.4, 0], duration: 0.4 },
  heavy: { x: [0, -14, 12, -9, 5, 0], rotate: [0, -3, 2, -1.5, 0.6, 0], duration: 0.46 },
};

export function Sandbag({ hitKey, power, kind, side, intensity, onTap }: Props) {
  const reduce = useReducedMotion();

  const interactive = typeof onTap === "function";
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onTap) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap();
    }
  };

  const idleAnimate = reduce ? { rotate: 0 } : { rotate: [0, 2, -2, 0] };
  const idleTransition = reduce
    ? { duration: 0 }
    : { duration: 5.4, repeat: Infinity, ease: "easeInOut" as const };

  const { hitAnimate, hitTransition } = useMemo(() => {
    if (hitKey === 0) {
      return {
        hitAnimate: { x: 0, rotate: 0, scale: 1 },
        hitTransition: { duration: 0 },
      };
    }
    if (reduce) {
      return {
        hitAnimate: { x: 0, rotate: 0, scale: 1 },
        hitTransition: { duration: 0 },
      };
    }
    if (kind === "crunch") {
      return {
        hitAnimate: {
          x: 0,
          rotate: [0, -1, 0],
          scale: [1, 0.93, 1.02, 1],
        },
        hitTransition: { duration: 0.55, ease: "easeOut" as const },
      };
    }
    const base = kind === "cat" ? catSwayByPower[power] : punchSwayByPower[power];
    const flip = side === -1 ? -1 : 1;
    const amp = Math.min(3, Math.max(0.9, intensity));
    const durMul = Math.min(1.4, 0.85 + amp * 0.15);
    return {
      hitAnimate: {
        x: base.x.map((v) => v * flip * amp),
        rotate: base.rotate.map((v) => v * flip * amp),
        scale: 1,
      },
      hitTransition: { duration: base.duration * durMul, ease: "easeOut" as const },
    };
  }, [hitKey, kind, power, reduce, side, intensity]);

  const eyesClosed = kind === "crunch";

  return (
    <motion.div
      className={`stage__sandbag-anchor${interactive ? " stage__sandbag-anchor--interactive" : ""}`}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? "サンドバッグを叩いたり引っ張ったりする" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onTap={interactive ? () => onTap?.() : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      drag={interactive}
      dragConstraints={{ left: -90, right: 90, top: -45, bottom: 100 }}
      dragElastic={0.4}
      dragSnapToOrigin
      dragTransition={{ bounceStiffness: 220, bounceDamping: 12 }}
      whileDrag={{ scale: 1.04 }}
      style={{ touchAction: "none" }}
    >
      <motion.div
        className="stage__sandbag-idle"
        animate={idleAnimate}
        transition={idleTransition}
        style={{ originY: 0 }}
      >
        <motion.div
          className="stage__sandbag-motion"
          key={hitKey}
          animate={hitAnimate}
          transition={hitTransition}
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
            <g className="sandbag__face">
              <ellipse className="sandbag__cheek" cx="40" cy="66" rx="5" ry="3" />
              <ellipse className="sandbag__cheek" cx="80" cy="66" rx="5" ry="3" />
              {eyesClosed ? (
                <>
                  <path
                    className="sandbag__eye-line"
                    d="M44 58 Q49 55 54 58"
                  />
                  <path
                    className="sandbag__eye-line"
                    d="M66 58 Q71 55 76 58"
                  />
                </>
              ) : (
                <>
                  <circle className="sandbag__eye" cx="49" cy="58" r="3" />
                  <circle className="sandbag__eye" cx="71" cy="58" r="3" />
                  <circle className="sandbag__eye-shine" cx="48" cy="57" r="1" />
                  <circle className="sandbag__eye-shine" cx="70" cy="57" r="1" />
                </>
              )}
              <path
                className="sandbag__mouth"
                d={
                  eyesClosed
                    ? "M55 70 Q60 73 65 70"
                    : "M55 69 Q60 73 65 69"
                }
              />
            </g>
            <rect className="sandbag__band" x="28" y="78" width="64" height="10" />
            <rect className="sandbag__band" x="28" y="118" width="64" height="10" />
            <path
              className="sandbag__shine"
              d="M40 46 Q44 100 42 150 Q38 100 38 50 Z"
            />
            <ellipse className="sandbag__cap" cx="60" cy="160" rx="32" ry="8" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
