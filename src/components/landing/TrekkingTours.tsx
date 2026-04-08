import { motion } from "framer-motion";
import { Clock, Users, Mountain, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    name: "Silver Trek",
    price: 750,
    duration: "1 Day",
    groupSize: "Up to 8",
    highlight: false,
    features: [
      "Guided gorilla trekking permit",
      "Park entrance fees included",
      "Light packed lunch",
      "Hotel pickup & drop-off",
      "Certificate of participation",
    ],
  },
  {
    name: "Gold Safari",
    price: 1500,
    duration: "2 Days / 1 Night",
    groupSize: "Up to 6",
    highlight: true,
    features: [
      "Everything in Silver Trek",
      "Overnight luxury camp stay",
      "Full-board gourmet meals",
      "Golden monkey tracking",
      "Professional photography session",
      "Exclusive trail access",
    ],
  },
  {
    name: "Platinum Explorer",
    price: 2800,
    duration: "3 Days / 2 Nights",
    groupSize: "Up to 4",
    highlight: false,
    features: [
      "Everything in Gold Safari",
      "Private guide & tracker",
      "Helicopter scenic flight",
      "Spa & wellness session",
      "Cultural village experience",
      "Personalized souvenir kit",
    ],
  },
];

const TrekkingTours = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5A572' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Unforgettable Adventures
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Gorilla Trekking Packages
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Venture into the heart of Volcanoes National Park with our curated
            trekking experiences — from single-day encounters to immersive
            multi-day explorations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative group rounded-2xl overflow-hidden transition-all duration-500 ${
                pkg.highlight
                  ? "bg-gradient-to-b from-primary/10 via-primary/5 to-background border-2 border-primary/40 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)] scale-[1.02] md:scale-105"
                  : "bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30"
              }`}
            >
              {pkg.highlight && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-sans font-semibold tracking-wider uppercase text-center py-2">
                  <Star size={12} className="inline mr-1.5 -mt-0.5" />
                  Most Popular
                </div>
              )}

              <div className={`p-6 sm:p-8 ${pkg.highlight ? "pt-12" : ""}`}>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-2">
                  {pkg.name}
                </h3>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-primary">
                    ${pkg.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground font-sans">
                    / person
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground font-sans">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    {pkg.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-primary" />
                    {pkg.groupSize}
                  </span>
                </div>

                <div className="w-full h-px bg-border/50 mb-6" />

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 font-sans"
                    >
                      <Check
                        size={16}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/rooms")}
                  className={`w-full font-sans tracking-wide transition-all duration-300 ${
                    pkg.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "bg-transparent border border-primary/40 text-primary hover:bg-primary/10"
                  }`}
                  size="lg"
                >
                  <Mountain size={16} className="mr-2" />
                  Book This Package
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrekkingTours;
