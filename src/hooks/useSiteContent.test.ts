import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const db = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), getUser: vi.fn(), refreshSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: db.getUser, refreshSession: db.refreshSession },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: db.read }) }),
    upsert: (...args: unknown[]) => { db.write(...args); return { select: () => ({ single: () => db.write.mock.results.at(-1)?.value }) }; },
  }),
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: vi.fn(),
} }));

import { DEFAULT_CONTENT, fetchSiteContent, normalizeSiteContent, pickText, saveSiteContent, useSiteContent, validateSiteContent } from "./useSiteContent";

describe("website settings persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getUser.mockResolvedValue({ data: { user: { id: "signed-in-admin" } }, error: null });
    db.refreshSession.mockResolvedValue({ data: {}, error: null });
  });

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
    await act(async () => { await expect(saveSiteContent(draft, "signed-in-admin")).rejects.toThrow("Save refused"); });
    expect(hook.result.current.header.brandTitle).toBe("GORILLA TREKKING");
    db.write.mockResolvedValue({ data: { value: draft }, error: null });
    await act(async () => { await saveSiteContent(draft, "signed-in-admin"); });
    await waitFor(() => expect(hook.result.current.header.brandTitle).toBe("New hotel name"));
    expect(db.write).toHaveBeenLastCalledWith(expect.objectContaining({ key: "site_content", value: draft }), { onConflict: "key" });
    hook.unmount();
  });

  it("reads saved administrator changes from the database after a fresh page load", async () => {
    let persisted: unknown = undefined;
    db.write.mockImplementation((row) => {
      persisted = structuredClone(row.value);
      return Promise.resolve({ data: { value: persisted }, error: null });
    });
    db.read.mockImplementation(() => Promise.resolve({ data: persisted ? { value: persisted } : null, error: null }));
    const draft = structuredClone(DEFAULT_CONTENT);
    draft.header.brandTitle = "Kabera Ines";
    draft.banner.text = { en: "Welcome", fr: "Bienvenue", es: "Bienvenidos" };
    draft.sections[0].visible = false;
    const saved = await saveSiteContent(draft, "signed-in-admin");
    expect(saved).toEqual(draft);
    vi.resetModules();
    const reloaded = await import("./useSiteContent");
    expect(await reloaded.fetchSiteContent()).toEqual(draft);
    expect(db.getUser).toHaveBeenCalledTimes(1);
    expect(db.write).toHaveBeenCalledTimes(1);
  });

  it("does not write when the administrator is no longer signed in", async () => {
    db.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveSiteContent(DEFAULT_CONTENT, "signed-in-admin")).rejects.toThrow("Sign in again");
    expect(db.write).not.toHaveBeenCalled();
  });

  it("does not save under a different signed-in account", async () => {
    db.getUser.mockResolvedValue({ data: { user: { id: "different-account" } }, error: null });
    await expect(saveSiteContent(DEFAULT_CONTENT, "signed-in-admin")).rejects.toThrow("account changed");
    expect(db.write).not.toHaveBeenCalled();
  });

  it("refreshes an expired session before saving", async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 401 } });
    db.write.mockResolvedValue({ data: { value: DEFAULT_CONTENT }, error: null });
    await expect(saveSiteContent(DEFAULT_CONTENT, "signed-in-admin")).resolves.toEqual(DEFAULT_CONTENT);
    expect(db.refreshSession).toHaveBeenCalledTimes(1);
    expect(db.getUser).toHaveBeenCalledTimes(2);
  });

  it("does not write when session renewal fails", async () => {
    db.getUser.mockResolvedValue({ data: { user: null }, error: { code: "jwt_expired" } });
    db.refreshSession.mockResolvedValue({ error: new Error("Expired") });
    await expect(saveSiteContent(DEFAULT_CONTENT, "signed-in-admin")).rejects.toThrow("sign-in has expired");
    expect(db.write).not.toHaveBeenCalled();
  });

  it("keeps visitor content unchanged when server permissions refuse a non-admin save", async () => {
    db.read.mockResolvedValue({ data: { value: DEFAULT_CONTENT }, error: null });
    await fetchSiteContent();
    const hook = renderHook(() => useSiteContent());
    const draft = structuredClone(DEFAULT_CONTENT);
    draft.header.brandTitle = "Unauthorized edit";
    db.write.mockResolvedValue({ data: null, error: { code: "42501" } });
    await act(async () => { await expect(saveSiteContent(draft, "signed-in-admin")).rejects.toThrow("Only an administrator"); });
    expect(hook.result.current.header.brandTitle).toBe("GORILLA TREKKING");
    hook.unmount();
  });

  it("does not claim success or publish a draft without a confirmed saved row", async () => {
    db.write.mockResolvedValue({ data: null, error: null });
    await expect(saveSiteContent(DEFAULT_CONTENT, "signed-in-admin")).rejects.toThrow("save was not confirmed");
  });

  it("rejects unsafe links before attempting a save", () => {
    const content = structuredClone(DEFAULT_CONTENT);
    content.footer.socials.facebook = "javascript:alert(1)";
    expect(() => validateSiteContent(content)).toThrow("Unsafe links");
  });
});