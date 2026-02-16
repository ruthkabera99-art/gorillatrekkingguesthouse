import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" poster="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80">
        <source src="https://videos.pexels.com/video-files/3773486/3773486-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-sm md:text-base tracking-[0.3em] uppercase text-white/70 font-sans mb-4">
          Welcome to Aurum Hotels
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
          Where Luxury Meets
          <span className="block text-gradient-gold">Timeless Elegance</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="text-lg md:text-xl text-white/80 font-sans font-light max-w-2xl mx-auto mb-10">
          Experience world-class hospitality, breathtaking views, and unforgettable moments crafted just for you.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/rooms">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-base font-sans tracking-wide shadow-luxury">
              Book Your Stay
            </Button>
          </Link>
          <a href="#rooms">
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-base font-sans tracking-wide backdrop-blur-sm">
              Explore Rooms
            </Button>
          </a>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ChevronDown size={28} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
