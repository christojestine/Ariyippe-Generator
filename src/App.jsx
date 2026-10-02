import { useAriyippuStore } from "./store/useAriyippuStore.js";
import { Button } from "./components/common/Button.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";
import { Icon } from "./components/common/Icon.jsx";
import { ThemeToggle } from "./components/common/ThemeToggle.jsx";
import { InputModeToggle } from "./components/editor/InputModeToggle.jsx";
import { TypingHelp } from "./components/editor/TypingHelp.jsx";
import { GeneratePanel } from "./components/generate/GeneratePanel.jsx";
import { HeaderSettings } from "./components/header/HeaderSettings.jsx";
import { PreviewPanel } from "./components/preview/PreviewPanel.jsx";
import { SectionList } from "./components/sections/SectionList.jsx";

export function App() {
  const newNotice = useAriyippuStore((s) => s.newNotice);
  const loadSample = useAriyippuStore((s) => s.loadSample);

  const confirmThen = (message, action) => () => {
    if (window.confirm(message)) action();
  };

  return (
    <div className="app">
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span>അ</span>
            <span className="pulse" />
          </span>
          <div>
            <h1>
              Ariyippu <span className="brand-accent">Generator</span>
            </h1>
            <p>Weekly parish notice → print-ready PDF</p>
          </div>
        </div>
        <div className="topbar-center">
          <InputModeToggle />
          <TypingHelp />
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <Button variant="secondary" onClick={confirmThen("Replace the current notice with the 27.09.2026 sample?", loadSample)}>
            <Icon name="fileDown" /> Load sample
          </Button>
          <Button
            variant="secondary"
            onClick={confirmThen("Start a new notice? All items will be cleared (header, logo and signature are kept).", newNotice)}
          >
            <Icon name="plusCircle" className="icon-accent" /> New notice
          </Button>
          <GeneratePanel />
        </div>
      </header>

      <main className="workspace">
        <div className="builder">
          <ErrorBoundary variant="panel" name="Notice details">
            <HeaderSettings />
          </ErrorBoundary>
          <ErrorBoundary variant="panel" name="Sections">
            <SectionList />
          </ErrorBoundary>
        </div>
        <ErrorBoundary variant="panel" name="Print preview">
          <PreviewPanel />
        </ErrorBoundary>
      </main>

      <footer className="statusbar glass">
        <span>
          <span className="status-dot" /> Ariyippu Malayalam type engine · Manglish, English &amp; Inscript
        </span>
        <span>
          <kbd>Ctrl</kbd>+<kbd>M</kbd> switch input mode · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> add item
        </span>
      </footer>
    </div>
  );
}
