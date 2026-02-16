import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Users, Check } from "lucide-react";

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
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle();
      setRoom(data);
      setLoading(false);
    };
    fetchRoom();
  }, [id]);

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
    if (nights <= 0) {
      toast.error("Please select valid dates.");
      return;
    }
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
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Booking created! You'll receive a confirmation email.");
      navigate("/dashboard");
    }
    setBooking(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Room not found.</p></div>;

  const nights = calculateNights();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <img
              src={room.images?.[0] || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80"}
              alt={room.name}
              className="w-full h-[500px] object-cover rounded-2xl shadow-luxury"
            />
          </motion.div>

          {/* Details + Booking */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-sans capitalize">{room.type}</span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">{room.name}</h1>
              <p className="text-muted-foreground font-sans mt-3 leading-relaxed">{room.description}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={16} />
              <span className="text-sm font-sans">Up to {room.capacity} guests</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {room.amenities?.map((a: string) => (
                <span key={a} className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-sans">
                  <Check size={12} className="text-primary" /> {a}
                </span>
              ))}
            </div>

            <div className="text-3xl font-bold text-primary font-sans">
              RWF {Number(room.base_price).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ night</span>
            </div>

            {/* Booking form */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-luxury space-y-4">
              <h3 className="font-serif text-lg font-semibold text-card-foreground">Book This Room</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-sans text-xs">Check-in</Label>
                  <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} className="mt-1 font-sans" />
                </div>
                <div>
                  <Label className="font-sans text-xs">Check-out</Label>
                  <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split("T")[0]} className="mt-1 font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-sans text-xs">Adults</Label>
                  <Input type="number" min={1} max={room.capacity} value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
                <div>
                  <Label className="font-sans text-xs">Children</Label>
                  <Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} className="mt-1 font-sans" />
                </div>
              </div>
              {nights > 0 && (
                <div className="bg-muted rounded-lg p-3 text-sm font-sans">
                  <div className="flex justify-between"><span className="text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} × RWF {Number(room.base_price).toLocaleString()}</span><span className="font-semibold text-foreground">RWF {(nights * Number(room.base_price)).toLocaleString()}</span></div>
                </div>
              )}
              <Button onClick={handleBook} disabled={booking || nights <= 0} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide py-5">
                {booking ? "Booking..." : nights > 0 ? `Book Now — RWF ${(nights * Number(room.base_price)).toLocaleString()}` : "Select Dates"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
