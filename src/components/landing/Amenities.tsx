import { motion } from "framer-motion";
import { Wifi, Waves, Sparkles, UtensilsCrossed, Dumbbell, Car, Coffee, Shield } from "lucide-react";

const amenities = [
  { icon: Wifi, label: "Free WiFi", desc: "High-speed throughout" },
  { icon: Waves, label: "Infinity Pool", desc: "Rooftop panoramic views" },
  { icon: Sparkles, label: "Luxury Spa", desc: "World-class treatments" },
  { icon: UtensilsCrossed, label: "Fine Dining", desc: "Michelin-star chefs" },
  { icon: Dumbbell, label: "Fitness Center", desc: "State-of-the-art equipment" },
  { icon: Car, label: "Valet Parking", desc: "Complimentary service" },
  { icon: Coffee, label: "Lounge Bar", desc: "Signature cocktails" },
  { icon: Shield, label: "24/7 Security", desc: "Your safety first" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const Amenities = () => {
  return (
    <section id="amenities" className="py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            World-Class
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
            Hotel Amenities
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {amenities.map((a) => (
            <motion.div
              key={a.label}
              variants={item}
              className="group glass rounded-xl p-6 text-center hover:shadow-luxury transition-all duration-500 cursor-default bg-card border border-border"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <a.icon size={26} className="text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-card-foreground mb-1">
                {a.label}
              </h3>
              <p className="text-sm text-muted-foreground font-sans">{a.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Amenities;
