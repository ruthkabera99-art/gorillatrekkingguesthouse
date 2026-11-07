import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import SiteLink from "@/components/SiteLink";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSiteContent, pickText } from "@/hooks/useSiteContent";

const setBannerHeight = (h: number) => {
  document.documentElement.style.setProperty("--banner-h", `${h}px`);
};

const useCountdown = (endDate: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (isNaN(end)) return null;
  const diff = end - now;
  if (diff <= 0) return { expired: true, days: 0, hours: 0 };
  return { expired: false, days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000) };
};

const AnnouncementBanner = () => {
  const { banner } = useSiteContent();
  const { i18n } = useTranslation();
  const text = pickText(banner.text, i18n.language);
  const highlight = pickText(banner.highlight, i18n.language);
  // Dismissal is tied to the banner text, so a new message shows again.
  const storageKey = `announcement-dismissed:${JSON.stringify(banner)}`;
  const ref = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const countdown = useCountdown(banner.endDate);

  useEffect(() => { setDismissed(localStorage.getItem(storageKey) === "1"); }, [storageKey]);

  const visible = banner.enabled && !!(text || highlight) && !dismissed && !countdown?.expired;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!visible || !element) { setBannerHeight(0); return; }
    const measure = () => setBannerHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); setBannerHeight(0); };
  }, [visible, text, highlight]);

  if (!visible) return null;

  const body = (
    <span className="flex-1 min-w-0 leading-snug break-words">
      {highlight && <span className="font-bold mr-1.5">{highlight}</span>}
      <span>{highlight && text.startsWith(highlight) ? text.slice(highlight.length).trimStart() : text}</span>
    </span>
  );

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 right-0 z-[60] bg-gold text-gold-foreground"
      role="region"
      aria-label="Announcement"
    >
      <div className="container mx-auto px-3 sm:px-6 py-2 min-h-[44px] flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-sans font-medium">
        {banner.linkHref ? (
          <SiteLink href={banner.linkHref} className="flex-1 min-w-0 flex hover:underline">{body}</SiteLink>
        ) : body}

        {countdown && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold-foreground/15 font-mono font-bold text-xs whitespace-nowrap">
            ⏳ {countdown.days}d {countdown.hours}h
          </div>
        )}

        <Button variant="ghost" size="icon-sm"
          onClick={() => { localStorage.setItem(storageKey, "1"); setDismissed(true); }}
          aria-label="Dismiss announcement"
          className="p-1 rounded hover:bg-gold-foreground/15 hover:text-gold-foreground transition-colors flex-shrink-0"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
