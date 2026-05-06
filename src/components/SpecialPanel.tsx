import catIconSrc from "../assets/sandbag/paw-right.png";

const QUICK_PRESETS = [
  "ぶっとばせ",
  "まあいっか",
  "なんでだよ",
  "ありがとう",
  "おつかれさま",
] as const;

type Props = {
  onCatPunch: () => void;
  onQuickPunch: (text: string) => void;
};

export function SpecialPanel({ onCatPunch, onQuickPunch }: Props) {
  return (
    <aside className="side-panel side-panel--left" aria-label="左パネル">
      <section className="side-section">
        <div className="side-section__head">
          <span className="side-section__label">特殊パンチ</span>
          <span className="side-section__tag" aria-hidden="true">
            SPECIAL
          </span>
        </div>
        <div className="side-section__list" role="group" aria-label="特殊パンチ">
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
        </div>
      </section>

      <section className="side-section">
        <div className="side-section__head">
          <span className="side-section__label">サクッとパンチ</span>
          <span className="side-section__tag" aria-hidden="true">
            PRESET
          </span>
        </div>
        <div className="side-section__list" role="group" aria-label="プリセット">
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
      </section>
    </aside>
  );
}
