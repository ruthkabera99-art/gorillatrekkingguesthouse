import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Star, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("rooms").select("*").order("base_price");
      setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate("/")} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans">Accommodations</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Our Rooms</h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {rooms.map((room) => (
              <motion.div key={room.id} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
                <Card className="group overflow-hidden border-0 shadow-luxury hover:shadow-2xl transition-all duration-500 bg-card">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.images?.[0] || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80"}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-xs font-sans px-3 py-1 rounded-full capitalize">
                      {room.type}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-semibold text-card-foreground mb-2">{room.name}</h3>
                    <p className="text-sm text-muted-foreground font-sans mb-4 line-clamp-2">{room.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities?.slice(0, 3).map((a: string) => (
                        <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-sans">{a}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-primary font-sans">${room.base_price}</span>
                        <span className="text-xs text-muted-foreground font-sans"> / night</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users size={14} />
                        <span className="text-xs font-sans">{room.capacity} guests</span>
                      </div>
                    </div>
                    <Link to={`/rooms/${room.id}`}>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide">
                        View Details & Book
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
