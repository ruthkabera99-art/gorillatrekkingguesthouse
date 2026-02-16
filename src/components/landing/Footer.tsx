import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">AURUM</h3>
            <p className="text-sm text-secondary-foreground/70 font-sans leading-relaxed">
              Where luxury meets timeless elegance. Experience world-class hospitality at its finest.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/70">
              {["About Us", "Our Rooms", "Amenities", "Special Offers", "Gallery"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5 font-sans text-sm text-secondary-foreground/70">
              {["FAQ", "Terms & Conditions", "Privacy Policy", "Cancellation Policy", "Careers"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-secondary-foreground/70 font-sans mb-4">
              Subscribe for exclusive offers and updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 font-sans"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans px-5 flex-shrink-0">
                Join
              </Button>
            </form>

            <div className="flex gap-3 mt-6">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                  aria-label="Social media"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/50 font-sans">
            © {new Date().getFullYear()} Aurum Hotels. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
