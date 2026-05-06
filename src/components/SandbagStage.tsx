import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sandbag } from "./Sandbag";
import { FlyingWord } from "./FlyingWord";
import { ImpactEffect } from "./ImpactEffect";
import { TowelOverlay } from "./TowelOverlay";
import type {
  BagState,
  FlyingWord as FlyingWordType,
  ImpactKind,
  PunchKind,
  PunchPower,
} from "../types/punch";
import ringSrc from "../assets/sandbag/ring.png";
import chainSrc from "../assets/sandbag/chain.png";

type Props = {
  flyingWords: FlyingWordType[];
  onWordComplete: (id: string) => void;
  onCharImpact: (power: PunchPower, kind: PunchKind, side: number) => void;
  onSandbagTap: (side: number) => void;
  hitKey: number;
  hitPower: PunchPower;
  hitKind: ImpactKind;
  hitSide: number;
  hitIntensity: number;
  hitCount: number;
  message: string;
  bagState: BagState;
  towelKey: number;
};

export function SandbagStage({
  flyingWords,
  onWordComplete,
  onCharImpact,
  onSandbagTap,
  hitKey,
  hitPower,
  hitKind,
  hitSide,
  hitIntensity,
  hitCount,
  message,
  bagState,
  towelKey,
}: Props) {
  const stageRef = useRef<HTMLElement>(null);
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null);
  const [towelInstance, setTowelInstance] = useState<number | null>(null);

  useEffect(() => {
    if (towelKey === 0) return;
    setTowelInstance(towelKey);
    const t = window.setTimeout(() => {
      setTowelInstance(null);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [towelKey]);

  const handleTap = (side: number, clientPoint: { x: number; y: number } | null) => {
    if (clientPoint && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      setTapPoint({
        x: clientPoint.x - rect.left,
        y: clientPoint.y - rect.top,
      });
    } else {
      setTapPoint(null);
    }
    onSandbagTap(side);
  };

  return (
    <section ref={stageRef} className="stage" aria-label="サンドバッグの舞台">
      <img className="ring-bg" src={ringSrc} alt="" aria-hidden="true" draggable={false} />
      <img
        className="chain-mount"
        src={chainSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      {hitCount > 0 && (
        <div
          key={hitCount}
          className="stage__seal"
          aria-label={`このセッションで${hitCount}回パンチしました`}
        >
          <span className="stage__seal-num">{hitCount}</span>
          <span className="stage__seal-suf">発</span>
        </div>
      )}
      <Sandbag
        hitKey={hitKey}
        power={hitPower}
        kind={hitKind}
        side={hitSide}
        intensity={hitIntensity}
        bagState={bagState}
        onTap={handleTap}
      />
      <ImpactEffect
        hitKey={hitKey}
        power={hitPower}
        kind={hitKind}
        side={hitSide}
        point={tapPoint}
      />
      <AnimatePresence>
        {flyingWords.map((w) => (
          <FlyingWord
            key={w.id}
            word={w}
            onComplete={onWordComplete}
            onCharImpact={onCharImpact}
          />
        ))}
      </AnimatePresence>
      {message && (
        <p className="stage__message" aria-live="polite">
          {message}
        </p>
      )}
      <AnimatePresence>
        {towelInstance !== null && <TowelOverlay key={towelInstance} />}
      </AnimatePresence>
    </section>
  );
}
