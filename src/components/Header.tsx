const TITLE = "言葉サンドバッグ";

export function Header() {
  return (
    <header className="header">
      <div className="header__sign">
        <span className="header__rivet header__rivet--tl" aria-hidden="true" />
        <span className="header__rivet header__rivet--tr" aria-hidden="true" />
        <span className="header__rivet header__rivet--bl" aria-hidden="true" />
        <span className="header__rivet header__rivet--br" aria-hidden="true" />

        <span className="header__bar header__bar--top" aria-hidden="true" />
        <span className="header__bar header__bar--bottom" aria-hidden="true" />

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
      </div>
    </header>
  );
}
