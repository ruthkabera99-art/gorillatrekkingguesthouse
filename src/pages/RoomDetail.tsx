import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Users, Check, Wifi, Wind, Tv, Coffee, Car, UtensilsCrossed, Bath, Eye, Lock, Sparkles } from "lucide-react";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi": <Wifi size={14} />,
  "AC": <Wind size={14} />,
  "TV": <Tv size={14} />,
  "Coffee Maker": <Coffee size={14} />,
  "Parking": <Car size={14} />,
  "Room Service": <UtensilsCrossed size={14} />,
  "Bathtub": <Bath size={14} />,
  "Mountain View": <Eye size={14} />,
  "Safe Box": <Lock size={14} />,
  "Breakfast Included": <Sparkles size={14} />,
};

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [booking, setBooking] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle();
      setRoom(data);
      setLoading(false);
    };
    fetchRoom();
  }, [id]);

  const today = new Date().toISOString().split("T")[0];

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please sign in to book a room.");
      navigate("/auth");
      return;
    }
    const nights = calculateNights();
    if (nights <= 0) { toast.error("Please select valid dates."); return; }
    if (adults + children > room.capacity) { toast.error(`Max capacity is ${room.capacity} guests.`); return; }
    setBooking(true);
    const totalPrice = nights * Number(room.base_price);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      room_id: room.id,
      check_in: checkIn,
      check_out: checkOut,
      guests_adults: adults,
      guests_children: children,
      total_price: totalPrice,
      special_requests: specialRequests || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Booking created! You'll receive a confirmation.");
      navigate("/dashboard");
    }
    setBooking(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Room not found.</p></div>;

  const nights = calculateNights();
  const images = room.images?.length > 0 ? room.images : ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <img
              src={images[activeImage]}
              alt={room.name}
              className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover rounded-2xl shadow-lg"
            />
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImage === i ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details + Booking */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-sans capitalize">{room.type}</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">{room.name}</h1>
              <p className="text-muted-foreground font-sans mt-3 leading-relaxed">{room.description}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={16} />
              <span className="text-sm font-sans">Up to {room.capacity} guests</span>
            </div>

            {/* Amenities with icons */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((a: string) => (
                  <span key={a} className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-sans">
                    {AMENITY_ICONS[a] || <Check size={12} className="text-primary" />} {a}
                  </span>
                ))}
              </div>
            )}

            <div className="text-3xl font-bold text-primary font-sans">
              {fmt(Number(room.base_price))} <span className="text-sm font-normal text-muted-foreground">/ night</span>
            </div>

            {/* Booking form */}
            <div className="bg-card rounded-xl p-5 sm:p-6 border border-border shadow-lg space-y-4">
              <h3 className="font-serif text-lg font-semibold text-card-foreground">Book This Room</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-sans text-xs">Adults</Label>
                  <Input type="number" min={1} max={room.capacity} value={adults} onChange={e => setAdults(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
                <div>
                  <Label className="font-sans text-xs">Children</Label>
                  <Input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
              </div>
              <div>
                <Label className="font-sans text-xs">Special Requests (optional)</Label>
                <Textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Early check-in, extra pillows..." className="mt-1 font-sans" rows={2} />
              </div>
              {nights > 0 && (
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} × {fmt(Number(room.base_price))}</span>
                  </div>
                  <div className="flex justify-between font-sans border-t border-border pt-1.5">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg">{fmt(nights * Number(room.base_price))}</span>
                  </div>
                </div>
              )}
              <Button onClick={handleBook} disabled={booking || nights <= 0} className="w-full font-sans tracking-wide py-5">
                {booking ? "Booking..." : nights > 0 ? `Book Now — ${fmt(nights * Number(room.base_price))}` : "Select Dates"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
