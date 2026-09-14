import React from "react";
import ReactDOM from "react-dom/client";
import App, { applyTheme } from "./App";
import "./styles.css";

// Thème appliqué avant le premier rendu pour éviter le flash au démarrage.
try { const t = localStorage.getItem("rushes-theme"); if (t === "dark" || t === "light" || t === "system") applyTheme(t); } catch { /* stockage indisponible */ }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
