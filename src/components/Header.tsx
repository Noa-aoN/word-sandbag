const TITLE = "言葉サンドバッグ";

export function Header() {
  return (
    <header className="header">
      <div className="header__board">
        <span className="header__tape header__tape--left" aria-hidden="true" />
        <span className="header__tape header__tape--right" aria-hidden="true" />

        <div className="header__round" aria-hidden="true">
          <span className="header__round-pre">第</span>
          <span className="header__round-num">五</span>
          <span className="header__round-post">回戦</span>
        </div>

        <div className="header__seal" aria-hidden="true">
          <span className="header__seal-char">言</span>
          <span className="header__seal-char">葉</span>
        </div>

        <h1 className="header__title">
          <span className="visually-hidden">{TITLE}</span>
          <span className="header__title-row" aria-hidden="true">
            {[...TITLE].map((c, i) => (
              <span
                key={i}
                className="header__title-char"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                {c}
              </span>
            ))}
          </span>
        </h1>

        <p className="header__catch">
          その言葉、<span className="header__catch-em">ここでぶつけて消そう。</span>
        </p>

        <div className="header__rule" aria-hidden="true">
          <span className="header__rule-line" />
          <span className="header__rule-mark">拳闘場</span>
          <span className="header__rule-line" />
        </div>
      </div>
    </header>
  );
}
