import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const STORAGE_KEY = "announcement-dismissed-v1";
// 14 days from first visit (per session basis)
const COUNTDOWN_DAYS = 14;

const useCountdown = () => {
  const [target] = useState(() => {
    const existing = localStorage.getItem("promo-end");
    if (existing) return new Date(existing);
    const end = new Date(Date.now() + COUNTDOWN_DAYS * 86400000);
    localStorage.setItem("promo-end", end.toISOString());
    return end;
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return { days, hours };
};

const setBannerHeight = (h: number) => {
  document.documentElement.style.setProperty("--banner-h", `${h}px`);
};

const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(() => localStorage.getItem(STORAGE_KEY) !== "1");
  const { format } = useCurrency();
  const { days, hours } = useCountdown();

  useEffect(() => {
    setBannerHeight(visible ? 44 : 0);
    return () => setBannerHeight(0);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] text-[hsl(var(--navy))]"
      style={{ background: "hsl(var(--gold))" }}
      role="region"
      aria-label="Promotional offer"
    >
      <div className="container mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-sans font-medium">
        <span className="flex-1 min-w-0 leading-snug">
          <span className="hidden sm:inline">🌿 </span>
          <span className="font-bold">Save 20%</span>
          <span className="hidden sm:inline"> on all rooms this season</span>
          <span className="hidden md:inline"> — Book 7+ nights & get instant discount.</span>
          <span className="ml-1 sm:ml-2 inline-flex items-baseline gap-1.5">
            <span className="line-through opacity-60">{format(45000)}</span>
            <span className="font-bold">{format(36000)}/night</span>
          </span>
        </span>

        <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[hsl(var(--navy))/0.15] font-mono font-bold text-[11px] sm:text-xs whitespace-nowrap">
          ⏳ {days}d {hours}h left
        </div>

        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
          aria-label="Dismiss announcement"
          className="p-1 rounded hover:bg-[hsl(var(--navy))/0.15] transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
