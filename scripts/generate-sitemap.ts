// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://gorillatrekkingguesthouse.lovable.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://wmsxhszqnlvvhtijnehi.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/rooms", changefreq: "daily", priority: "0.9" },
  { path: "/menu", changefreq: "weekly", priority: "0.7" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
  { path: "/forgot-password", changefreq: "yearly", priority: "0.1" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.1" },
  { path: "/dashboard", changefreq: "monthly", priority: "0.3" },
  { path: "/kitchen", changefreq: "monthly", priority: "0.2" },
];

async function fetchRoomEntries(): Promise<Entry[]> {
  if (!SUPABASE_ANON) return [];
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
    const { data } = await sb
      .from("rooms")
      .select("id, updated_at")
      .eq("status", "available");
    return (data || []).map((r: any) => ({
      path: `/rooms/${r.id}`,
      lastmod: r.updated_at?.slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    }));
  } catch (e) {
    console.warn("[sitemap] could not fetch rooms:", (e as Error).message);
    return [];
  }
}

function generateSitemap(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const rooms = await fetchRoomEntries();
  const all = [...staticEntries, ...rooms];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();
