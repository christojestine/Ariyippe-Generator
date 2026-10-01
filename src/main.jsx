import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { useAriyippuStore } from "./store/useAriyippuStore.js";
import "./styles/app.css";

// Colour theme lives on <html data-theme> (index.html sets it before first paint).
const applyTheme = (theme) => (document.documentElement.dataset.theme = theme);
applyTheme(useAriyippuStore.getState().theme);
useAriyippuStore.subscribe((s) => applyTheme(s.theme));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
