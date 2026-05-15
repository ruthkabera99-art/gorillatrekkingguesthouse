import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { CurrencyProvider } from "./contexts/CurrencyContext";

// Apply saved theme or default to dark
const savedTheme = localStorage.getItem("theme");
if (!savedTheme || savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </HelmetProvider>
);
