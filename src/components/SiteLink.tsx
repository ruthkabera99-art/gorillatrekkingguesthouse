import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { siteHref } from "@/lib/siteLinks";

export default function SiteLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const safe = siteHref(href);
  if (!safe) return <span className={props.className}>{children}</span>;
  if (safe.startsWith("/")) return <Link to={safe} {...props}>{children}</Link>;
  const external = /^https?:/i.test(safe);
  return <a {...props} href={safe} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}</a>;
}