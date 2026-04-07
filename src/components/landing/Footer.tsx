import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-2">
              GORILLA TREKKING
              <span className="block text-xs sm:text-sm tracking-[0.2em] text-secondary-foreground/60 font-sans font-normal">
                GUEST HOUSE
              </span>
            </h3>
            <div className="w-10 h-[2px] bg-primary/40 mb-4" />
            <p className="text-sm text-secondary-foreground/60 font-sans leading-relaxed max-w-xs">
              Authentic Rwandan hospitality at the foot of the Virunga Mountains.
              Your gateway to unforgettable gorilla trekking adventures.
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

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              Explore
            </h4>
            <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/60">
              {[
                { label: "Our Rooms", to: "/rooms" },
                { label: "Restaurant", to: "/menu" },
                { label: "About Us", href: "#" },
                { label: "Gallery", href: "#" },
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

          {/* Support */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              Support
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

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-4">
            <h4 className="font-serif text-base font-semibold mb-4 text-secondary-foreground/90">
              Stay Updated
            </h4>
            <p className="text-sm text-secondary-foreground/60 font-sans mb-4">
              Subscribe for exclusive offers, trekking tips, and updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
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
            © {new Date().getFullYear()} Gorilla Trekking Guest House. All rights reserved.
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
