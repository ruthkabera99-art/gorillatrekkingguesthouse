/** Only site paths, home anchors and explicit web/contact URLs are navigable. */
export function siteHref(value: string): string | null {
  const href = value.trim();
  if (!href || /[\u0000-\u0020\\]/.test(href)) return null;
  if (href.startsWith("#")) return href === "#" ? null : `/${href}`;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(mailto:|tel:)/i.test(href)) return href;
  try {
    const url = new URL(href);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? href : null;
  } catch { return null; }
}

export function mediaHref(value: string): boolean {
  return !value.trim() || !!siteHref(value) && /^(https?:\/\/|\/(?!\/))/i.test(value.trim()) && !value.trim().startsWith("/#");
}