type Props = {
  onCrunch: () => void;
  onHook: () => void;
  onUpper: () => void;
  onKick: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  speedRange: { min: number; max: number; step: number };
  soundOn: boolean;
  onToggleSound: () => void;
};

function speedTier(v: number): string {
  if (v < 0.85) return "ゆっくり";
  if (v < 1.15) return "ふつう";
  return "はやい";
}

export function SkillPanel({
  onCrunch,
  onHook,
  onUpper,
  onKick,
  speed,
  onSpeedChange,
  speedRange,
  soundOn,
  onToggleSound,
}: Props) {
  const speedDisplay = `${speed.toFixed(1)}×`;

  return (
    <aside className="side-panel side-panel--right" aria-label="右パネル">
      <section className="side-section">
        <div className="side-section__head">
          <span className="side-section__label">設定</span>
        </div>
        <div className="settings-row settings-row--stack">
          <div className="speed-control">
            <span className="speed-control__label">パンチ速度</span>
            <input
              type="range"
              className="speed-control__slider"
              min={speedRange.min}
              max={speedRange.max}
              step={speedRange.step}
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              aria-label="文字とパンチの速度"
              aria-valuetext={`${speedTier(speed)} ${speedDisplay}`}
            />
            <span className="speed-control__readout">
              <span className="speed-control__tier">{speedTier(speed)}</span>
              <span className="speed-control__num">{speedDisplay}</span>
            </span>
          </div>
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
        </div>
      </section>

      <section className="side-section">
        <div className="side-section__head">
          <span className="side-section__label">技</span>
          <span className="side-section__tag" aria-hidden="true">
            SKILL
          </span>
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
    </aside>
  );
}
