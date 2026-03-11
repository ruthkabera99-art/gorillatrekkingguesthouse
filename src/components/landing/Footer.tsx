import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4">
              GORILLA TREKKING<span className="block text-xs sm:text-sm tracking-[0.15em]">GUEST HOUSE</span>
            </h3>
            <p className="text-xs sm:text-sm text-secondary-foreground/70 font-sans leading-relaxed">
              Authentic Rwandan hospitality in the heart of gorilla country. Your gateway to unforgettable trekking adventures.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-2.5 font-sans text-xs sm:text-sm text-secondary-foreground/70">
              {["About Us", "Our Rooms", "Amenities", "Special Offers", "Gallery"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-primary transition-colors active:text-primary">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h4>
            <ul className="space-y-2 sm:space-y-2.5 font-sans text-xs sm:text-sm text-secondary-foreground/70">
              {["FAQ", "Terms & Conditions", "Privacy Policy", "Cancellation Policy", "Careers"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-primary transition-colors active:text-primary">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-3 sm:mb-4">Newsletter</h4>
            <p className="text-xs sm:text-sm text-secondary-foreground/70 font-sans mb-3 sm:mb-4">
              Subscribe for exclusive offers and updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-sans text-sm"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans px-4 sm:px-5 flex-shrink-0 active:scale-95">
                Join
              </Button>
            </form>

            <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors active:scale-95"
                  aria-label="Social media"
                >
                  <Icon size={16} className="sm:hidden" />
                  <Icon size={18} className="hidden sm:block" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-secondary-foreground/50 font-sans">
            © {new Date().getFullYear()} Gorilla Trekking Guest House. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
