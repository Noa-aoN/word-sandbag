import { useRef, type KeyboardEvent } from "react";

const CONTROL_REGEX = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g;
const INVISIBLE_REGEX = /[​-‏‪-‮⁠-⁯﻿]/g;

function stripControl(s: string): string {
  return s.replace(CONTROL_REGEX, "").replace(INVISIBLE_REGEX, "");
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPunch: () => void;
  maxLength?: number;
};

const MAX = 200;

export function TextPunchPanel({
  value,
  onChange,
  onPunch,
  maxLength = MAX,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canDispatch = trimmed.length > 0;
  const overHalf = value.length > maxLength * 0.7;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canDispatch) onPunch();
    }
  };

  return (
    <section className="text-punch" aria-label="言葉パンチ入力">
      <div className="input-panel__textarea-wrap">
        <textarea
          ref={ref}
          className="input-panel__textarea"
          value={value}
          onChange={(e) => onChange(stripControl(e.target.value).slice(0, maxLength))}
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

      <p className="text-punch__privacy">入力した言葉は保存されません。</p>
    </section>
  );
}
