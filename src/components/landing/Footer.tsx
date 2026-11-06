import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSiteContent, pickText } from "@/hooks/useSiteContent";

const OTA_STYLE: Record<string, string> = {
  "Booking.com": "text-[#003580]", Airbnb: "text-[#FF385C]", TripAdvisor: "text-[#00AF87]", "Google Hotels": "text-[#4285F4]", Expedia: "text-[#FFC72C]",
};

const Footer = () => {
  const { t, i18n } = useTranslation();
  const { footer } = useSiteContent();
  const lang = i18n.language;
  const socials = ([["facebook", Facebook], ["instagram", Instagram], ["twitter", Twitter], ["youtube", Youtube]] as const)
    .filter(([k]) => footer.socials[k]);
  const otas = footer.otaLinks.filter((o) => o.name.trim());

  return (
    <footer className="bg-secondary text-secondary-foreground relative overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Find us on (OTA badges) */}
      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-wrap">
          <span className="text-xs uppercase tracking-[0.2em] text-secondary-foreground/60 font-sans font-semibold">
            {t("footer.findUs")}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {otas.map((ota) => (
              <a
                key={ota.id}
                href={ota.href || "#"}
                target={ota.href ? "_blank" : undefined}
                rel="noopener noreferrer"
                title={ota.href ? ota.name : `${ota.name} listing — coming soon`}
                className={`bg-white ${OTA_STYLE[ota.name] || "text-foreground"} px-3 py-2 rounded-lg text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 hover:scale-105 transition-transform shadow-sm`}
              >
                {ota.name}
                <ExternalLink size={12} className="opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 pt-6 border-t border-secondary-foreground/10">
          <div className="col-span-2 md:col-span-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-2">
              {footer.brandTitle}
              <span className="block text-xs sm:text-sm tracking-[0.2em] text-secondary-foreground/60 font-sans font-normal">
                {footer.brandSubtitle}
              </span>
            </h3>
            <div className="w-10 h-[2px] bg-primary/40 mb-4" />
            <p className="text-sm text-secondary-foreground/60 font-sans leading-relaxed max-w-xs">
              {pickText(footer.tagline, lang, t("footer.tagline"))}
            </p>

            {socials.length > 0 && <div className="flex gap-3 mt-6">
              {socials.map(([k, Icon]) => (
                <a
                  key={k}
                  href={footer.socials[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  aria-label={k}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>}
          </div>

          {footer.columns.map((col) => (
            <div key={col.id} className="md:col-span-2">
              <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
                {pickText(col.title, lang, col.tKey ? t(col.tKey) : "")}
              </h4>
              <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/60">
                {col.links.map((l) => {
                  const label = pickText(l.label, lang, l.href);
                  return (
                    <li key={l.id}>
                      {l.href.startsWith("/") ? (
                        <Link to={l.href} className="hover:text-primary transition-colors">{label}</Link>
                      ) : (
                        <a href={l.href || "#"} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="hover:text-primary transition-colors">{label}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {footer.showNewsletter && <div className="col-span-2 md:col-span-4">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              {t("footer.newsletter")}
            </h4>
            <p className="text-sm text-secondary-foreground/60 font-sans mb-4">
              {t("footer.newsletterDesc")}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="you@email.com"
                className="bg-secondary-foreground/5 border-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/30 font-sans text-sm rounded-xl"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans px-4 flex-shrink-0 active:scale-95 rounded-xl">
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>}
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 sm:mt-16 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-secondary-foreground/40 font-sans">
            © {new Date().getFullYear()} {footer.copyright}. {t("footer.rights")}
          </p>
          <p className="text-xs text-secondary-foreground/30 font-sans">
            {footer.bottomNote}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
