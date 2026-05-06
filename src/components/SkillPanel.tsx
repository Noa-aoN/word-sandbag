import catIconSrc from "../assets/sandbag/paw-right.png";
import cashIconSrc from "../assets/sandbag/cash.png";

type Props = {
  onCrunch: () => void;
  onHook: () => void;
  onUpper: () => void;
  onKick: () => void;
  onCatPunch: () => void;
  onCashPunch: () => void;
  onThrowTowel: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  speedRange: { min: number; max: number; step: number };
  soundOn: boolean;
  onToggleSound: () => void;
};

const SPEED_TIERS: ReadonlyArray<{ label: string; value: number }> = [
  { label: "ゆっくり", value: 1.0 },
  { label: "ふつう", value: 1.6 },
  { label: "はやい", value: 2.0 },
  { label: "全力", value: 2.4 },
];

function nearestTierIndex(current: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < SPEED_TIERS.length; i++) {
    const d = Math.abs(SPEED_TIERS[i].value - current);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function SkillPanel({
  onCrunch,
  onHook,
  onUpper,
  onKick,
  onCatPunch,
  onCashPunch,
  onThrowTowel,
  speed,
  onSpeedChange,
  speedRange: _speedRange,
  soundOn,
  onToggleSound,
}: Props) {
  const activeTier = nearestTierIndex(speed);

  return (
    <aside className="side-panel side-panel--right" aria-label="右パネル">
      <header className="side-panel__head">
        <span className="side-panel__title">設定</span>
      </header>

      <section className="side-section side-section--settings">
        <button
          type="button"
          className={`sound-toggle${soundOn ? " sound-toggle--on" : ""}`}
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "効果音をオフにする" : "効果音をオンにする"}
        >
          <span className="sound-toggle__dot" aria-hidden="true" />
          <span className="sound-toggle__label">{soundOn ? "音 ON" : "音 OFF"}</span>
        </button>

        <div className="speed-tier">
          <span className="speed-tier__label">パンチ速度</span>
          <div className="speed-tier__grid" role="group" aria-label="パンチ速度">
            {SPEED_TIERS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                className={`speed-tier__btn${i === activeTier ? " speed-tier__btn--on" : ""}`}
                onClick={() => onSpeedChange(t.value)}
                aria-pressed={i === activeTier}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <header className="side-panel__head side-panel__head--mid">
        <span className="side-panel__title">操作</span>
      </header>

      <section className="side-section">
        <div className="side-section__head">
          <span className="side-section__label">技</span>
        </div>
        <div className="side-section__list" role="group" aria-label="技">
          <button
            type="button"
            className="variant-button variant-button--hook"
            onClick={onHook}
            aria-label="フックを放つ"
          >
            フックする
          </button>
          <button
            type="button"
            className="variant-button variant-button--upper"
            onClick={onUpper}
            aria-label="アッパーを放つ"
          >
            アッパーする
          </button>
          <button
            type="button"
            className="variant-button variant-button--kick"
            onClick={onKick}
            aria-label="キックを放つ"
          >
            キックする
          </button>
          <button
            type="button"
            className="variant-button variant-button--crunch"
            onClick={onCrunch}
            aria-label="やさしくクランチする"
          >
            クランチする
          </button>
        </div>
      </section>

      <section className="side-section side-section--divided">
        <div className="side-section__head">
          <span className="side-section__label">特殊パンチ</span>
        </div>
        <div className="side-section__list side-section__list--center side-section__list--row" role="group" aria-label="特殊パンチ">
          <button
            type="button"
            className="quick-punch-button quick-punch-button--cat"
            onClick={onCatPunch}
            aria-label="猫パンチを放つ"
          >
            <img
              className="quick-punch-button__icon"
              src={catIconSrc}
              alt=""
              draggable={false}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="quick-punch-button quick-punch-button--cash"
            onClick={onCashPunch}
            aria-label="札束パンチを放つ"
          >
            <img
              className="quick-punch-button__icon"
              src={cashIconSrc}
              alt=""
              draggable={false}
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <section className="side-section side-section--divided">
        <button
          type="button"
          className="towel-button"
          onClick={onThrowTowel}
          aria-label="タオルを投げて言葉パンチを途中で終わらせる"
        >
          タオルを投げる
        </button>
      </section>
    </aside>
  );
}
