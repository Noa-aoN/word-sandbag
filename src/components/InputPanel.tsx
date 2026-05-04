import { useRef, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPunch: () => void;
  onCrunch: () => void;
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
      <div className="settings-row">
        <div className="speed-control">
          <span className="speed-control__label">速度</span>
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

      <div className="action-row">
        <button
          type="button"
          className="punch-button"
          onClick={onPunch}
          disabled={!canDispatch}
          aria-label="パンチする"
        >
          パンチする
        </button>
        <button
          type="button"
          className="crunch-button"
          onClick={onCrunch}
          aria-label="やさしくクランチする"
        >
          クランチする
        </button>
      </div>

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
          <button
            type="button"
            className="quick-punch-button quick-punch-button--cat"
            onClick={onCatPunch}
            aria-label="猫パンチを放つ"
            style={{ animationDelay: `${0.06 * QUICK_PRESETS.length}s` }}
          >
            {CAT_LABEL}
          </button>
        </div>
      </div>
    </section>
  );
}
