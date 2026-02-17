import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, ShoppingCart, Users, DollarSign } from "lucide-react";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AdminOverview = () => {
  const [stats, setStats] = useState({ rooms: 0, orders: 0, bookings: 0, revenue: 0, todayOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [rooms, orders, bookings, todayOrd, recent] = await Promise.all([
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total", { count: "exact" }),
        supabase.from("bookings").select("id, total_price", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("orders").select("*, order_items(*, product:products(name))").order("created_at", { ascending: false }).limit(5),
      ]);
      const orderRevenue = (orders.data || []).reduce((s, o) => s + Number(o.total), 0);
      const bookingRevenue = (bookings.data || []).reduce((s, b) => s + Number(b.total_price), 0);
      setStats({
        rooms: rooms.count || 0,
        orders: orders.count || 0,
        bookings: bookings.count || 0,
        revenue: orderRevenue + bookingRevenue,
        todayOrders: todayOrd.count || 0,
      });
      setRecentOrders(recent.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: "Total Rooms", value: stats.rooms, icon: BedDouble, color: "text-blue-500" },
    { label: "Total Bookings", value: stats.bookings, icon: Users, color: "text-green-500" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingCart, color: "text-orange-500" },
    { label: "Revenue", value: fmt(stats.revenue), icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                <c.icon size={20} className={c.color} />
              </div>
              <div>
                <p className="text-xl font-bold font-sans text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground font-sans">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border border-border">
        <CardHeader><CardTitle className="font-serif text-lg">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-sans font-medium text-foreground">
                      {o.source_type === "room" ? "🏨" : "🪑"} {o.source_type} — {o.source_id}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {(o.order_items || []).map((i: any) => i.product?.name).filter(Boolean).join(", ") || "No items"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-sans text-foreground">{fmt(Number(o.total))}</p>
                    <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize ${
                      o.status === "delivered" ? "bg-green-100 text-green-700" :
                      o.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
