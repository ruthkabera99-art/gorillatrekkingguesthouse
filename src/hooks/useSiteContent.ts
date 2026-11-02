import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "en" | "fr" | "es";
export type LText = Partial<Record<Lang, string>>;

export interface NavLinkItem { id: string; label: LText; tKey?: string; href: string; visible: boolean }
export interface FooterLink { id: string; label: LText; href: string }
export interface FooterColumn { id: string; title: LText; tKey?: string; links: FooterLink[] }
export interface SectionItem { key: string; visible: boolean }

export interface SiteContent {
  header: { brandTitle: string; brandSubtitle: string; links: NavLinkItem[]; showBookButton: boolean; bookLabel: LText; bookHref: string };
  banner: { enabled: boolean; text: LText; highlight: LText; endDate: string; linkHref: string };
  hero: { badge: LText; title1: LText; title2: LText; subtitle: LText; location: LText; rating: string; imageUrl: string; videoUrl: string; showSearch: boolean };
  footer: {
    brandTitle: string; brandSubtitle: string; tagline: LText; columns: FooterColumn[];
    socials: { facebook: string; instagram: string; twitter: string; youtube: string };
    otaLinks: { id: string; name: string; href: string }[];
    copyright: string; bottomNote: string; showNewsletter: boolean;
  };
  theme: { primary: string; secondary: string; button: string; fontSerif: string; fontSans: string; radius: number };
  sections: SectionItem[];
}

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero (top picture & search)", trust: "Trust badges", experience: "Experience", rooms: "Rooms",
  whyBook: "Why book direct", amenities: "Amenities", gallery: "Gallery", location: "Location & map",
  trekking: "Trekking tours", reviewScore: "Review score", testimonials: "Guest reviews", contact: "Contact",
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const DEFAULT_CONTENT: SiteContent = {
  header: {
    brandTitle: "GORILLA TREKKING", brandSubtitle: "Guest House", showBookButton: true, bookLabel: {}, bookHref: "/rooms",
    links: [
      { id: "rooms", label: {}, tKey: "nav.rooms", href: "#rooms", visible: true },
      { id: "gallery", label: {}, tKey: "nav.gallery", href: "#gallery", visible: true },
      { id: "trekking", label: {}, tKey: "nav.trekking", href: "#trekking", visible: true },
      { id: "amenities", label: {}, tKey: "nav.amenities", href: "#amenities", visible: true },
      { id: "reviews", label: {}, tKey: "nav.reviews", href: "#reviews", visible: true },
      { id: "menu", label: {}, tKey: "nav.menu", href: "/menu", visible: true },
      { id: "contact", label: {}, tKey: "nav.contact", href: "#contact", visible: true },
    ],
  },
  banner: {
    enabled: true, endDate: "", linkHref: "/rooms",
    text: { en: "Save 20% on all rooms this season — Book 7+ nights & get instant discount.", fr: "Économisez 20 % sur toutes les chambres cette saison.", es: "Ahorra un 20 % en todas las habitaciones esta temporada." },
    highlight: { en: "Save 20%", fr: "-20 %", es: "-20 %" },
  },
  hero: {
    badge: {}, title1: {}, title2: {}, subtitle: {}, location: {}, rating: "9.4 / 10", showSearch: true,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
    videoUrl: "https://videos.pexels.com/video-files/3773486/3773486-uhd_2560_1440_30fps.mp4",
  },
  footer: {
    brandTitle: "GORILLA TREKKING", brandSubtitle: "GUEST HOUSE", tagline: {}, showNewsletter: true,
    copyright: "Gorilla Trekking Guest House", bottomNote: "Musanze, Rwanda 🇷🇼",
    socials: { facebook: "", instagram: "", twitter: "", youtube: "" },
    otaLinks: [
      { id: "b", name: "Booking.com", href: "" }, { id: "a", name: "Airbnb", href: "" },
      { id: "t", name: "TripAdvisor", href: "" }, { id: "g", name: "Google Hotels", href: "" }, { id: "e", name: "Expedia", href: "" },
    ],
    columns: [
      { id: "explore", title: {}, tKey: "footer.explore", links: [
        { id: uid(), label: { en: "Rooms", fr: "Chambres", es: "Habitaciones" }, href: "/rooms" },
        { id: uid(), label: { en: "Menu", fr: "Menu", es: "Menú" }, href: "/menu" },
        { id: uid(), label: { en: "Gallery", fr: "Galerie", es: "Galería" }, href: "#gallery" },
        { id: uid(), label: { en: "Trekking", fr: "Trekking", es: "Trekking" }, href: "#trekking" },
      ] },
      { id: "support", title: {}, tKey: "footer.support", links: [
        { id: uid(), label: { en: "FAQ" }, href: "#" },
        { id: uid(), label: { en: "Terms & Conditions" }, href: "#" },
        { id: uid(), label: { en: "Privacy Policy" }, href: "#" },
        { id: uid(), label: { en: "Cancellation Policy" }, href: "#" },
      ] },
    ],
  },
  theme: { primary: "#C5A572", secondary: "#1B2A4A", button: "#0060C2", fontSerif: "Playfair Display", fontSans: "Inter", radius: 0.75 },
  sections: Object.keys(SECTION_LABELS).map((key) => ({ key, visible: true })),
};

export const newId = uid;

/** Text for the current language; falls back to English, then to the given fallback. */
export function pickText(t: LText | undefined, lang: string, fallback = ""): string {
  const l = (lang || "en").slice(0, 2) as Lang;
  return (t?.[l]?.trim() || t?.en?.trim() || fallback);
}

function merge(saved: Partial<SiteContent> | undefined): SiteContent {
  const s = saved || {};
  const sections = (() => {
    const list = s.sections?.length ? s.sections.filter((x) => SECTION_LABELS[x.key]) : DEFAULT_CONTENT.sections;
    const missing = DEFAULT_CONTENT.sections.filter((d) => !list.some((x) => x.key === d.key));
    return [...list, ...missing];
  })();
  return {
    header: { ...DEFAULT_CONTENT.header, ...s.header },
    banner: { ...DEFAULT_CONTENT.banner, ...s.banner },
    hero: { ...DEFAULT_CONTENT.hero, ...s.hero },
    footer: { ...DEFAULT_CONTENT.footer, ...s.footer, socials: { ...DEFAULT_CONTENT.footer.socials, ...s.footer?.socials } },
    theme: { ...DEFAULT_CONTENT.theme, ...s.theme },
    sections,
  };
}

let cached: SiteContent | null = null;
const listeners = new Set<(v: SiteContent) => void>();

export async function fetchSiteContent(): Promise<SiteContent> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "site_content").maybeSingle();
  const merged = merge(data?.value as Partial<SiteContent> | undefined);
  cached = merged;
  listeners.forEach((l) => l(merged));
  return merged;
}

export async function saveSiteContent(content: SiteContent) {
  const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "site_content").maybeSingle();
  const value = JSON.parse(JSON.stringify(content));
  const res = existing
    ? await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "site_content")
    : await supabase.from("site_settings").insert({ key: "site_content", value });
  if (res.error) throw res.error;
  cached = content;
  listeners.forEach((l) => l(content));
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cached ?? DEFAULT_CONTENT);
  useEffect(() => {
    listeners.add(setContent);
    if (!cached) fetchSiteContent(); else setContent(cached);
    const channel = supabase
      .channel(`site-content-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.site_content" }, () => fetchSiteContent())
      .subscribe();
    return () => { listeners.delete(setContent); supabase.removeChannel(channel); };
  }, []);
  return content;
}
