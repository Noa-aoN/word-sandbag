import { Header } from "./components/Header";
import { SandbagStage } from "./components/SandbagStage";
import { InputPanel } from "./components/InputPanel";
import { PrivacyNote } from "./components/PrivacyNote";
import { usePunch } from "./hooks/usePunch";

export function App() {
  const {
    text,
    setText,
    flyingWords,
    hitKey,
    hitPower,
    hitCount,
    message,
    punch,
    punchWith,
    tap,
    removeWord,
  } = usePunch();

  return (
    <div className="app">
      <div className="app__inner">
        <Header />
        <SandbagStage
          flyingWords={flyingWords}
          onWordComplete={removeWord}
          onSandbagTap={tap}
          hitKey={hitKey}
          hitPower={hitPower}
          hitCount={hitCount}
          message={message}
        />
        <InputPanel
          value={text}
          onChange={setText}
          onPunch={punch}
          onQuickPunch={punchWith}
        />
        <PrivacyNote />
        <p className="footer">
          <span className="footer__rule" aria-hidden="true" />
          <span className="footer__mono" aria-hidden="true">
            HERE &amp; GONE
          </span>
          <span className="footer__rule" aria-hidden="true" />
        </p>
        <p className="footer__sub">送らない。残さない。ここで消す。</p>
      </div>
    </div>
  );
}
