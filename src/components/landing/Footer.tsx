import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const OTA_LINKS = [
  { name: "Booking.com", href: "#", color: "text-[#003580]", bg: "bg-white" },
  { name: "Airbnb", href: "#", color: "text-[#FF385C]", bg: "bg-white" },
  { name: "TripAdvisor", href: "#", color: "text-[#00AF87]", bg: "bg-white" },
  { name: "Google Hotels", href: "#", color: "text-[#4285F4]", bg: "bg-white" },
  { name: "Expedia", href: "#", color: "text-[#FFC72C]", bg: "bg-white" },
];

const Footer = () => {
  const { t } = useTranslation();

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
            {OTA_LINKS.map((ota) => (
              <a
                key={ota.name}
                href={ota.href}
                title={`${ota.name} listing — coming soon`}
                className={`${ota.bg} ${ota.color} px-3 py-2 rounded-lg text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 hover:scale-105 transition-transform shadow-sm`}
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
              GORILLA TREKKING
              <span className="block text-xs sm:text-sm tracking-[0.2em] text-secondary-foreground/60 font-sans font-normal">
                GUEST HOUSE
              </span>
            </h3>
            <div className="w-10 h-[2px] bg-primary/40 mb-4" />
            <p className="text-sm text-secondary-foreground/60 font-sans leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>

            <div className="flex gap-3 mt-6">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  aria-label="Social media"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              {t("footer.explore")}
            </h4>
            <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/60">
              {[
                { label: t("nav.rooms"), to: "/rooms" },
                { label: t("nav.menu"), to: "/menu" },
                { label: t("nav.gallery"), href: "#gallery" },
                { label: t("nav.trekking"), href: "#trekking" },
              ].map((l) => (
                <li key={l.label}>
                  {"to" in l ? (
                    <Link to={l.to!} className="hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className="hover:text-primary transition-colors">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              {t("footer.support")}
            </h4>
            <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/60">
              {["FAQ", "Terms & Conditions", "Privacy Policy", "Cancellation Policy"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-primary transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-4">
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
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 sm:mt-16 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-secondary-foreground/40 font-sans">
            © {new Date().getFullYear()} Gorilla Trekking Guest House. {t("footer.rights")}
          </p>
          <p className="text-xs text-secondary-foreground/30 font-sans">
            Musanze, Rwanda 🇷🇼
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
