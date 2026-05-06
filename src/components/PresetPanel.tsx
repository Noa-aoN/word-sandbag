type Preset = { label: string; text: string };

type Category = {
  name: string;
  presets: readonly Preset[];
};

const CATEGORIES: readonly Category[] = [
  {
    name: "泣き言（コード）",
    presets: [
      { label: "バグだ", text: "バグだ" },
      { label: "型エラーつらい", text: "型エラーつらい" },
      { label: "ビルド通らん", text: "ビルド通らん" },
      { label: "もう無理", text: "もう無理" },
    ],
  },
  {
    name: "怒り",
    presets: [
      { label: "ぶっとばせ", text: "ぶっとばせ" },
      { label: "なんでだよ", text: "なんでだよ" },
      { label: "ふざけんな", text: "ふざけんな" },
    ],
  },
  {
    name: "自己受容",
    presets: [
      { label: "まあいっか", text: "まあいっか" },
      { label: "ぼちぼちで", text: "ぼちぼちで" },
      { label: "それも自分", text: "それも自分" },
    ],
  },
  {
    name: "感謝",
    presets: [
      { label: "ありがとう", text: "ありがとう" },
      { label: "助かった", text: "助かった" },
      { label: "おつかれさま", text: "おつかれさま" },
    ],
  },
  {
    name: "ネタ",
    presets: [
      {
        label: "スリランカの首都",
        text: "スリ・ジャヤワルダナプラ・コッテ",
      },
      {
        label: "ピカソの本名",
        text: "パブロ・ディエゴ・ホセ・フランシスコ・デ・パウラ・フアン・ネポムセノ・マリア・デ・ロス・レメディオス・シプリアーノ・デ・ラ・サンティシマ・トリニダード・ルイス・イ・ピカソ",
      },
    ],
  },
] as const;

type Props = {
  onPresetPunch: (text: string) => void;
};

export function PresetPanel({ onPresetPunch }: Props) {
  return (
    <aside className="side-panel side-panel--left" aria-label="左パネル">
      <header className="side-panel__head">
        <span className="side-panel__title">プリセットパンチ</span>
      </header>
      {CATEGORIES.map((cat) => (
        <section className="side-section" key={cat.name}>
          <div className="side-section__head">
            <span className="side-section__label">{cat.name}</span>
          </div>
          <div
            className="side-section__list"
            role="group"
            aria-label={`${cat.name}カテゴリのプリセット`}
          >
            {cat.presets.map((p, i) => (
              <button
                key={p.label}
                type="button"
                className="quick-punch-button"
                onClick={() => onPresetPunch(p.text)}
                aria-label={`「${p.label}」とパンチする`}
                style={{ animationDelay: `${0.05 * i}s` }}
                title={p.text === p.label ? undefined : p.text}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
