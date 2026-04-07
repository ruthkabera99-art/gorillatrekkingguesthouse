import { motion } from "framer-motion";
import { Mountain, TreePine, Heart, Compass } from "lucide-react";

const stats = [
  { value: "500+", label: "Happy Guests", icon: Heart },
  { value: "4.9", label: "Average Rating", icon: Mountain },
  { value: "15+", label: "Trekking Routes", icon: Compass },
  { value: "8", label: "Years Experience", icon: TreePine },
];

const Experience = () => {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80"
          alt="Rwanda landscape"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/85 to-secondary/70" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
              Our Story
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-secondary-foreground leading-tight mb-6">
              Where Adventure
              <span className="text-gradient-gold block">Meets Comfort</span>
            </h2>
            <div className="w-16 h-[2px] bg-primary mb-6" />
            <p className="text-base sm:text-lg text-secondary-foreground/70 font-sans font-light leading-relaxed mb-4">
              Nestled at the foot of the Virunga Mountains, our guest house offers
              the perfect base camp for gorilla trekking expeditions while providing
              all the comforts of a luxury retreat.
            </p>
            <p className="text-sm sm:text-base text-secondary-foreground/60 font-sans font-light leading-relaxed">
              Every detail — from locally sourced cuisine to handcrafted décor — reflects
              our deep connection to Rwandan culture and the breathtaking natural beauty
              that surrounds us.
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 sm:gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-5 sm:p-7 text-center hover:bg-white/15 transition-all duration-500 group"
              >
                <stat.icon
                  size={28}
                  className="text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"
                />
                <p className="text-2xl sm:text-3xl font-serif font-bold text-secondary-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-secondary-foreground/60 font-sans tracking-wide">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
