import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const db = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: db.read }) }),
    upsert: (...args: unknown[]) => { db.write(...args); return { select: () => ({ single: () => db.write.mock.results.at(-1)?.value }) }; },
  }),
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: vi.fn(),
} }));

import { DEFAULT_CONTENT, fetchSiteContent, normalizeSiteContent, pickText, saveSiteContent, useSiteContent, validateSiteContent } from "./useSiteContent";

describe("website settings persistence", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("keeps empty link lists and hidden sections rather than restoring deleted content", () => {
    const content = normalizeSiteContent({ header: { links: [] }, footer: { columns: [], otaLinks: [] }, sections: [{ key: "hero", visible: false }] });
    expect(content.header.links).toEqual([]);
    expect(content.footer.columns).toEqual([]);
    expect(content.footer.otaLinks).toEqual([]);
    expect(content.sections.find((s) => s.key === "hero")?.visible).toBe(false);
  });

  it("preserves custom section order and removes invalid or duplicate sections", () => {
    const content = normalizeSiteContent({ sections: [{ key: "rooms", visible: true }, { key: "hero", visible: false }, { key: "rooms", visible: false }, { key: "unknown", visible: true }] });
    expect(content.sections.slice(0, 2)).toEqual([{ key: "rooms", visible: true }, { key: "hero", visible: false }]);
    expect(content.sections).toHaveLength(12);
  });

  it("recovers malformed saved values without losing valid brand text", () => {
    const content = normalizeSiteContent({ header: { brandTitle: "Kabera Ines", links: null }, theme: { primary: "invalid", radius: null }, footer: { columns: null } });
    expect(content.header.brandTitle).toBe("Kabera Ines");
    expect(content.header.links).toEqual(DEFAULT_CONTENT.header.links);
    expect(content.theme.primary).toBe("#C5A572");
    expect(content.theme.radius).toBe(0.75);
    expect(content.footer.columns).toEqual(DEFAULT_CONTENT.footer.columns);
  });

  it("uses English when a translated text box is empty", () => {
    expect(pickText({ en: "Kabera Ines", fr: " " }, "fr", "fallback")).toBe("Kabera Ines");
  });

  it("reports a loading failure instead of presenting defaults as successfully loaded", async () => {
    db.read.mockResolvedValue({ data: null, error: new Error("Access denied") });
    await expect(fetchSiteContent()).rejects.toThrow("Access denied");
  });

  it("publishes only settings returned after a successful save", async () => {
    db.read.mockResolvedValue({ data: { value: DEFAULT_CONTENT }, error: null });
    await fetchSiteContent();
    const hook = renderHook(() => useSiteContent());
    const draft = structuredClone(DEFAULT_CONTENT);
    draft.header.brandTitle = "New hotel name";
    expect(hook.result.current.header.brandTitle).toBe("GORILLA TREKKING");
    db.write.mockResolvedValue({ data: null, error: new Error("Save refused") });
    await act(async () => { await expect(saveSiteContent(draft)).rejects.toThrow("Save refused"); });
    expect(hook.result.current.header.brandTitle).toBe("GORILLA TREKKING");
    db.write.mockResolvedValue({ data: { value: draft }, error: null });
    await act(async () => { await saveSiteContent(draft); });
    await waitFor(() => expect(hook.result.current.header.brandTitle).toBe("New hotel name"));
    expect(db.write).toHaveBeenLastCalledWith(expect.objectContaining({ key: "site_content", value: draft }), { onConflict: "key" });
    hook.unmount();
  });

  it("rejects unsafe links before attempting a save", () => {
    const content = structuredClone(DEFAULT_CONTENT);
    content.footer.socials.facebook = "javascript:alert(1)";
    expect(() => validateSiteContent(content)).toThrow("Unsafe links");
  });
});