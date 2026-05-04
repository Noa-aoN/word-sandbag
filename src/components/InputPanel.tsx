import { useRef, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPunch: () => void;
  maxLength?: number;
};

const MAX = 200;

export function InputPanel({ value, onChange, onPunch, maxLength = MAX }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canPunch = trimmed.length > 0;
  const overHalf = value.length > maxLength * 0.7;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canPunch) onPunch();
    }
  };

  return (
    <section className="input-panel" aria-label="入力エリア">
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
      <div className="input-panel__row">
        <p className="input-panel__hint">
          Enterでパンチ。Shift+Enterで改行。
        </p>
        <button
          type="button"
          className="punch-button"
          onClick={onPunch}
          disabled={!canPunch}
          aria-label="パンチする"
        >
          パンチする
        </button>
      </div>
    </section>
  );
}
