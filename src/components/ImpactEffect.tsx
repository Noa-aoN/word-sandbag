import { useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ImpactKind, PunchPower } from "../types/punch";
import burstSrc from "../assets/sandbag/burst.png";
import heartSrc from "../assets/sandbag/heart.png";

type Props = {
  hitKey: number;
  power: PunchPower;
  kind: ImpactKind;
  side: number;
  point: { x: number; y: number } | null;
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
  if (kind === "hook") return "ガッ";
  if (kind === "upper") return "ドカッ";
  if (kind === "kick") return "ドガッ";
  return PUNCH_LABEL[power];
}

export function ImpactEffect({ hitKey, power, kind, side, point }: Props) {
  const reduce = useReducedMotion();

  const scale = sizeByPower[power];
  const showBurst = !reduce && kind !== "crunch";
  const useTapPos = kind === "tap" && point !== null;
  const offsetPx =
    !useTapPos && (kind === "punch" || kind === "cat" || kind === "hook" || kind === "kick")
      ? side * 30
      : 0;
  const wrapStyle: CSSProperties = useTapPos && point
    ? {
        top: `${point.y}px`,
        left: `${point.x}px`,
        transform: "translate(-50%, -50%)",
      }
    : { transform: `translate(calc(-50% + ${offsetPx}px), -50%)` };

  // Memoize animate / transition by hit identity so framer-motion sees stable
  // references and does not restart the keyframes when the parent re-renders
  // (intensity decay, drag motion values etc.). Without this the burst image
  // can reappear / get stuck visible on later renders.
  const outerAnimate = useMemo(
    () => ({
      opacity: [0, 1, 0],
      scale: [0.6 * scale, 1.1 * scale, 0.95 * scale],
    }),
    [scale, hitKey],
  );
  const outerTransition = useMemo(
    () => ({ duration: reduce ? 0.2 : 0.55, times: [0, 0.3, 1] as [number, number, number] }),
    [reduce, hitKey],
  );
  const burstAnimate = useMemo(
    () => ({ opacity: [0.95, 0], scale: [0.5 * scale, 1.5 * scale], rotate: 12 }),
    [scale, hitKey],
  );
  const burstTransition = useMemo(
    () => ({ duration: 0.5, ease: "easeOut" as const }),
    [hitKey],
  );
  const auraOuterAnimate = useMemo(
    () => ({ opacity: [0, 0.7, 0.4, 0], scale: [0.35, 1.2, 1.6, 2.0] }),
    [hitKey],
  );
  const auraInnerAnimate = useMemo(
    () => ({ opacity: [0, 0.85, 0], scale: [0.5, 1.0, 1.4] }),
    [hitKey],
  );
  const heartAnimate = useMemo(
    () => ({
      opacity: [0, 1, 0.85, 0],
      scale: [0.4, 1.1, 1.05, 1.3],
      rotate: [-12, 0, 6, 14],
    }),
    [hitKey],
  );

  if (hitKey === 0) return null;

  return (
    <div className={`impact-wrap impact-wrap--${kind}`} style={wrapStyle} aria-hidden="true">
      <motion.div
        key={hitKey}
        className={`impact impact--${kind}`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={outerAnimate}
        transition={outerTransition}
      >
        {showBurst && (
          <motion.img
            className="impact__burst-img"
            src={burstSrc}
            alt=""
            draggable={false}
            initial={{ opacity: 0, scale: 0.4, rotate: -8 }}
            animate={burstAnimate}
            transition={burstTransition}
          />
        )}
        {kind === "crunch" && !reduce && (
          <>
            <motion.div
              className="impact__aura"
              initial={{ opacity: 0, scale: 0.35 }}
              animate={auraOuterAnimate}
              transition={{ duration: 1.05, ease: "easeOut", times: [0, 0.25, 0.6, 1] }}
            />
            <motion.div
              className="impact__aura impact__aura--inner"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={auraInnerAnimate}
              transition={{ duration: 0.95, ease: "easeOut", times: [0, 0.4, 1] }}
            />
            <motion.img
              className="impact__heart-img"
              src={heartSrc}
              alt=""
              draggable={false}
              initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
              animate={heartAnimate}
              transition={{ duration: 1.0, ease: "easeOut", times: [0, 0.25, 0.7, 1] }}
            />
          </>
        )}
        <span className="impact__text">{labelFor(kind, power)}</span>
      </motion.div>
    </div>
  );
}
