import { describe, expect, it } from "vitest";
import { mediaHref, siteHref } from "./siteLinks";

describe("configured site links", () => {
  it("takes guests to home sections from other pages", () => { expect(siteHref("#rooms")).toBe("/#rooms"); });
  it("accepts full external URLs and local pages", () => {
    expect(siteHref("https://booking.com/hotel/test")).toBe("https://booking.com/hotel/test");
    expect(siteHref("/rooms?adults=2")).toBe("/rooms?adults=2");
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "//evil.com", "/\\evil.com", "java\nscript:alert(1)", "https://user:pass@example.com", "#"])("blocks unsafe or empty destination %s", (value) => {
    expect(siteHref(value)).toBeNull();
  });
  it("allows an empty video but not contact or anchor URLs as media", () => {
    expect(mediaHref("")).toBe(true);
    expect(mediaHref("https://example.com/photo.jpg")).toBe(true);
    expect(mediaHref("mailto:guest@example.com")).toBe(false);
    expect(mediaHref("#rooms")).toBe(false);
  });
});