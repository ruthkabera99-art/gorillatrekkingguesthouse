import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sophia Laurent",
    location: "Paris, France",
    rating: 5,
    text: "An absolutely breathtaking experience. The Presidential Suite exceeded all expectations — impeccable service, stunning views, and every detail thoughtfully curated.",
  },
  {
    name: "James Mitchell",
    location: "New York, USA",
    rating: 5,
    text: "From the moment we arrived, we felt like royalty. The spa treatments were world-class and the dining was Michelin-worthy. A truly transformative stay.",
  },
  {
    name: "Yuki Tanaka",
    location: "Tokyo, Japan",
    rating: 5,
    text: "The perfect blend of modern luxury and warm hospitality. The infinity pool at sunset was a moment I'll never forget. Already planning our return.",
  },
  {
    name: "Isabella Romano",
    location: "Milan, Italy",
    rating: 4,
    text: "Exceptional attention to detail throughout. The room was exquisitely designed, and the concierge went above and beyond. A jewel of a hotel.",
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % reviews.length);
  const prev = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);

  const review = reviews[current];

  return (
    <section id="reviews" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Guest Experiences
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
            What Our Guests Say
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <Quote size={40} className="text-primary/30 mx-auto mb-6" />
              <p className="text-lg md:text-xl text-foreground/90 font-sans font-light leading-relaxed mb-8 italic">
                "{review.text}"
              </p>
              <div className="flex items-center justify-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}
                  />
                ))}
              </div>
              <p className="font-serif text-lg font-semibold text-foreground">{review.name}</p>
              <p className="text-sm text-muted-foreground font-sans">{review.location}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prev}
              className="p-3 rounded-full border border-border hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
              aria-label="Previous review"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? "bg-primary w-6" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-3 rounded-full border border-border hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
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
