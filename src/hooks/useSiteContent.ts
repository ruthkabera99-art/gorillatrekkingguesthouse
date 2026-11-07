import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { mediaHref, siteHref } from "@/lib/siteLinks";
import { hexToHsl, SERIF_FONTS, SANS_FONTS } from "@/lib/siteTheme";

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

const textSchema = z.object({ en: z.string().optional(), fr: z.string().optional(), es: z.string().optional() }).catch({});
const linkSchema = z.object({ id: z.string(), label: textSchema, href: z.string(), tKey: z.string().optional() });

/** Recover individual malformed settings without losing valid saved edits. */
export function normalizeSiteContent(saved: unknown): SiteContent {
  const defaults = DEFAULT_CONTENT;
  const string = (v: string) => z.string().catch(v);
  const bool = (v: boolean) => z.boolean().catch(v);
  const schema = z.object({
    header: z.object({
      brandTitle: string(defaults.header.brandTitle), brandSubtitle: string(defaults.header.brandSubtitle),
      showBookButton: bool(defaults.header.showBookButton), bookLabel: textSchema, bookHref: string(defaults.header.bookHref),
      links: z.array(linkSchema.extend({ visible: z.boolean() })).catch(defaults.header.links),
    }).catch(defaults.header),
    banner: z.object({ enabled: bool(defaults.banner.enabled), text: textSchema, highlight: textSchema,
      endDate: string(""), linkHref: string(defaults.banner.linkHref) }).catch(defaults.banner),
    hero: z.object({ badge: textSchema, title1: textSchema, title2: textSchema, subtitle: textSchema, location: textSchema,
      rating: string(defaults.hero.rating), imageUrl: string(defaults.hero.imageUrl), videoUrl: string(defaults.hero.videoUrl),
      showSearch: bool(defaults.hero.showSearch) }).catch(defaults.hero),
    footer: z.object({
      brandTitle: string(defaults.footer.brandTitle), brandSubtitle: string(defaults.footer.brandSubtitle), tagline: textSchema,
      copyright: string(defaults.footer.copyright), bottomNote: string(defaults.footer.bottomNote), showNewsletter: bool(defaults.footer.showNewsletter),
      socials: z.object({ facebook: string(""), instagram: string(""), twitter: string(""), youtube: string("") }).catch(defaults.footer.socials),
      columns: z.array(z.object({ id: z.string(), title: textSchema, tKey: z.string().optional(), links: z.array(linkSchema).catch([]) })).catch(defaults.footer.columns),
      otaLinks: z.array(z.object({ id: z.string(), name: z.string(), href: z.string() })).catch(defaults.footer.otaLinks),
    }).catch(defaults.footer),
    theme: z.object({
      primary: z.string().refine((v) => !!hexToHsl(v)).catch(defaults.theme.primary),
      secondary: z.string().refine((v) => !!hexToHsl(v)).catch(defaults.theme.secondary),
      button: z.string().refine((v) => !!hexToHsl(v)).catch(defaults.theme.button),
      fontSerif: z.string().refine((v) => SERIF_FONTS.includes(v)).catch(defaults.theme.fontSerif),
      fontSans: z.string().refine((v) => SANS_FONTS.includes(v)).catch(defaults.theme.fontSans),
      radius: z.number().min(0).max(1.5).catch(defaults.theme.radius),
    }).catch(defaults.theme),
    sections: z.array(z.object({ key: z.string(), visible: z.boolean() })).catch(defaults.sections),
  }).catch(defaults);
  // Zod's optional-key inference on this non-strict TS project needs an
  // explicit output type; the schema above fills every required field.
  const result = schema.parse(saved) as SiteContent;
  const seen = new Set<string>();
  result.sections = result.sections.filter((item) => {
    if (!SECTION_LABELS[item.key] || seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
  result.sections.push(...defaults.sections.filter((item) => !seen.has(item.key)));
  return result;
}

export function validateSiteContent(content: SiteContent) {
  for (const colour of [content.theme.primary, content.theme.secondary, content.theme.button]) {
    if (!hexToHsl(colour)) throw new Error("Colours must use six-digit hex values, such as #C5A572.");
  }
  const links = [...content.header.links.map((l) => l.href), content.header.bookHref, content.banner.linkHref,
    ...Object.values(content.footer.socials), ...content.footer.otaLinks.map((l) => l.href), ...content.footer.columns.flatMap((c) => c.links.map((l) => l.href))];
  if (links.some((href) => href.trim() && href.trim() !== "#" && !siteHref(href))) {
    throw new Error("Use a page path, #section, or a complete https:// link. Unsafe links are not allowed.");
  }
  if (!mediaHref(content.hero.imageUrl) || !mediaHref(content.hero.videoUrl)) throw new Error("Photo and video links must be complete web links or site paths.");
  if (!content.hero.imageUrl.trim()) throw new Error("Choose a background photo, including when using video.");
  if (content.banner.endDate && !Number.isFinite(new Date(content.banner.endDate).getTime())) throw new Error("Choose a valid announcement end date.");
}

let cached: SiteContent | null = null;
const listeners = new Set<(v: SiteContent) => void>();
let pendingFetch: Promise<SiteContent> | null = null;
let revision = 0;

export async function fetchSiteContent(): Promise<SiteContent> {
  if (pendingFetch) return pendingFetch;
  const started = revision;
  pendingFetch = (async () => {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "site_content").maybeSingle();
    if (error) throw error;
    const merged = normalizeSiteContent(data?.value);
    if (started !== revision && cached) return cached;
    cached = merged;
    listeners.forEach((l) => l(merged));
    return merged;
  })();
  try { return await pendingFetch; } finally { pendingFetch = null; }
}

export async function saveSiteContent(content: SiteContent) {
  validateSiteContent(content);
  const value = JSON.parse(JSON.stringify(content));
  const { data, error } = await supabase.from("site_settings").upsert({ key: "site_content", value, updated_at: new Date().toISOString() }, { onConflict: "key" }).select("value").single();
  if (error) throw error;
  revision += 1;
  cached = normalizeSiteContent(data.value);
  listeners.forEach((l) => { if (cached) l(cached); });
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cached ?? DEFAULT_CONTENT);
  useEffect(() => {
    listeners.add(setContent);
    const refresh = () => { void fetchSiteContent().catch(() => undefined); };
    if (!cached) refresh(); else setContent(cached);
    const channel = supabase
      .channel(`site-content-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.site_content" }, refresh)
      .subscribe();
    // Poll while visible as a fallback when realtime is not enabled on this table.
    const poll = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
    window.addEventListener("focus", refresh);
    return () => { listeners.delete(setContent); supabase.removeChannel(channel); window.clearInterval(poll); window.removeEventListener("focus", refresh); };
  }, []);
  return content;
}
