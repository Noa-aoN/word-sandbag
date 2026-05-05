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
    hitSide,
    hitIntensity,
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
    hook,
    upper,
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
          hitSide={hitSide}
          hitIntensity={hitIntensity}
          hitCount={hitCount}
          message={message}
        />
        <InputPanel
          value={text}
          onChange={setText}
          onPunch={punch}
          onCrunch={crunch}
          onHook={hook}
          onUpper={upper}
          onQuickPunch={punchWith}
          onCatPunch={catPunch}
          speed={speed}
          onSpeedChange={setSpeed}
          speedRange={speedRange}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
        <PrivacyNote />
        <footer className="app-footer">
          <span className="app-footer__mono">@2026 NOA</span>
        </footer>
      </div>
    </div>
  );
}
