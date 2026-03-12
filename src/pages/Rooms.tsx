import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, ArrowLeft, Check, CalendarDays, Wifi, Wind, Tv, Coffee, Car, UtensilsCrossed, Bath, Eye, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi": <Wifi size={12} />,
  "AC": <Wind size={12} />,
  "TV": <Tv size={12} />,
  "Coffee Maker": <Coffee size={12} />,
  "Parking": <Car size={12} />,
  "Room Service": <UtensilsCrossed size={12} />,
  "Bathtub": <Bath size={12} />,
  "Mountain View": <Eye size={12} />,
  "Safe Box": <Lock size={12} />,
  "Breakfast Included": <Sparkles size={12} />,
};

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRoom, setBookingRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("rooms").select("*").eq("status", "available").order("base_price");
      setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const totalPrice = bookingRoom ? nights * Number(bookingRoom.base_price) : 0;

  const openBooking = (room: any) => {
    setBookingRoom(room);
    setCheckIn("");
    setCheckOut("");
    setAdults(1);
    setChildren(0);
    setSpecialRequests("");
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please sign in to book a room.");
      navigate("/auth");
      return;
    }
    if (nights <= 0) {
      toast.error("Please select valid dates.");
      return;
    }
    if (adults + children > bookingRoom.capacity) {
      toast.error(`Max capacity is ${bookingRoom.capacity} guests.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      room_id: bookingRoom.id,
      check_in: checkIn,
      check_out: checkOut,
      guests_adults: adults,
      guests_children: children,
      total_price: totalPrice,
      special_requests: specialRequests || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Booking submitted! You'll receive a confirmation soon.");
      setBookingRoom(null);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-4 mb-8 sm:mb-10">
          <button onClick={() => navigate("/")} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-sans">Accommodations</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground">Our Rooms</h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-sans">No rooms available at the moment.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rooms.map((room) => (
              <motion.div key={room.id} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
                <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-card">
                  <div className="relative h-56 sm:h-64 overflow-hidden">
                    <img
                      src={room.images?.[0] || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80"}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-sans px-3 py-1 rounded-full capitalize">
                      {room.type}
                    </span>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl font-bold text-white font-sans drop-shadow-lg">
                        {fmt(Number(room.base_price))}
                      </span>
                      <span className="text-xs text-white/80 font-sans"> / night</span>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-card-foreground">{room.name}</h3>
                      <p className="text-sm text-muted-foreground font-sans mt-1 line-clamp-2">{room.description}</p>
                    </div>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {room.amenities.slice(0, 5).map((a: string) => (
                          <span key={a} className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-sans">
                            {AMENITY_ICONS[a] || <Check size={10} />}
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 5 && (
                          <span className="text-xs text-muted-foreground font-sans px-2 py-1">+{room.amenities.length - 5} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users size={14} />
                        <span className="text-xs font-sans">{room.capacity} guests</span>
                      </div>
                      <Button onClick={() => openBooking(room)} className="font-sans text-sm gap-1.5">
                        <CalendarDays size={14} /> Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!bookingRoom} onOpenChange={(open) => !open && setBookingRoom(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Book {bookingRoom?.name}</DialogTitle>
          </DialogHeader>
          {bookingRoom && (
            <div className="space-y-4">
              {/* Room preview */}
              <div className="flex gap-3 items-center p-3 bg-muted/50 rounded-lg border border-border">
                <img
                  src={bookingRoom.images?.[0] || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=200&q=80"}
                  alt={bookingRoom.name}
                  className="w-16 h-16 rounded-md object-cover"
                />
                <div>
                  <p className="font-sans font-semibold text-foreground">{bookingRoom.name}</p>
                  <p className="text-sm text-muted-foreground font-sans capitalize">{bookingRoom.type} · {bookingRoom.capacity} guests</p>
                  <p className="text-sm font-bold text-primary font-sans">{fmt(Number(bookingRoom.base_price))}/night</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-sans text-xs">Check-in</Label>
                  <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={today} className="mt-1 font-sans" />
                </div>
                <div>
                  <Label className="font-sans text-xs">Check-out</Label>
                  <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || today} className="mt-1 font-sans" />
                </div>
              </div>

              {/* Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-sans text-xs">Adults</Label>
                  <Input type="number" min={1} max={bookingRoom.capacity} value={adults} onChange={e => setAdults(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
                <div>
                  <Label className="font-sans text-xs">Children</Label>
                  <Input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <Label className="font-sans text-xs">Special Requests (optional)</Label>
                <Textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Any preferences or needs..." className="mt-1 font-sans" rows={2} />
              </div>

              {/* Price Calculation */}
              <AnimatePresence>
                {nights > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted rounded-lg p-3 space-y-1.5">
                      <div className="flex justify-between text-sm font-sans">
                        <span className="text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} × {fmt(Number(bookingRoom.base_price))}</span>
                      </div>
                      <div className="flex justify-between text-base font-sans border-t border-border pt-1.5">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="font-bold text-primary text-lg">{fmt(totalPrice)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleBook}
                disabled={submitting || nights <= 0}
                className="w-full font-sans py-5 text-base"
              >
                {submitting ? "Submitting..." : nights > 0 ? `Confirm Booking — ${fmt(totalPrice)}` : "Select Dates to Continue"}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground font-sans">
                  You'll need to <button onClick={() => navigate("/auth")} className="text-primary underline">sign in</button> to complete booking.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rooms;
