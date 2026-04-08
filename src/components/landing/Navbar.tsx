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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Rooms", href: "#rooms", icon: Bed },
  { label: "Gallery", href: "#gallery", icon: Camera },
  { label: "Trekking", href: "#trekking", icon: Mountain },
  { label: "Amenities", href: "#amenities", icon: Sparkles },
  { label: "Reviews", href: "#reviews", icon: Star },
  { label: "Menu", href: "/menu", isRoute: true, icon: UtensilsCrossed },
  { label: "Contact", href: "#contact", icon: Phone },
];

const Navbar = () => {
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

  const handleAnchorClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-[0_4px_30px_-4px_hsl(var(--primary)/0.08)] border-b border-primary/10"
          : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 lg:py-4">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Mountain size={20} className="text-primary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div className="leading-none">
            <span className="font-serif text-sm sm:text-base font-bold tracking-wider text-foreground block">
              GORILLA TREKKING
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-primary/80 font-sans font-medium uppercase">
              Guest House
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => {
            const inner = (
              <span className="relative px-3 py-2 text-[13px] font-sans font-medium tracking-wide text-foreground/70 hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5 flex items-center gap-1.5 group">
                <l.icon
                  size={14}
                  className="text-primary/50 group-hover:text-primary transition-colors"
                />
                {l.label}
              </span>
            );

            return l.isRoute ? (
              <Link key={l.label} to={l.href}>
                {inner}
              </Link>
            ) : (
              <button
                key={l.label}
                onClick={() => handleAnchorClick(l.href)}
                className="cursor-pointer"
              >
                {inner}
              </button>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-xl hover:bg-muted/80 transition-all duration-300 text-foreground/60 hover:text-foreground active:scale-95"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user ? (
            <Link to="/dashboard">
              <Button
                size="sm"
                variant="outline"
                className="font-sans tracking-wide gap-2 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <User size={15} />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                variant="ghost"
                className="font-sans tracking-wide rounded-xl hover:bg-primary/5 text-foreground/70 hover:text-primary"
              >
                Sign In
              </Button>
            </Link>
          )}

          <Link to="/rooms">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 px-5"
            >
              Book Now
            </Button>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-foreground/60 active:scale-95"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-foreground active:scale-95"
            aria-label="Menu"
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
          </button>
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
              className="fixed inset-0 top-[56px] bg-black/50 backdrop-blur-sm lg:hidden z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden bg-card/98 backdrop-blur-2xl border-b border-primary/10 relative z-50 shadow-2xl"
            >
              <div className="flex flex-col py-3 px-5 max-h-[calc(100vh-56px)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-1.5">
                  {navLinks.map((l, i) => {
                    const content = (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-sans font-medium text-foreground/75 hover:text-primary hover:bg-primary/5 transition-all active:scale-[0.97]"
                      >
                        <l.icon size={16} className="text-primary/60" />
                        {l.label}
                      </motion.div>
                    );

                    return l.isRoute ? (
                      <Link
                        key={l.label}
                        to={l.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={l.label}
                        onClick={() => handleAnchorClick(l.href)}
                        className="text-left"
                      >
                        {content}
                      </button>
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
                  <Link
                    to="/rooms"
                    onClick={() => setMobileOpen(false)}
                    className="w-full"
                  >
                    <Button
                      size="lg"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans rounded-xl shadow-lg shadow-primary/20"
                    >
                      Book Now
                    </Button>
                  </Link>
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
