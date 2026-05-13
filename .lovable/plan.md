## Goal
Transform the landing site into a Booking.com-style, conversion-focused, internationally-discoverable booking site. Keep the existing dark luxury feel for branded sections but adopt a brighter, trust-driven booking layer (search bar, room cards with prices/ratings, sticky book CTA, trust badges).

This is large — I'll ship it in **three phases** so each one is reviewable.

---

## Phase 1 — Booking-grade homepage + SEO foundations (this approval)

**Visual / UX**
- New full-width hero with cinematic photo + tagline + a real **booking search widget** (check-in, check-out, guests, rooms) wired to deep-link into `/rooms?from=...&to=...&guests=...`.
- Trust strip below hero: star rating, "Booking Partner", "Free cancellation", "Best price guarantee", "Pay at property", payment logos.
- Refreshed `RoomShowcase` → Booking.com-style horizontal cards: photo carousel, amenities icons, "from RWF X / night", rating, "View deal" button.
- Sticky bottom-bar on mobile with "Check availability".
- Keep brand navy/gold but introduce booking-blue (`#0071c2`) and yellow (`#feba02`) as CTA accents in `index.css` design tokens.
- New "Why book direct" section (3 perks) and prominent Reviews section pulling existing testimonials into a Booking-style score card (e.g. "9.2 Superb · 142 reviews").
- "Explore Musanze" mini-section (location, distance to Volcanoes NP, airport transfer) with map embed.

**SEO worldwide (Google / Google Hotels)**
- Install `react-helmet-async` + add per-route `<Helmet>` to `Index`, `Rooms`, `RoomDetail`, `Menu`.
- Expanded JSON-LD in `index.html`: full `Hotel` schema (address, geo, telephone, amenityFeature, starRating, priceRange, aggregateRating placeholder).
- Per-room `Product` + `LodgingBusiness` JSON-LD on `RoomDetail` with price, currency, availability.
- `BreadcrumbList` on inner pages, `FAQPage` on homepage FAQ.
- `hreflang` tags for `en` / `fr`, canonicals, robots.txt + dynamic `sitemap.xml` generator script (predev/prebuild) covering `/`, `/rooms`, every room id, `/menu`.
- Replace generic `<title>`/description with keyword-optimized strings ("Gorilla Trekking Guest House — Hotel near Volcanoes NP, Musanze Rwanda | Book Direct").

**Languages**
- Add `react-i18next` with `en` + `fr` JSON dictionaries covering nav, hero, room card labels, footer, search widget. Language switcher in navbar (🇬🇧 / 🇫🇷). Persist choice in `localStorage`. Set `<html lang>` dynamically.
- Translate the most visible copy first; deeper page text in Phase 2.

**Trust / "list us on Airbnb & Booking.com"**
- Footer "Find us on" row with Booking.com / Airbnb / TripAdvisor / Google logos. Each link = `#` placeholder with a tooltip "Listing coming soon" — you paste the real URLs once you create those host accounts (I'll explain how).

---

## Phase 2 (next approval) — Rooms catalog + detail
Booking.com-style filters (price, amenities, capacity), photo galleries with lightbox, calendar availability, "X people booked this in last 24h" social proof, multi-room comparison.

## Phase 3 — Conversion polish
Live currency switcher (RWF/USD/EUR), exit-intent discount, FAQ + Policies page, structured reviews via Google Place ID, full FR translations of long-form copy, performance tuning for Lighthouse 95+.

---

## Important caveat about Airbnb / Booking.com
These are closed marketplaces — code on this site cannot publish a listing there. To appear on them you need to:
1. Create a host account on each (Airbnb → airbnb.com/host; Booking.com → join.booking.com).
2. Add property details, photos, calendar, pricing.
3. Once live, share the listing URLs with me and I'll wire the footer/CTAs to point at them and add their review badges.

Lovable handles your **own** booking site + Google discoverability. The OTAs are a separate business signup.

---

## Technical details
- Files touched (Phase 1): `index.html`, `src/main.tsx` (HelmetProvider + i18n init), `src/App.tsx` (no route changes), `src/components/landing/*` (Navbar, Hero, RoomShowcase, Footer + new `BookingSearchBar.tsx`, `TrustStrip.tsx`, `WhyBookDirect.tsx`, `LocationSection.tsx`, `ReviewScoreCard.tsx`, `LanguageSwitcher.tsx`), `src/pages/Index.tsx`, `src/pages/Rooms.tsx` (read query params), `src/pages/RoomDetail.tsx` (Product schema), `src/index.css` + `tailwind.config.ts` (booking-blue/yellow tokens), new `src/i18n/{index.ts,en.json,fr.json}`, `scripts/generate-sitemap.ts`, `public/robots.txt`, `package.json` predev/prebuild, deps: `react-helmet-async`, `react-i18next`, `i18next`, `i18next-browser-languagedetector`.
- No DB changes.
- All new colors registered as HSL semantic tokens — no inline color classes.
