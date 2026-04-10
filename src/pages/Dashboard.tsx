import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, LogOut, Calendar, User, UtensilsCrossed, ChefHat, Wine, Shield,
  BedDouble, Phone, Sparkles, Clock, ConciergeBell, Wifi, ShowerHead, Car
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const extraServices = [
  { icon: UtensilsCrossed, label: "Room Service", desc: "Order food & drinks to your room", link: "/menu?source=room" },
  { icon: ShowerHead, label: "Extra Towels", desc: "Request fresh towels", action: "extra_towels" },
  { icon: Sparkles, label: "Room Cleaning", desc: "Request housekeeping", action: "room_cleaning" },
  { icon: Car, label: "Airport Transfer", desc: "Book a ride to/from the airport", action: "airport_transfer" },
  { icon: Wifi, label: "Wi-Fi Help", desc: "Get connection assistance", action: "wifi_help" },
  { icon: ConciergeBell, label: "Concierge", desc: "Ask us anything", action: "concierge" },
];

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStay, setActiveStay] = useState<any>(null);
  const [requestingService, setRequestingService] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [{ data: bookingsData }, { data: profileData }, { data: activeBooking }] = await Promise.all([
        supabase.from("bookings").select("*, rooms(name, type, images)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookings").select("*, rooms(name, type, images, id)")
          .eq("user_id", user.id)
          .in("status", ["confirmed", "pending", "checked_in"])
          .lte("check_in", today)
          .gte("check_out", today)
          .maybeSingle(),
      ]);
      setBookings(bookingsData || []);
      setProfile(profileData);
      setActiveStay(activeBooking);
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleServiceRequest = async (action: string, label: string) => {
    if (!activeStay || !user) return;
    setRequestingService(action);
    
    // Create an order with source_type=room for service requests
    const { error } = await supabase.from("orders").insert({
      source_type: "room" as const,
      source_id: activeStay.room_id,
      user_id: user.id,
      total: 0,
      notes: `Service Request: ${label}`,
      guest_name: profile?.full_name || user.email,
      guest_phone: profile?.phone || null,
    });
    
    if (error) {
      toast.error("Failed to submit request. Please try again.");
    } else {
      toast.success(`${label} request sent! Our staff will assist you shortly.`);
    }
    setRequestingService(null);
  };

  const getDaysRemaining = () => {
    if (!activeStay) return 0;
    const checkout = new Date(activeStay.check_out);
    const today = new Date();
    return Math.max(0, Math.ceil((checkout.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">My Dashboard</h1>
              <p className="text-sm text-muted-foreground font-sans">Welcome, {profile?.full_name || user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="font-sans gap-2">
            <LogOut size={16} /> Sign Out
          </Button>
        </div>

        {/* Active Stay Banner */}
        {activeStay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={activeStay.rooms?.images?.[0] || "/placeholder.svg"}
                        alt={activeStay.rooms?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-sans font-medium">
                          <BedDouble size={12} /> Currently Checked In
                        </span>
                      </div>
                      <h2 className="font-serif text-lg font-bold text-foreground mt-1">{activeStay.rooms?.name}</h2>
                      <p className="text-xs text-muted-foreground font-sans">
                        {activeStay.check_in} → {activeStay.check_out} · {getDaysRemaining()} night{getDaysRemaining() !== 1 ? "s" : ""} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link to="/menu?source=room">
                      <Button className="gap-2 font-sans shadow-lg shadow-primary/20">
                        <UtensilsCrossed size={16} /> Order Room Service
                      </Button>
                    </Link>
                    <Link to={`/rooms/${activeStay.rooms?.id}`}>
                      <Button variant="outline" className="gap-2 font-sans">
                        <BedDouble size={16} /> Room Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extra Services Grid */}
            <div className="mt-4">
              <h3 className="font-serif text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <ConciergeBell size={16} className="text-primary" /> Need Something?
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {extraServices.map((svc) => {
                  const Icon = svc.icon;
                  const isLink = !!svc.link;
                  const isLoading = requestingService === svc.action;

                  if (isLink) {
                    return (
                      <Link key={svc.label} to={svc.link!}>
                        <Card className="h-full bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                          <CardContent className="p-3 text-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                              <Icon size={18} className="text-primary" />
                            </div>
                            <p className="text-xs font-sans font-semibold text-foreground leading-tight">{svc.label}</p>
                            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 line-clamp-1">{svc.desc}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  }

                  return (
                    <Card
                      key={svc.label}
                      onClick={() => !isLoading && handleServiceRequest(svc.action!, svc.label)}
                      className={`h-full bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon size={18} className="text-primary" />
                          )}
                        </div>
                        <p className="text-xs font-sans font-semibold text-foreground leading-tight">{svc.label}</p>
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5 line-clamp-1">{svc.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{bookings.length}</p><p className="text-xs text-muted-foreground font-sans">Total Bookings</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><User size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{profile?.loyalty_points || 0}</p><p className="text-xs text-muted-foreground font-sans">Loyalty Points</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length}</p><p className="text-xs text-muted-foreground font-sans">Active Stays</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions (when no active stay) */}
        {!activeStay && (
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/menu">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans gap-2">
                <UtensilsCrossed size={16} /> Order Food & Drinks
              </Button>
            </Link>
            <Link to="/rooms">
              <Button variant="outline" className="font-sans gap-2">
                <BedDouble size={16} /> Browse Rooms
              </Button>
            </Link>
          </div>
        )}

        {/* Staff Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link to="/kitchen">
            <Button variant="outline" size="sm" className="font-sans gap-2">
              <ChefHat size={14} /> Kitchen
            </Button>
          </Link>
          <Link to="/bar">
            <Button variant="outline" size="sm" className="font-sans gap-2">
              <Wine size={14} /> Bar
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="font-sans gap-2">
              <Shield size={14} /> Admin
            </Button>
          </Link>
        </div>

        {/* Bookings */}
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">My Bookings</h2>
        {bookings.length === 0 ? (
          <Card className="bg-card border border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground font-sans mb-4">No bookings yet.</p>
              <Button onClick={() => navigate("/rooms")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans">Browse Rooms</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const isActive = activeStay?.id === b.id;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`bg-card border hover:shadow-lg transition-shadow ${isActive ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
                    <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
                      <img src={b.rooms?.images?.[0] || "/placeholder.svg"} alt={b.rooms?.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif font-semibold text-foreground">{b.rooms?.name || "Room"}</h3>
                          {isActive && (
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-sans font-medium">
                              Active Stay
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-sans">{b.check_in} → {b.check_out}</p>
                        <p className="text-xs text-muted-foreground font-sans">{b.guests_adults} adults, {b.guests_children} children</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-lg font-bold text-primary font-sans">RWF {Number(b.total_price).toLocaleString()}</p>
                        <span className={`text-xs font-sans px-2 py-1 rounded-full capitalize ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          b.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          b.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>{b.status === 'checked_in' ? 'Checked In' : b.status}</span>
                        {isActive && (
                          <Link to="/menu?source=room">
                            <Button size="sm" variant="outline" className="text-xs font-sans gap-1 h-7">
                              <UtensilsCrossed size={12} /> Order
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
