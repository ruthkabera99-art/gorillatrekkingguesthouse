import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { themeTokens, loadThemeFonts } from "@/lib/siteTheme";

/** Applies admin-chosen colours, fonts and corner roundness to the whole site. */
const ThemeApplier = () => {
  const { theme } = useSiteContent();

  useEffect(() => {
    const root = document.documentElement.style;
    Object.entries(themeTokens(theme)).forEach(([key, value]) => root.setProperty(key, value));
    loadThemeFonts(theme, "site-theme-fonts");
  }, [theme]);

  return null;
};

export default ThemeApplier;
