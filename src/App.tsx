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
    removeWord,
  } = usePunch();

  return (
    <div className="app">
      <div className="app__inner">
        <Header />
        <SandbagStage
          flyingWords={flyingWords}
          onWordComplete={removeWord}
          hitKey={hitKey}
          hitPower={hitPower}
          hitCount={hitCount}
          message={message}
        />
        <InputPanel value={text} onChange={setText} onPunch={punch} />
        <PrivacyNote />
        <p className="footer">送らない。残さない。ここで消す。</p>
      </div>
    </div>
  );
}
