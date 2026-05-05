import { AnimatePresence } from "framer-motion";
import { Sandbag } from "./Sandbag";
import { FlyingWord } from "./FlyingWord";
import { ImpactEffect } from "./ImpactEffect";
import type {
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
  onSandbagTap: () => void;
  hitKey: number;
  hitPower: PunchPower;
  hitKind: ImpactKind;
  hitSide: number;
  hitIntensity: number;
  hitCount: number;
  message: string;
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
}: Props) {
  return (
    <section className="stage" aria-label="サンドバッグの舞台">
      <img className="ring-bg" src={ringSrc} alt="" aria-hidden="true" draggable={false} />
      <img
        className="chain-mount"
        src={chainSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <span className="stage__corner-tag" aria-hidden="true">
        受付中
      </span>
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
        onTap={onSandbagTap}
      />
      <ImpactEffect hitKey={hitKey} power={hitPower} kind={hitKind} side={hitSide} />
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
    </section>
  );
}
