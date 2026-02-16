import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const rooms = [
  {
    type: "Standard",
    price: 199,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
    capacity: 2,
    rating: 4.5,
    description: "Comfortable elegance with city views and modern amenities.",
  },
  {
    type: "Deluxe",
    price: 349,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
    capacity: 2,
    rating: 4.7,
    description: "Spacious retreat with premium furnishings and a private balcony.",
  },
  {
    type: "Executive",
    price: 549,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
    capacity: 3,
    rating: 4.8,
    description: "Business-class luxury with a separate lounge and workspace.",
  },
  {
    type: "Presidential Suite",
    price: 1299,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    capacity: 4,
    rating: 4.9,
    description: "The pinnacle of opulence — panoramic views, butler service, and grandeur.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const RoomShowcase = () => {
  return (
    <section id="rooms" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            Accommodations
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
            Our Finest Rooms
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {rooms.map((room) => (
            <motion.div key={room.type} variants={item}>
              <Card className="group overflow-hidden border-0 shadow-luxury hover:shadow-2xl transition-all duration-500 bg-card">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.image}
                    alt={`${room.type} room`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white">
                    <Star size={14} className="fill-primary text-primary" />
                    <span className="text-sm font-sans">{room.rating}</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-card-foreground mb-1">
                    {room.type}
                  </h3>
                  <p className="text-sm text-muted-foreground font-sans mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary font-sans">${room.price}</span>
                      <span className="text-xs text-muted-foreground font-sans"> / night</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users size={14} />
                      <span className="text-xs font-sans">{room.capacity}</span>
                    </div>
                  </div>
                  <Link to="/rooms">
                    <Button className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-sans tracking-wide">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default RoomShowcase;
