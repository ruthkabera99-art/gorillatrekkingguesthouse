import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, LogOut, Calendar, User, UtensilsCrossed, ChefHat, Wine } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const [{ data: bookingsData }, { data: profileData }] = await Promise.all([
        supabase.from("bookings").select("*, rooms(name, type, images)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setBookings(bookingsData || []);
      setProfile(profileData);
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card border border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{bookings.length}</p><p className="text-xs text-muted-foreground font-sans">Total Bookings</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><User size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{profile?.loyalty_points || 0}</p><p className="text-xs text-muted-foreground font-sans">Loyalty Points</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar size={20} className="text-primary" /></div>
              <div><p className="text-2xl font-bold font-sans text-foreground">{bookings.filter(b => b.status === 'confirmed').length}</p><p className="text-xs text-muted-foreground font-sans">Active Stays</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link to="/menu">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans gap-2">
              <UtensilsCrossed size={16} /> Order Food & Drinks
            </Button>
          </Link>
          <Link to="/kitchen">
            <Button variant="outline" className="font-sans gap-2">
              <ChefHat size={16} /> Kitchen
            </Button>
          </Link>
          <Link to="/bar">
            <Button variant="outline" className="font-sans gap-2">
              <Wine size={16} /> Bar
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
          <div className="space-y-4">
            {bookings.map((b) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-card border border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                    <img src={b.rooms?.images?.[0] || "/placeholder.svg"} alt={b.rooms?.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-foreground">{b.rooms?.name || "Room"}</h3>
                      <p className="text-sm text-muted-foreground font-sans">{b.check_in} → {b.check_out}</p>
                      <p className="text-xs text-muted-foreground font-sans">{b.guests_adults} adults, {b.guests_children} children</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary font-sans">RWF {Number(b.total_price).toLocaleString()}</p>
                      <span className={`text-xs font-sans px-2 py-1 rounded-full capitalize ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{b.status}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
