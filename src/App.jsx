import { useAriyippuStore } from "./store/useAriyippuStore.js";
import { Button } from "./components/common/Button.jsx";
import { InputModeToggle } from "./components/editor/InputModeToggle.jsx";
import { TypingHelp } from "./components/editor/TypingHelp.jsx";
import { GeneratePanel } from "./components/generate/GeneratePanel.jsx";
import { HeaderSettings } from "./components/header/HeaderSettings.jsx";
import { SectionList } from "./components/sections/SectionList.jsx";

export function App() {
  const newNotice = useAriyippuStore((s) => s.newNotice);
  const loadSample = useAriyippuStore((s) => s.loadSample);

  const confirmThen = (message, action) => () => {
    if (window.confirm(message)) action();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            അ
          </span>
          <div>
            <h1>Ariyippu Generator</h1>
            <p>Weekly parish notice → print-ready PDF</p>
          </div>
        </div>
        <div className="topbar-actions">
          <InputModeToggle />
          <TypingHelp />
          <Button variant="ghost" onClick={confirmThen("Replace the current notice with the 27.09.2026 sample?", loadSample)}>
            Load sample
          </Button>
          <Button
            variant="ghost"
            onClick={confirmThen("Start a new notice? All items will be cleared (header, logo and signature are kept).", newNotice)}
          >
            New notice
          </Button>
          <GeneratePanel />
        </div>
      </header>

      <main className="content">
        <HeaderSettings />
        <SectionList />
      </main>
    </div>
  );
}
