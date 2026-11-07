import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, ArrowRight, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSiteContent, pickText } from "@/hooks/useSiteContent";
import SiteLink from "@/components/SiteLink";
import { siteHref } from "@/lib/siteLinks";
import { useHotelInfo } from "@/hooks/useHotelInfo";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const { footer } = useSiteContent();
  const hotel = useHotelInfo();
  const [email, setEmail] = useState("");
  const lang = i18n.language;
  const socials = ([["facebook", Facebook], ["instagram", Instagram], ["twitter", Twitter], ["youtube", Youtube]] as const)
    .filter(([k]) => footer.socials[k] && siteHref(footer.socials[k]));
  const otas = footer.otaLinks.filter((o) => o.name.trim() && siteHref(o.href));

  return (
    <footer className="bg-navy text-navy-foreground relative overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Find us on (OTA badges) */}
      {otas.length > 0 && <div className="container mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-wrap">
          <span className="text-xs uppercase tracking-[0.2em] text-navy-foreground/60 font-sans font-semibold">
            {t("footer.findUs")}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {otas.map((ota) => (
              <SiteLink
                key={ota.id}
                href={ota.href}
                title={ota.name}
                className="bg-card text-card-foreground px-3 py-2 rounded-lg text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 hover:scale-105 transition-transform shadow-sm"
              >
                {ota.name}
                <ExternalLink size={12} className="opacity-60" />
              </SiteLink>
            ))}
          </div>
        </div>
      </div>}

      <div className="container mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pt-10 border-t border-navy-foreground/10">
          <div className="sm:col-span-2 lg:col-span-1 min-w-0 break-words">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-2">
              {footer.brandTitle}
              <span className="block text-xs sm:text-sm tracking-[0.2em] text-navy-foreground/60 font-sans font-normal">
                {footer.brandSubtitle}
              </span>
            </h3>
            <div className="w-10 h-[2px] bg-primary/40 mb-4" />
            <p className="text-sm text-navy-foreground/60 font-sans leading-relaxed max-w-xs">
              {pickText(footer.tagline, lang, t("footer.tagline"))}
            </p>

            {socials.length > 0 && <div className="flex gap-3 mt-6">
              {socials.map(([k, Icon]) => (
                <SiteLink
                  key={k}
                  href={footer.socials[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-navy-foreground/5 border border-navy-foreground/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  aria-label={k}
                >
                  <Icon size={16} />
                </SiteLink>
              ))}
            </div>}
          </div>

          {footer.columns.filter((col) => col.links.some((l) => siteHref(l.href))).map((col) => (
            <div key={col.id} className="min-w-0 break-words">
              <h4 className="font-serif text-base font-semibold mb-4 text-navy-foreground/90">
                {pickText(col.title, lang, col.tKey ? t(col.tKey) : "")}
              </h4>
              <ul className="space-y-2.5 font-sans text-sm text-navy-foreground/60">
                {col.links.filter((l) => siteHref(l.href)).map((l) => {
                  const label = pickText(l.label, lang, l.href);
                  return (
                    <li key={l.id}>
                      <SiteLink href={l.href} className="hover:text-primary transition-colors">{label}</SiteLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {footer.showNewsletter && hotel.email && <div className="sm:col-span-2 lg:col-span-1 min-w-0">
            <h4 className="font-serif text-base font-semibold mb-4 text-navy-foreground/90">
              {t("footer.newsletter")}
            </h4>
            <p className="text-sm text-navy-foreground/60 font-sans mb-4">
              {t("footer.newsletterDesc")}
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `mailto:${hotel.email}?subject=${encodeURIComponent("Newsletter subscription request")}&body=${encodeURIComponent(`Please send hotel news to ${email}.`)}`;
            }} className="flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Newsletter email"
                placeholder="you@email.com"
                className="min-w-0 bg-navy-foreground/5 border-navy-foreground/10 text-navy-foreground placeholder:text-navy-foreground/30 font-sans text-sm rounded-lg"
              />
              <Button type="submit" aria-label="Request newsletter by email" title="Request newsletter by email" className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans px-4 flex-shrink-0 active:scale-95 rounded-lg">
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>}
        </div>

        <div className="border-t border-navy-foreground/10 mt-12 sm:mt-16 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-navy-foreground/60 font-sans break-words">
            © {new Date().getFullYear()} {footer.copyright}. {t("footer.rights")}
          </p>
          <p className="text-xs text-navy-foreground/60 font-sans break-words">
            {footer.bottomNote}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
