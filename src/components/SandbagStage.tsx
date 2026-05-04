import { AnimatePresence } from "framer-motion";
import { Sandbag } from "./Sandbag";
import { FlyingWord } from "./FlyingWord";
import { ImpactEffect } from "./ImpactEffect";
import type { FlyingWord as FlyingWordType, PunchPower } from "../types/punch";

type Props = {
  flyingWords: FlyingWordType[];
  onWordComplete: (id: string) => void;
  onSandbagTap: () => void;
  hitKey: number;
  hitPower: PunchPower;
  hitCount: number;
  message: string;
};

export function SandbagStage({
  flyingWords,
  onWordComplete,
  onSandbagTap,
  hitKey,
  hitPower,
  hitCount,
  message,
}: Props) {
  return (
    <section className="stage" aria-label="サンドバッグの舞台">
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
      <Sandbag hitKey={hitKey} power={hitPower} onTap={onSandbagTap} />
      <ImpactEffect hitKey={hitKey} power={hitPower} />
      <AnimatePresence>
        {flyingWords.map((w) => (
          <FlyingWord key={w.id} word={w} onComplete={onWordComplete} />
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
