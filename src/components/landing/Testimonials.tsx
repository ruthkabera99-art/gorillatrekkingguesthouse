import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "James Mitchell",
    country: "USA",
    flag: "🇺🇸",
    date: "March 2026",
    rating: 5,
    text: "From the moment we arrived, we felt like royalty. The gorilla trekking experience was life-changing and the accommodation was world-class. Staff went above and beyond.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Emma Thompson",
    country: "United Kingdom",
    flag: "🇬🇧",
    date: "February 2026",
    rating: 5,
    text: "Best stay we've had in East Africa. Beautiful rooms, incredible breakfast, and the view of the Virungas at sunrise is unforgettable. Booking direct saved us 20%.",
    color: "from-rose-500 to-pink-600",
  },
  {
    name: "Sophia Laurent",
    country: "France",
    flag: "🇫🇷",
    date: "January 2026",
    rating: 5,
    text: "Une expérience absolument magique. Le service était impeccable et le trek aux gorilles, organisé par l'équipe, restera l'un des moments forts de notre vie.",
    color: "from-amber-500 to-orange-600",
  },
  {
    name: "Lukas Müller",
    country: "Germany",
    flag: "🇩🇪",
    date: "December 2025",
    rating: 5,
    text: "Outstanding hospitality and very clean rooms. Excellent location, just minutes from the park. The team helped us with permits and transfers — everything ran smoothly.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Wei Chen",
    country: "China",
    flag: "🇨🇳",
    date: "November 2025",
    rating: 5,
    text: "非常棒的体验! Beautiful guest house with attentive staff who speak multiple languages. Loved the Rwandan coffee on arrival and the comfortable beds after a long trek.",
    color: "from-red-500 to-rose-600",
  },
  {
    name: "Olivia Carter",
    country: "Australia",
    flag: "🇦🇺",
    date: "October 2025",
    rating: 5,
    text: "Worth every penny. The Deluxe room was spacious and stylish, the food was fresh and local, and the WhatsApp support before our stay was super responsive.",
    color: "from-violet-500 to-purple-600",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

const Testimonials = () => {
  return (
    <section id="reviews" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Guest Experiences
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            What Our Guests Say
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-4" />
          <p className="text-muted-foreground font-sans text-sm sm:text-base">
            Real reviews from travelers around the world · Average rating 4.9 / 5
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {reviews.map((r, i) => (
            <motion.article
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-sans font-bold shadow-md`}
                  aria-hidden="true"
                >
                  {initials(r.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-semibold text-foreground truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                    <span className="text-base leading-none">{r.flag}</span>
                    <span>{r.country}</span>
                    <span>·</span>
                    <span>{r.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={14}
                    className={
                      idx < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                    }
                  />
                ))}
              </div>

              <p className="text-sm sm:text-[15px] text-foreground/80 font-sans leading-relaxed flex-1">
                "{r.text}"
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
