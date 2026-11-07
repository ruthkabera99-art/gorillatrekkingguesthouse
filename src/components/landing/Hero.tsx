import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Star, Award } from "lucide-react";
import BookingSearchBar from "./BookingSearchBar";
import { useSiteContent, pickText, type LText } from "@/hooks/useSiteContent";

const Hero = () => {
  const { t, i18n } = useTranslation();
  const { hero } = useSiteContent();
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => { setVideoFailed(false); }, [hero.videoUrl]);
  const L = (v: LText, key: string) => pickText(v, i18n.language, t(key));

  return (
    <section className="relative min-h-[min(820px,90svh)] flex items-center justify-center overflow-hidden pt-28 pb-14 sm:pb-20">
      <img src={hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {hero.videoUrl && !videoFailed && <video
        key={hero.videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
        poster={hero.imageUrl}
        onError={() => setVideoFailed(true)}
      >
        <source
          src={hero.videoUrl}
          type="video/mp4"
          onError={() => setVideoFailed(true)}
        />
      </video>}

      {/* Cinematic overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-media-overlay/70 via-media-overlay/30 to-media-overlay/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-media-overlay/40 via-transparent to-media-overlay/40" />

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
              {L(hero.badge, "hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-media-foreground leading-[1.1] mb-4 break-words"
          >
            {L(hero.title1, "hero.title1")}
            <span className="block text-gradient-gold mt-1">{L(hero.title2, "hero.title2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base sm:text-lg text-media-foreground/85 font-sans font-light max-w-2xl mx-auto mb-5 leading-relaxed break-words"
          >
            {L(hero.subtitle, "hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 text-media-foreground/70 text-sm font-sans"
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-booking-yellow" />
              {L(hero.location, "hero.location")}
            </span>
            <span className="w-1 h-1 rounded-full bg-media-foreground/40" />
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-booking-yellow fill-booking-yellow" />
              {hero.rating}
            </span>
          </motion.div>
        </div>

        {hero.showSearch && <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <BookingSearchBar variant="hero" />
        </motion.div>}
      </div>
    </section>
  );
};

export default Hero;

