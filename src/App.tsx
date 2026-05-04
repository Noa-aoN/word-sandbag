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
    hitKind,
    hitCount,
    message,
    speed,
    soundOn,
    setSpeed,
    toggleSound,
    punch,
    punchWith,
    crunch,
    catPunch,
    tap,
    charImpact,
    removeWord,
    speedRange,
  } = usePunch();

  return (
    <div className="app">
      <div className="app__inner">
        <Header />
        <SandbagStage
          flyingWords={flyingWords}
          onWordComplete={removeWord}
          onCharImpact={charImpact}
          onSandbagTap={tap}
          hitKey={hitKey}
          hitPower={hitPower}
          hitKind={hitKind}
          hitCount={hitCount}
          message={message}
        />
        <InputPanel
          value={text}
          onChange={setText}
          onPunch={punch}
          onCrunch={crunch}
          onQuickPunch={punchWith}
          onCatPunch={catPunch}
          speed={speed}
          onSpeedChange={setSpeed}
          speedRange={speedRange}
          soundOn={soundOn}
          onToggleSound={toggleSound}
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
