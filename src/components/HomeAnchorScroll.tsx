import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function HomeAnchorScroll() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash || hash === "#") return;
    let id: string;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      return true;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);
    return () => { observer.disconnect(); window.clearTimeout(timeout); };
  }, [pathname, hash, key]);
  return null;
}