import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sophia Laurent",
    location: "Paris, France",
    rating: 5,
    text: "An absolutely breathtaking experience. The Presidential Suite exceeded all expectations — impeccable service, stunning views, and every detail thoughtfully curated.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
  {
    name: "James Mitchell",
    location: "New York, USA",
    rating: 5,
    text: "From the moment we arrived, we felt like royalty. The gorilla trekking experience was life-changing and the accommodation was world-class.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    name: "Yuki Tanaka",
    location: "Tokyo, Japan",
    rating: 5,
    text: "The perfect blend of adventure and comfort. Waking up to the Virunga Mountains every morning was magical. Already planning our return.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
  },
  {
    name: "Isabella Romano",
    location: "Milan, Italy",
    rating: 4,
    text: "Exceptional attention to detail throughout. The local cuisine was outstanding, and the staff went above and beyond. A jewel of Rwanda.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((c) => (c + 1) % reviews.length);
  const prev = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);

  const review = reviews[current];

  return (
    <section id="reviews" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Guest Experiences
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            What Our Guests Say
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          {/* Large quote decoration */}
          <Quote
            size={120}
            className="absolute -top-6 left-0 text-primary/[0.05] hidden md:block"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4 sm:px-12"
            >
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mx-auto mb-6 ring-2 ring-primary/30 ring-offset-4 ring-offset-background">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-lg sm:text-xl md:text-2xl text-foreground/85 font-serif font-light leading-relaxed mb-8 italic">
                "{review.text}"
              </p>

              <div className="flex items-center justify-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }
                  />
                ))}
              </div>

              <p className="font-serif text-lg sm:text-xl font-semibold text-foreground">
                {review.name}
              </p>
              <p className="text-sm text-muted-foreground font-sans">{review.location}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-6 mt-10 sm:mt-14">
            <button
              onClick={prev}
              className="p-3 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30 transition-all text-foreground/60 hover:text-primary active:scale-95"
              aria-label="Previous review"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/20 w-2.5 hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-3 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30 transition-all text-foreground/60 hover:text-primary active:scale-95"
              aria-label="Next review"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
