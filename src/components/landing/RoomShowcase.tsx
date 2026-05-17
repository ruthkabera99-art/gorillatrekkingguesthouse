import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Star, ArrowRight, Wifi, Coffee, Tv } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import PaymentBadges from "./PaymentBadges";

const DISCOUNT = 0.2;

const rooms = [
  {
    type: "Standard",
    price: 45000,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    capacity: 2,
    rating: 4.5,
    description: "Comfortable elegance with mountain views and modern amenities.",
  },
  {
    type: "Deluxe",
    price: 75000,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    capacity: 2,
    rating: 4.7,
    description: "Spacious retreat with premium furnishings and a private balcony.",
  },
  {
    type: "Executive",
    price: 120000,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    capacity: 3,
    rating: 4.8,
    description: "Business-class luxury with a separate lounge and workspace.",
  },
  {
    type: "Presidential Suite",
    price: 250000,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    capacity: 4,
    rating: 4.9,
    description: "The pinnacle of opulence — panoramic views, butler service, and grandeur.",
    featured: true,
  },
];

const RoomShowcase = () => {
  const { format } = useCurrency();
  const navigate = useNavigate();

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      navigate("/rooms");
    }
  };

  return (
    <section id="rooms" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Accommodations
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Our Finest Rooms
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {rooms.map((room, i) => {
            const discounted = Math.round(room.price * (1 - DISCOUNT));
            return (
              <motion.div
                key={room.type}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <Link to="/rooms" aria-label={`View details for ${room.type}`} className="group relative block overflow-hidden rounded-2xl bg-card border border-border shadow-lg hover:shadow-2xl transition-all duration-700 h-full cursor-pointer">
                  <div className="relative h-56 sm:h-72 overflow-hidden">
                    <img
                      src={room.image}
                      alt={`${room.type} room at Gorilla Trekking Guest House`}
                      className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* 20% OFF gold badge */}
                    <div
                      className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider shadow-lg"
                      style={{
                        background: "hsl(var(--gold))",
                        color: "hsl(var(--navy))",
                      }}
                    >
                      20% OFF
                    </div>

                    {/* Price badge */}
                    <div className="absolute top-4 right-4 px-3 py-2 rounded-xl glass text-white text-right">
                      <div className="text-[10px] line-through opacity-70 font-sans">
                        {format(room.price)}
                      </div>
                      <div className="text-sm font-sans font-bold leading-tight">
                        {format(discounted)}
                        <span className="text-[10px] font-normal opacity-70"> /night</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-1">
                          {room.type}
                        </h3>
                        <p className="text-sm text-white/70 font-sans line-clamp-1">
                          {room.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Star size={16} className="fill-primary" />
                          <span className="text-sm font-sans font-semibold">{room.rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users size={16} />
                          <span className="text-sm font-sans">{room.capacity} Guests</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                          <Wifi size={14} />
                          <Coffee size={14} />
                          <Tv size={14} />
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center font-sans tracking-wide text-primary gap-2 text-sm font-medium px-3 py-2 rounded-md group-hover:bg-primary/10 transition-colors"
                      >
                        View Details
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-14"
        >
          <Link to="/rooms">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-widest uppercase px-12 py-6 shadow-luxury hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Book Now
            </Button>
          </Link>
          <PaymentBadges />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground font-sans">
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="fill-primary text-primary" /> 4.9 · TripAdvisor
            </span>
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="fill-primary text-primary" /> 4.9 · Google Reviews
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RoomShowcase;
