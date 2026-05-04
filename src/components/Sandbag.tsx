import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import type { ImpactKind, PunchPower } from "../types/punch";

type Props = {
  hitKey: number;
  power: PunchPower;
  kind: ImpactKind;
  side: number;
  intensity: number;
  onTap?: () => void;
};

const punchSwayByPower: Record<PunchPower, { rotate: number[]; duration: number }> = {
  light: { rotate: [0, -3.5, 2.8, -1.8, 0.8, 0], duration: 0.55 },
  normal: { rotate: [0, -8, 6.2, -4, 2, 0], duration: 0.7 },
  heavy: { rotate: [0, -12, 9, -6, 3.5, -1.2, 0], duration: 0.92 },
};

const catSwayByPower: Record<PunchPower, { rotate: number[]; duration: number }> = {
  light: { rotate: [0, -2.8, 2.5, -1.6, 0.6, 0], duration: 0.34 },
  normal: { rotate: [0, -4, 3.2, -2, 1, 0], duration: 0.42 },
  heavy: { rotate: [0, -5, 4, -2.5, 1.2, 0], duration: 0.5 },
};

const DRAG_ROTATE_FACTOR = 0.32;
const DRAG_ROTATE_MAX = 32;
const DRAG_STRETCH_FACTOR = 0.0009;
const DRAG_STRETCH_MAX = 1.07;
const DRAG_SPRING = { type: "spring" as const, stiffness: 220, damping: 12 };

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

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

  const dragRotate = useMotionValue(0);
  const dragScaleY = useMotionValue(1);
  const dragActiveRef = useRef(false);

  useEffect(
    () => () => {
      dragRotate.stop();
      dragScaleY.stop();
    },
    [dragRotate, dragScaleY],
  );

  const handlePanStart = () => {
    dragActiveRef.current = true;
    dragRotate.stop();
    dragScaleY.stop();
  };

  const handlePan = (_e: PointerEvent, info: PanInfo) => {
    if (!dragActiveRef.current) return;
    const r = clamp(-info.offset.x * DRAG_ROTATE_FACTOR, -DRAG_ROTATE_MAX, DRAG_ROTATE_MAX);
    const stretch = 1 + Math.max(0, info.offset.y) * DRAG_STRETCH_FACTOR;
    dragRotate.set(r);
    dragScaleY.set(Math.min(DRAG_STRETCH_MAX, stretch));
  };

  const handlePanEnd = () => {
    dragActiveRef.current = false;
    if (reduce) {
      dragRotate.set(0);
      dragScaleY.set(1);
      return;
    }
    animate(dragRotate, 0, DRAG_SPRING);
    animate(dragScaleY, 1, DRAG_SPRING);
  };

  const idleAnimate = reduce ? { rotate: 0 } : { rotate: [0, 2, -2, 0] };
  const idleTransition = reduce
    ? { duration: 0 }
    : { duration: 5.4, repeat: Infinity, ease: "easeInOut" as const };

  const { hitAnimate, hitTransition } = useMemo(() => {
    if (hitKey === 0) {
      return {
        hitAnimate: { rotate: 0, scale: 1 },
        hitTransition: { duration: 0 },
      };
    }
    if (reduce) {
      return {
        hitAnimate: { rotate: 0, scale: 1 },
        hitTransition: { duration: 0 },
      };
    }
    if (kind === "crunch") {
      return {
        hitAnimate: {
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
      onPanStart={interactive ? handlePanStart : undefined}
      onPan={interactive ? handlePan : undefined}
      onPanEnd={interactive ? handlePanEnd : undefined}
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
          <motion.div
            className="stage__sandbag-drag"
            style={{ rotate: dragRotate, scaleY: dragScaleY, originY: 0 }}
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
                    <path className="sandbag__eye-line" d="M44 58 Q49 55 54 58" />
                    <path className="sandbag__eye-line" d="M66 58 Q71 55 76 58" />
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
                  d={eyesClosed ? "M55 70 Q60 73 65 70" : "M55 69 Q60 73 65 69"}
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
    </motion.div>
  );
}
