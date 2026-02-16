import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Rooms", href: "#rooms" },
  { label: "Menu", href: "/menu", isRoute: true },
  { label: "Amenities", href: "#amenities" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-card/90 backdrop-blur-lg shadow-lg border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-serif text-lg md:text-xl font-bold tracking-wider text-primary leading-tight">GORILLA TREKKING<span className="block text-xs tracking-[0.2em]">GUEST HOUSE</span></Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            "isRoute" in l && l.isRoute ? (
              <Link key={l.label} to={l.href} className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">{l.label}</a>
            )
          ))}
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full hover:bg-muted transition-colors text-foreground/70" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="font-sans tracking-wide gap-2">
                <User size={16} /> Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide">
                Sign In
              </Button>
            </Link>
          )}
          <Link to="/rooms">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide">
              Book Now
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full hover:bg-muted transition-colors text-foreground/70" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground" aria-label="Menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-card/95 backdrop-blur-lg border-b border-border">
            <div className="flex flex-col items-center gap-4 py-6">
              {navLinks.map((l) => (
                "isRoute" in l && l.isRoute ? (
                  <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">{l.label}</Link>
                ) : (
                  <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">{l.label}</a>
                )
              ))}
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="font-sans gap-2"><User size={16} /> Dashboard</Button>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="font-sans">Sign In</Button>
                </Link>
              )}
              <Link to="/rooms" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans">Book Now</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
