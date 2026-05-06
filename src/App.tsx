import { Header } from "./components/Header";
import { SandbagStage } from "./components/SandbagStage";
import { PresetPanel } from "./components/PresetPanel";
import { SkillPanel } from "./components/SkillPanel";
import { TextPunchPanel } from "./components/TextPunchPanel";
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
    bagState,
    setSpeed,
    toggleSound,
    punch,
    punchWith,
    crunch,
    catPunch,
    cashPunch,
    hook,
    upper,
    kick,
    tap,
    charImpact,
    removeWord,
    throwTowel,
    towelKey,
    speedRange,
    strength,
    setStrength,
    strengthRange,
  } = usePunch();

  return (
    <div className="app">
      <div className="app__inner">
        <Header />
        <div className="app__layout">
          <PresetPanel onPresetPunch={punchWith} />
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
            bagState={bagState}
            towelKey={towelKey}
          />
          <TextPunchPanel value={text} onChange={setText} onPunch={punch} />
          <SkillPanel
            onCrunch={crunch}
            onHook={hook}
            onUpper={upper}
            onKick={kick}
            onCatPunch={catPunch}
            onCashPunch={cashPunch}
            onThrowTowel={throwTowel}
            speed={speed}
            onSpeedChange={setSpeed}
            speedRange={speedRange}
            strength={strength}
            onStrengthChange={setStrength}
            strengthRange={strengthRange}
            soundOn={soundOn}
            onToggleSound={toggleSound}
          />
        </div>
        <PrivacyNote />
        <footer className="app-footer">
          <span className="app-footer__mono">@2026 NOA</span>
        </footer>
      </div>
    </div>
  );
}
