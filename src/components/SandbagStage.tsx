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

type Props = {
  flyingWords: FlyingWordType[];
  onWordComplete: (id: string) => void;
  onCharImpact: (power: PunchPower, kind: PunchKind) => void;
  onSandbagTap: () => void;
  hitKey: number;
  hitPower: PunchPower;
  hitKind: ImpactKind;
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
  hitCount,
  message,
}: Props) {
  return (
    <section className="stage" aria-label="サンドバッグの舞台">
      <div className="ring" aria-hidden="true">
        <span className="ring-rope ring-rope--top" />
        <span className="ring-rope ring-rope--mid" />
        <span className="ring-rope ring-rope--bot" />
        <span className="ring-post ring-post--l" />
        <span className="ring-post ring-post--r" />
        <span className="ring-canvas" />
      </div>
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
      <Sandbag hitKey={hitKey} power={hitPower} kind={hitKind} onTap={onSandbagTap} />
      <ImpactEffect hitKey={hitKey} power={hitPower} kind={hitKind} />
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
