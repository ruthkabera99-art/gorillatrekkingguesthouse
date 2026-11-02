import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

function hexToHsl(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Applies admin-chosen colours, fonts and corner roundness to the whole site. */
const ThemeApplier = () => {
  const { theme } = useSiteContent();

  useEffect(() => {
    const root = document.documentElement.style;
    const primary = hexToHsl(theme.primary);
    const secondary = hexToHsl(theme.secondary);
    const button = hexToHsl(theme.button);
    if (primary) ["--primary", "--accent", "--ring", "--gold"].forEach((v) => root.setProperty(v, primary));
    if (secondary) ["--secondary", "--navy"].forEach((v) => root.setProperty(v, secondary));
    if (button) root.setProperty("--booking-blue", button);
    root.setProperty("--radius", `${theme.radius}rem`);
    root.setProperty("--font-serif", `"${theme.fontSerif}"`);
    root.setProperty("--font-sans", `"${theme.fontSans}"`);

    const id = "site-theme-fonts";
    const families = [theme.fontSerif, theme.fontSans]
      .filter((f) => f && !["Playfair Display", "Inter"].includes(f))
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`);
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (families.length) {
      if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
      link.href = `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
    } else link?.remove();
  }, [theme]);

  return null;
};

export default ThemeApplier;
