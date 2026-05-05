import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import type { BagState, ImpactKind, PunchPower } from "../types/punch";
import sandbagSrc from "../assets/sandbag/sandbag.png";
import dentMarkSrc from "../assets/sandbag/dent-mark.png";
import { tapPointToBagPercent } from "../lib/tap-position";

type Props = {
  hitKey: number;
  power: PunchPower;
  kind: ImpactKind;
  side: number;
  intensity: number;
  bagState: BagState;
  onTap?: (side: number, clientPoint: { x: number; y: number } | null) => void;
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

const DENT_HOLD_MS = 480;
const DENT_FADE_IN_S = 0.14;
const DENT_FADE_OUT_S = 0.32;
const POWER_DENT_SIZE: Record<PunchPower, number> = {
  light: 0.46,
  normal: 0.58,
  heavy: 0.72,
};
const DRAG_ROTATE_FACTOR = 0.32;
const DRAG_ROTATE_MAX = 32;
const DRAG_STRETCH_FACTOR = 0.0009;
const DRAG_STRETCH_MAX = 1.07;
const DRAG_SPRING = { type: "spring" as const, stiffness: 220, damping: 12 };

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function Sandbag({
  hitKey,
  power,
  kind,
  side,
  intensity,
  bagState,
  onTap,
}: Props) {
  const reduce = useReducedMotion();
  const anchorRef = useRef<HTMLDivElement>(null);

  const interactive = typeof onTap === "function" && bagState === "active";

  const dragRotate = useMotionValue(0);
  const dragScaleY = useMotionValue(1);
  const dragActiveRef = useRef(false);

  const [dents, setDents] = useState<
    Array<{ id: number; xPct: number; yPct: number; sizePct: number; rotate: number }>
  >([]);
  const dentIdRef = useRef(0);
  const dentTimersRef = useRef<Set<number>>(new Set());
  const lastDentHitKeyRef = useRef(0);

  const pushDent = useCallback((xPct: number, yPct: number, baseSize: number) => {
    const safeX = Number.isFinite(xPct) ? Math.min(96, Math.max(4, xPct)) : 50;
    const safeY = Number.isFinite(yPct) ? Math.min(96, Math.max(4, yPct)) : 56;
    const safeSize = Number.isFinite(baseSize) ? Math.min(0.95, Math.max(0.18, baseSize)) : 0.4;
    dentIdRef.current += 1;
    const id = dentIdRef.current;
    const dent = {
      id,
      xPct: safeX,
      yPct: safeY,
      sizePct: (safeSize + Math.random() * 0.06) * 100,
      rotate: (Math.random() - 0.5) * 70,
    };
    setDents((prev) => [...prev, dent]);
    const handle = window.setTimeout(() => {
      setDents((prev) => prev.filter((d) => d.id !== id));
      dentTimersRef.current.delete(handle);
    }, DENT_HOLD_MS);
    dentTimersRef.current.add(handle);
  }, []);

  const handleTapAt = (point: { x: number; y: number } | null) => {
    if (!onTap || bagState !== "active") return;
    // Anchor stays unrotated while bagState === "active" (anchorAnimate is the
    // identity in that branch), so its rect is a stable design-space frame for
    // the bag — independent of idle sway / drag / hit motion which rotate the
    // children. This avoids the rotated-AABB drift that grows with bag size.
    const anchor = anchorRef.current;
    const rect = anchor ? anchor.getBoundingClientRect() : null;
    const { xPct, yPct, side: tapSide } = tapPointToBagPercent(point, rect);
    pushDent(xPct, yPct, 0.4);
    onTap(tapSide, point);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onTap) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTapAt(null);
    }
  };

  useEffect(() => {
    if (hitKey === 0 || kind === "crunch" || kind === "tap") return;
    // Dedupe: only the first effect run for a given hitKey produces a dent.
    // Guards against StrictMode re-invocation and any duplicate render path.
    if (lastDentHitKeyRef.current === hitKey) return;
    lastDentHitKeyRef.current = hitKey;
    const sideMag = kind === "hook" ? 28 : 18;
    // Hook: dent appears on the side that received the force (opposite the swing direction)
    const sideShift =
      side === 0 ? 0 : kind === "hook" ? -side * sideMag : side * sideMag;
    const xJitter = (Math.random() - 0.5) * (kind === "hook" ? 4 : 6);
    const yJitter = (Math.random() - 0.5) * 14;
    const baseSize =
      kind === "cat"
        ? 0.4
        : kind === "hook"
          ? 0.82
          : kind === "upper"
            ? 0.6
            : POWER_DENT_SIZE[power];
    const yPos = kind === "upper" ? 78 : 56;
    pushDent(50 + sideShift + xJitter, yPos + yJitter, baseSize);
  }, [hitKey, kind, power, side, pushDent]);

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

  const anchorAnimate = useMemo(() => {
    switch (bagState) {
      case "departing":
        return { x: 560, y: -600, rotate: 720, scale: 0.32, opacity: 0 };
      case "missing":
        return { x: 0, y: -260, rotate: 0, scale: 0.85, opacity: 0 };
      default:
        return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };
    }
  }, [bagState]);

  const anchorTransition = useMemo(() => {
    switch (bagState) {
      case "departing":
        return { duration: 1.4, ease: "easeIn" as const };
      case "missing":
        return { duration: 0 };
      default:
        return { type: "spring" as const, stiffness: 220, damping: 14, duration: 0.7 };
    }
  }, [bagState]);

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

    const amp = Math.min(3, Math.max(0.9, intensity));
    const durMul = Math.min(1.4, 0.85 + amp * 0.15);

    // Uppercut OR center body hit: bag pushed up + tilts back (rotateX),
    // slight scale + y shift convey depth without scaleX/Y stretching.
    const isUpperLike =
      kind === "upper" ||
      (side === 0 && (kind === "punch" || kind === "tap" || kind === "cat"));
    if (isUpperLike) {
      const intensityCap = Math.min(1.4, amp);
      return {
        hitAnimate: {
          rotateX: [0, -22 * intensityCap, 8, -3, 0],
          scale: [1, 1.05 + amp * 0.01, 0.96, 1.01, 1],
          y: [0, -8 - amp * 2, -2, 0, 0],
          rotate: 0,
        },
        hitTransition: { duration: 0.72 * durMul, ease: "easeOut" as const },
      };
    }

    if (kind === "hook") {
      const swayBase = punchSwayByPower.heavy;
      const flip = side === -1 ? -1 : 1;
      return {
        hitAnimate: {
          rotate: swayBase.rotate.map((v) => v * flip * amp * 1.25),
          rotateX: [0, -3, 1, 0],
          scale: 1,
        },
        hitTransition: { duration: swayBase.duration * durMul * 1.1, ease: "easeOut" as const },
      };
    }

    // Side hits (punch / cat / tap with side ≠ 0)
    const base = kind === "cat" ? catSwayByPower[power] : punchSwayByPower[power];
    const flip = side === -1 ? -1 : 1;
    return {
      hitAnimate: {
        rotate: base.rotate.map((v) => v * flip * amp),
        scale: 1,
      },
      hitTransition: { duration: base.duration * durMul, ease: "easeOut" as const },
    };
  }, [hitKey, kind, power, reduce, side, intensity]);

  // Ground shadow scales with bag's "depth": bigger when bag is forward (close), smaller when back.
  const { shadowAnimate, shadowTransition } = useMemo(() => {
    if (hitKey === 0 || reduce) {
      return { shadowAnimate: { scaleX: 1, opacity: 0.85 }, shadowTransition: { duration: 0 } };
    }
    const amp = Math.min(3, Math.max(0.9, intensity));
    if (kind === "crunch") {
      return {
        shadowAnimate: { scaleX: [1, 0.9, 1.04, 1], opacity: [0.85, 0.95, 0.85, 0.85] },
        shadowTransition: { duration: 0.55, ease: "easeOut" as const },
      };
    }
    if (kind === "upper") {
      return {
        shadowAnimate: {
          scaleX: [1, 0.78 - amp * 0.04, 0.9, 0.97, 1],
          opacity: [0.85, 0.5, 0.7, 0.82, 0.85],
        },
        shadowTransition: { duration: 0.72, ease: "easeOut" as const },
      };
    }
    if ((kind === "punch" || kind === "tap" || kind === "cat") && side === 0) {
      return {
        shadowAnimate: {
          scaleX: [1, 1.14 + amp * 0.03, 0.94, 1.02, 1],
          opacity: [0.85, 0.55, 0.8, 0.85, 0.85],
        },
        shadowTransition: { duration: 0.6, ease: "easeOut" as const },
      };
    }
    return { shadowAnimate: { scaleX: 1, opacity: 0.85 }, shadowTransition: { duration: 0 } };
  }, [hitKey, kind, side, intensity, reduce]);

  return (
    <motion.div
      ref={anchorRef}
      className={`stage__sandbag-anchor${interactive ? " stage__sandbag-anchor--interactive" : ""}`}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? "サンドバッグを叩いたり引っ張ったりする" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onTap={interactive ? (_e, info) => handleTapAt(info.point ?? null) : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onPanStart={interactive ? handlePanStart : undefined}
      onPan={interactive ? handlePan : undefined}
      onPanEnd={interactive ? handlePanEnd : undefined}
      animate={anchorAnimate}
      transition={anchorTransition}
      style={{ touchAction: "none", perspective: "900px" }}
    >
      <motion.div
        className="sandbag-shadow"
        animate={shadowAnimate}
        transition={shadowTransition}
        aria-hidden="true"
      />
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
                  animate={{ opacity: 1, scale: 1, rotate: d.rotate, x: "-50%", y: "-50%" }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    x: "-50%",
                    y: "-50%",
                    transition: { duration: DENT_FADE_OUT_S, ease: "easeIn" },
                  }}
                  transition={{ duration: DENT_FADE_IN_S, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
