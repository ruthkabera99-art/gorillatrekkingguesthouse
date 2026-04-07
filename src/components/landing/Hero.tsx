import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, MapPin, Star, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
        poster="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80"
      >
        <source
          src="https://videos.pexels.com/video-files/3773486/3773486-uhd_2560_1440_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Decorative corner frames */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-primary/40 hidden lg:block" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-primary/40 hidden lg:block" />
      <div className="absolute bottom-20 left-8 w-20 h-20 border-l-2 border-b-2 border-primary/40 hidden lg:block" />
      <div className="absolute bottom-20 right-8 w-20 h-20 border-r-2 border-b-2 border-primary/40 hidden lg:block" />

      <div className="relative z-10 text-center px-5 sm:px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-6"
        >
          <Award size={14} className="text-primary" />
          <span className="text-xs tracking-[0.15em] uppercase text-primary font-sans">
            Rwanda's Premier Guest House
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.05] mb-6"
        >
          Gorilla Trekking
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="block text-gradient-gold mt-1"
          >
            Guest House
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="w-24 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-base sm:text-lg md:text-xl text-white/75 font-sans font-light max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          Experience authentic Rwandan hospitality, breathtaking mountain views,
          and unforgettable gorilla trekking adventures.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-4 text-white/50 text-sm font-sans mb-10"
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-primary" />
            Musanze, Rwanda
          </span>
          <span className="w-1 h-1 rounded-full bg-primary/50" />
          <span className="flex items-center gap-1.5">
            <Star size={14} className="text-primary fill-primary" />
            4.9 Rating
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5"
        >
          <Link to="/rooms" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 sm:px-14 py-6 sm:py-7 text-base font-sans tracking-widest uppercase shadow-luxury transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Book Your Stay
            </Button>
          </Link>
          <Link to="/menu" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-10 sm:px-14 py-6 sm:py-7 text-base font-sans tracking-widest uppercase backdrop-blur-sm transition-all duration-300"
            >
              🍽️ Order Online
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-sans">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown size={20} className="text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
