import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  Bed,
  UtensilsCrossed,
  Sparkles,
  Star,
  Phone,
  Camera,
  Mountain,
  Link2 as LinkIcon,
} from "lucide-react";
import { useSiteContent, pickText } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import SiteLink from "@/components/SiteLink";
import { siteHref } from "@/lib/siteLinks";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { header } = useSiteContent();
  const ICONS: Record<string, typeof Bed> = { rooms: Bed, gallery: Camera, trekking: Mountain, amenities: Sparkles, reviews: Star, menu: UtensilsCrossed, contact: Phone };
  const iconFor = (href: string) => ICONS[href.replace(/^[#/]/, "")] || LinkIcon;
  const navLinks = header.links.filter((l) => l.visible && siteHref(l.href)).map((l) => ({
    id: l.id,
    label: pickText(l.label, i18n.language, l.tKey ? t(l.tKey) : l.href),
    href: l.href,
    icon: iconFor(l.href),
  }));
  const bookLabel = pickText(header.bookLabel, i18n.language, t("nav.bookNow"));
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ top: "var(--banner-h, 0px)" }}
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-[0_4px_30px_-4px_hsl(var(--primary)/0.08)] border-b border-primary/10"
          : "bg-card/90 backdrop-blur-xl border-b border-primary/10"
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between gap-2 px-3 sm:px-6 py-3 xl:py-4">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2 min-w-0 max-w-[45%] xl:max-w-[22%]"
        >
          <div className="relative hidden sm:flex shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 border border-primary/30 items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Mountain size={20} className="text-primary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
          </div>
          <div className="leading-tight min-w-0 break-words">
            <span className="font-serif text-xs sm:text-base font-bold text-foreground block">
              {header.brandTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-primary/80 font-sans font-medium uppercase">
              {header.brandSubtitle}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden xl:flex flex-1 min-w-0 flex-wrap justify-center items-center gap-1">
          {navLinks.map((l) => {
            const inner = (
              <span className="relative px-2 py-2 text-[13px] font-sans font-medium text-foreground/70 hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5 flex items-center gap-1.5 group break-words">
                <l.icon
                  size={14}
                  className="text-primary/50 group-hover:text-primary transition-colors"
                />
                {l.label}
              </span>
            );

            return (
              <SiteLink key={l.id} href={l.href}>
                {inner}
              </SiteLink>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden xl:flex shrink-0 items-center gap-1">
          <CurrencySwitcher />
          <LanguageSwitcher />
          <Button variant="ghost" size="icon"
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-xl hover:bg-muted/80 transition-all duration-300 text-foreground/60 hover:text-foreground active:scale-95"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>

          {user ? (
            <Link to="/dashboard">
              <Button
                size="sm"
                variant="outline"
                className="font-sans tracking-wide gap-2 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <User size={15} />
                {t("nav.dashboard")}
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                variant="ghost"
                className="font-sans tracking-wide rounded-xl hover:bg-primary/5 text-foreground/70 hover:text-primary"
              >
                {t("nav.signIn")}
              </Button>
            </Link>
          )}

          {header.showBookButton && siteHref(header.bookHref) && <Button asChild
            size="sm"
            className="bg-booking-blue text-booking-blue-foreground hover:bg-booking-blue/90 font-sans font-semibold shadow-lg px-4 max-w-44 h-auto min-h-9 whitespace-normal text-center"
          ><SiteLink href={header.bookHref}>
              {bookLabel}
          </SiteLink></Button>}
        </div>

        {/* Mobile controls */}
        <div className="flex shrink-0 items-center gap-0.5 xl:hidden">
          <CurrencySwitcher />
          <LanguageSwitcher />
          <Button variant="ghost" size="icon"
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-foreground/60 active:scale-95"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-foreground active:scale-95"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.div>
            </AnimatePresence>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[56px] bg-media-overlay/50 backdrop-blur-sm xl:hidden z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="xl:hidden bg-card/95 backdrop-blur-2xl border-b border-primary/10 relative z-50 shadow-2xl"
            >
              <div className="flex flex-col py-3 px-4 max-h-[calc(100svh-var(--banner-h,0px)-80px)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-1.5">
                  {navLinks.map((l, i) => {
                    const content = (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-sans font-medium text-foreground/75 hover:text-primary hover:bg-primary/5 transition-all active:scale-[0.97] min-w-0 break-words"
                      >
                        <l.icon size={16} className="text-primary/60" />
                        {l.label}
                      </motion.div>
                    );

                    return (
                      <SiteLink
                        key={l.id}
                        href={l.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        {content}
                      </SiteLink>
                    );
                  })}
                </div>

                <div className="border-t border-border/50 mt-3 pt-3 flex flex-col gap-2">
                  {user ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="w-full"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full font-sans gap-2 rounded-xl border-border/60"
                      >
                        <User size={16} />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="w-full"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full font-sans rounded-xl border-border/60"
                      >
                        Sign In
                      </Button>
                    </Link>
                  )}
                  {header.showBookButton && siteHref(header.bookHref) && <Button asChild size="lg" className="w-full bg-booking-blue text-booking-blue-foreground hover:bg-booking-blue/90 font-sans shadow-lg whitespace-normal h-auto min-h-11"><SiteLink
                    href={header.bookHref}
                    onClick={() => setMobileOpen(false)}
                    className="w-full"
                  >
                      {bookLabel}
                  </SiteLink></Button>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
