const TITLE = "言葉サンドバッグ";

export function Header() {
  return (
    <header className="header">
      <h1 className="header__title">
        <span className="visually-hidden">{TITLE}</span>
        <span className="header__title-row" aria-hidden="true">
          {[...TITLE].map((c, i) => (
            <span
              key={i}
              className="header__title-char"
              style={{ animationDelay: `${0.04 * i}s` }}
            >
              {c}
            </span>
          ))}
        </span>
      </h1>
      <p className="header__catch">
        その言葉、<span className="header__catch-em">ここでぶつけて消そう。</span>
      </p>
    </header>
  );
}
