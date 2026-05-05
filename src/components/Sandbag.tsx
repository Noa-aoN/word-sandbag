import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import type { ImpactKind, PunchPower } from "../types/punch";
import sandbagSrc from "../assets/sandbag/sandbag.png";
import dentMarkSrc from "../assets/sandbag/dent-mark.png";

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

const DENT_LIFETIME_MS = 720;
const POWER_DENT_SIZE: Record<PunchPower, number> = {
  light: 0.3,
  normal: 0.38,
  heavy: 0.46,
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

  const [dents, setDents] = useState<
    Array<{ id: number; xPct: number; yPct: number; sizePct: number; rotate: number }>
  >([]);
  const dentIdRef = useRef(0);
  const dentTimersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (hitKey === 0 || kind === "crunch") return;
    dentIdRef.current += 1;
    const id = dentIdRef.current;
    const sideShift = side === 0 ? 0 : side * 18;
    const xJitter = (Math.random() - 0.5) * 6;
    const yJitter = (Math.random() - 0.5) * 14;
    const baseSize =
      kind === "cat" ? 0.26 : kind === "tap" ? 0.28 : POWER_DENT_SIZE[power];
    const dent = {
      id,
      xPct: 50 + sideShift + xJitter,
      yPct: 56 + yJitter,
      sizePct: (baseSize + Math.random() * 0.06) * 100,
      rotate: (Math.random() - 0.5) * 70,
    };
    setDents((prev) => [...prev, dent]);
    const handle = window.setTimeout(() => {
      setDents((prev) => prev.filter((d) => d.id !== id));
      dentTimersRef.current.delete(handle);
    }, DENT_LIFETIME_MS);
    dentTimersRef.current.add(handle);
  }, [hitKey, kind, power, side]);

  useEffect(
    () => () => {
      dragRotate.stop();
      dragScaleY.stop();
      for (const h of dentTimersRef.current) window.clearTimeout(h);
      dentTimersRef.current.clear();
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
            <img className="sandbag-img" src={sandbagSrc} alt="" draggable={false} />
            <AnimatePresence>
              {dents.map((d) => (
                <motion.img
                  key={d.id}
                  className="sandbag-dent-mark"
                  src={dentMarkSrc}
                  alt=""
                  draggable={false}
                  style={{
                    left: `${d.xPct}%`,
                    top: `${d.yPct}%`,
                    width: `${d.sizePct}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.4, rotate: d.rotate, x: "-50%", y: "-50%" }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.4, 1, 1, 0.95],
                    rotate: d.rotate,
                    x: "-50%",
                    y: "-50%",
                  }}
                  exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                  transition={{
                    duration: DENT_LIFETIME_MS / 1000,
                    times: [0, 0.12, 0.55, 1],
                    ease: "easeOut",
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
