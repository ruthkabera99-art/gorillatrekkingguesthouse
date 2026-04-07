import { motion } from "framer-motion";
import {
  Wifi,
  Waves,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Car,
  Coffee,
  Shield,
} from "lucide-react";

const amenities = [
  { icon: Wifi, label: "Free WiFi", desc: "High-speed throughout" },
  { icon: Waves, label: "Infinity Pool", desc: "Panoramic mountain views" },
  { icon: Sparkles, label: "Luxury Spa", desc: "World-class treatments" },
  { icon: UtensilsCrossed, label: "Fine Dining", desc: "Local & international cuisine" },
  { icon: Dumbbell, label: "Fitness Center", desc: "Modern equipment" },
  { icon: Car, label: "Free Parking", desc: "Secure on-site parking" },
  { icon: Coffee, label: "Lounge Bar", desc: "Signature cocktails" },
  { icon: Shield, label: "24/7 Security", desc: "Your safety first" },
];

const Amenities = () => {
  return (
    <section id="amenities" className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80"
          alt="Hotel interior"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-secondary/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            World-Class
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-secondary-foreground mb-4">
            Hotel Amenities
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {amenities.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="group glass rounded-2xl p-5 sm:p-7 text-center hover:bg-white/20 transition-all duration-500 cursor-default"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300">
                <a.icon size={26} className="text-primary" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-semibold text-secondary-foreground mb-1">
                {a.label}
              </h3>
              <p className="text-xs sm:text-sm text-secondary-foreground/60 font-sans">
                {a.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Amenities;
