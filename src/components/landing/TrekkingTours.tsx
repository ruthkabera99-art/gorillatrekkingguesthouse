import { motion } from "framer-motion";
import { Clock, Users, Mountain, Star, Check, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

const packages = [
  {
    name: "Half-Day Trek",
    priceRwf: 150000,
    duration: "Half Day (4 h)",
    groupSize: "Up to 10",
    difficulty: "Easy",
    highlight: false,
    features: [
      "Guided forest hike with ranger",
      "Park entrance fee included",
      "Bottled water & light snack",
      "Hotel pickup & drop-off",
      "Suitable for all fitness levels",
    ],
  },
  {
    name: "Full-Day Gorilla Trek",
    priceRwf: 350000,
    duration: "1 Day (8–10 h)",
    groupSize: "Up to 8",
    difficulty: "Moderate",
    highlight: true,
    features: [
      "Gorilla trekking permit assistance",
      "Park entrance & ranger fees",
      "Hot packed lunch + drinks",
      "Hotel pickup & drop-off in 4x4",
      "Certificate of participation",
      "Photographer-friendly stops",
    ],
  },
  {
    name: "3-Day Adventure Package",
    priceRwf: 800000,
    duration: "3 Days / 2 Nights",
    groupSize: "Up to 6",
    difficulty: "Challenging",
    highlight: false,
    features: [
      "Gorilla + golden monkey tracking",
      "2 nights at Gorilla Trekking Guest House",
      "All meals & drinks included",
      "Cultural village visit (Iby'iwacu)",
      "Twin Lakes Burera & Ruhondo tour",
      "Private guide & 4x4 transfers",
    ],
  },
];

const TrekkingTours = () => {
  const navigate = useNavigate();
  const { format } = useCurrency();

  return (
    <section id="trekking" className="relative py-20 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />

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
            Curated experiences in Volcanoes National Park — choose the adventure that
            fits your schedule and fitness level.
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

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-primary">
                    {format(pkg.priceRwf)}
                  </span>
                  <span className="text-sm text-muted-foreground font-sans">/ person</span>
                </div>

                <div className="flex items-center gap-3 mb-6 text-xs sm:text-sm text-muted-foreground font-sans flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" /> {pkg.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> {pkg.groupSize}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gauge size={14} className="text-primary" /> {pkg.difficulty}
                  </span>
                </div>

                <div className="w-full h-px bg-border/50 mb-6" />

                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-3">
                  What's included
                </p>
                <ul className="space-y-2.5 mb-8">
                  {pkg.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 font-sans"
                    >
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
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
                  Book Now
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
