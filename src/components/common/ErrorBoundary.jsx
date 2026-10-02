import { Component } from "react";
import { downloadUrl } from "../../lib/pdf/generateNoticePdf.js";
import { STORAGE_KEY } from "../../store/useAriyippuStore.js";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";

/**
 * Catches render errors below it and shows a recovery screen instead of a
 * blank page.
 *
 * variant "page":  full-screen fallback for the whole app. Besides retrying,
 *                  it can save and clear the stored notice, since a broken
 *                  saved notice would otherwise crash again on every reload.
 * variant "panel": inline card for one part of the workspace, so the rest of
 *                  the app keeps working.
 *
 * The fallback reads nothing from the store, so it renders even when the
 * store is the thing that broke.
 */
export class ErrorBoundary extends Component {
  state = { error: null, componentStack: "" };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ""}]`, error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? "" });
  }

  reset = () => this.setState({ error: null, componentStack: "" });

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    const Fallback = this.props.variant === "panel" ? PanelFallback : PageFallback;
    return <Fallback error={error} componentStack={componentStack} name={this.props.name} onRetry={this.reset} />;
  }
}

function errorText(error, componentStack) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return [message, error?.stack, componentStack].filter(Boolean).join("\n\n");
}

function ErrorDetails({ error, componentStack }) {
  return (
    <details className="error-details">
      <summary>Technical details</summary>
      <pre>{errorText(error, componentStack)}</pre>
    </details>
  );
}

function readSavedNotice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function downloadBackup(raw) {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  downloadUrl(url, `ariyippu-backup-${new Date().toISOString().slice(0, 10)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PageFallback({ error, componentStack, onRetry }) {
  const saved = readSavedNotice();

  const clearAndReload = () => {
    if (!window.confirm("Clear the saved notice and start fresh? Download a backup first if you want to keep it.")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: a reload is all we can do.
    }
    window.location.reload();
  };

  return (
    <main className="error-page">
      <section className="error-card" role="alert">
        <div className="error-mark" aria-hidden="true">
          <Icon name="alert" />
        </div>
        <p className="error-eyebrow">Something went wrong</p>
        <h1 className="error-title">The notice editor stopped unexpectedly</h1>
        <p className="error-text">
          Your work is saved in this browser. Try again, or reload the app. If the problem keeps coming back, download a
          backup of the saved notice and start fresh.
        </p>

        <div className="error-actions">
          <Button variant="primary" onClick={onRetry}>
            <Icon name="refresh" /> Try again
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </div>

        {saved && (
          <div className="error-recovery">
            <Button variant="ghost" size="sm" onClick={() => downloadBackup(saved)}>
              <Icon name="download" /> Download backup
            </Button>
            <Button variant="ghost" size="sm" className="btn-ghost-danger" onClick={clearAndReload}>
              <Icon name="trash" /> Clear saved notice
            </Button>
          </div>
        )}

        <ErrorDetails error={error} componentStack={componentStack} />
      </section>
    </main>
  );
}

function PanelFallback({ error, componentStack, name, onRetry }) {
  return (
    <section className="card error-panel" role="alert">
      <div className="error-panel-head">
        <span className="error-panel-icon" aria-hidden="true">
          <Icon name="alert" />
        </span>
        <div>
          <h2 className="card-title">{name ? `${name} could not be shown` : "This part could not be shown"}</h2>
          <p className="error-panel-text">The rest of the app still works, and your notice is safe.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon name="refresh" /> Try again
        </Button>
      </div>
      <ErrorDetails error={error} componentStack={componentStack} />
    </section>
  );
}
