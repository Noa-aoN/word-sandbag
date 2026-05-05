import { useRef, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPunch: () => void;
  onCrunch: () => void;
  onHook: () => void;
  onUpper: () => void;
  onQuickPunch: (text: string) => void;
  onCatPunch: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  speedRange: { min: number; max: number; step: number };
  soundOn: boolean;
  onToggleSound: () => void;
  maxLength?: number;
};

const MAX = 200;

const QUICK_PRESETS = [
  "ふざけんな",
  "まあいっか",
  "なんでだよ",
  "ありがとう",
  "お疲れさま",
] as const;

const CAT_LABEL = "(=^.^=)";

function speedTier(v: number): string {
  if (v < 0.85) return "ゆっくり";
  if (v < 1.15) return "ふつう";
  return "はやい";
}

export function InputPanel({
  value,
  onChange,
  onPunch,
  onCrunch,
  onHook,
  onUpper,
  onQuickPunch,
  onCatPunch,
  speed,
  onSpeedChange,
  speedRange,
  soundOn,
  onToggleSound,
  maxLength = MAX,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canDispatch = trimmed.length > 0;
  const overHalf = value.length > maxLength * 0.7;
  const speedDisplay = `${speed.toFixed(1)}×`;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canDispatch) onPunch();
    }
  };

  return (
    <section className="input-panel" aria-label="入力エリア">
      {/* 1. 速度 / 効果音 */}
      <div className="settings-row">
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

      {/* 2. プリセット */}
      <div className="quick-punches">
        <div className="quick-punches__head">
          <span className="quick-punches__label">サクッとパンチ</span>
          <span className="quick-punches__tag" aria-hidden="true">
            PRESET
          </span>
        </div>
        <div className="quick-punches__row" role="group" aria-label="プリセットのパンチ">
          {QUICK_PRESETS.map((preset, i) => (
            <button
              key={preset}
              type="button"
              className="quick-punch-button"
              onClick={() => onQuickPunch(preset)}
              aria-label={`「${preset}」とパンチする`}
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 文字入力 */}
      <div className="input-panel__textarea-wrap">
        <textarea
          ref={ref}
          className="input-panel__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder="ここに吐き出す..."
          aria-label="ぶつけたい言葉を入力"
          rows={3}
          maxLength={maxLength}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="send"
        />
        {value.length > 0 && (
          <span
            className={`input-panel__counter${overHalf ? " input-panel__counter--heavy" : ""}`}
            aria-hidden="true"
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <p className="input-panel__hint">Enterでパンチ。Shift+Enterで改行。</p>

      {/* 4. 言葉パンチ */}
      <div className="action-row action-row--main">
        <button
          type="button"
          className="punch-button"
          onClick={onPunch}
          disabled={!canDispatch}
          aria-label="言葉パンチする"
        >
          言葉パンチする
        </button>
      </div>

      {/* 5. フック / アッパー / クランチ */}
      <div className="action-row action-row--variant">
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
          className="variant-button variant-button--crunch"
          onClick={onCrunch}
          aria-label="やさしくクランチする"
        >
          クランチする
        </button>
      </div>

      {/* 6. 特殊パンチ */}
      <div className="special-punches">
        <div className="special-punches__head">
          <span className="special-punches__label">特殊パンチ</span>
          <span className="special-punches__tag" aria-hidden="true">
            SPECIAL
          </span>
        </div>
        <div className="special-punches__row" role="group" aria-label="特殊パンチ">
          <button
            type="button"
            className="quick-punch-button quick-punch-button--cat"
            onClick={onCatPunch}
            aria-label="猫パンチを放つ"
          >
            {CAT_LABEL}
          </button>
        </div>
      </div>
    </section>
  );
}
