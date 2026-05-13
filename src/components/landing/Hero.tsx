import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Star, Award } from "lucide-react";
import BookingSearchBar from "./BookingSearchBar";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-32 sm:pb-40">
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      <div className="relative z-10 w-full px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-booking-yellow/40 bg-booking-yellow/10 backdrop-blur-sm mb-5"
          >
            <Award size={14} className="text-booking-yellow" />
            <span className="text-xs tracking-[0.15em] uppercase text-booking-yellow font-sans font-semibold">
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.05] mb-4"
          >
            {t("hero.title1")}
            <span className="block text-gradient-gold mt-1">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base sm:text-lg text-white/85 font-sans font-light max-w-2xl mx-auto mb-5 leading-relaxed"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-4 text-white/70 text-sm font-sans"
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-booking-yellow" />
              {t("hero.location")}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-booking-yellow fill-booking-yellow" />
              9.4 / 10
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <BookingSearchBar variant="hero" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

