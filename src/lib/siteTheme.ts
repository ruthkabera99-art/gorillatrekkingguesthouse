import type { CSSProperties } from "react";

export const SERIF_FONTS = ["Playfair Display", "Cormorant Garamond", "Lora", "Libre Baskerville", "DM Serif Display", "Merriweather"];
export const SANS_FONTS = ["Inter", "Work Sans", "Manrope", "Nunito Sans", "Karla", "DM Sans", "Lato"];
export interface WebsiteTheme { primary: string; secondary: string; button: string; fontSerif: string; fontSans: string; radius: number }

export function hexToHsl(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function contrast(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? "220 40% 8%" : "0 0% 100%";
}

/** Both the saved theme and the draft preview use the same semantic tokens. */
export function themeTokens(theme: WebsiteTheme): CSSProperties & Record<string, string> {
  const primary = hexToHsl(theme.primary), secondary = hexToHsl(theme.secondary), button = hexToHsl(theme.button);
  const tokens: Record<string, string> = {};
  if (primary) {
    ["--primary", "--accent", "--ring", "--gold"].forEach((key) => { tokens[key] = primary; });
    tokens["--primary-foreground"] = tokens["--accent-foreground"] = tokens["--gold-foreground"] = contrast(theme.primary);
    const [h, s, l] = primary.split(" ");
    tokens["--gold-light"] = `${h} ${s} ${Math.min(90, parseInt(l) + 17)}%`;
  }
  if (secondary) {
    tokens["--navy"] = tokens["--secondary"] = secondary;
    tokens["--secondary-foreground"] = tokens["--navy-foreground"] = contrast(theme.secondary);
  }
  if (button) {
    tokens["--booking-blue"] = button;
    tokens["--booking-blue-foreground"] = contrast(theme.button);
  }
  tokens["--radius"] = `${Math.max(0, Math.min(1.5, theme.radius))}rem`;
  tokens["--font-serif"] = `"${theme.fontSerif}"`;
  tokens["--font-sans"] = `"${theme.fontSans}"`;
  return tokens;
}

export function loadThemeFonts(theme: Pick<WebsiteTheme, "fontSerif" | "fontSans">, id: string) {
  const fonts = [...new Set([theme.fontSerif, theme.fontSans])].filter((f) => [...SERIF_FONTS, ...SANS_FONTS].includes(f));
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
  const query = fonts.map((f) => {
    const weights = ["DM Serif Display", "Libre Baskerville"].includes(f) ? "400" : "400;500;600;700";
    return `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@${weights}`;
  });
  link.href = `https://fonts.googleapis.com/css2?${query.join("&")}&display=swap`;
}