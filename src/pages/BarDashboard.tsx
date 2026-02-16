import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type OrderItem = {
  id: string;
  order_id: string;
  quantity: number;
  unit_price: number;
  note: string | null;
  status: string;
  department: string;
  product: { name: string; category: string } | null;
  order: { source_type: string; source_id: string; created_at: string } | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
};

const BarDashboard = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("order_items")
      .select("*, product:products(name, category), order:orders(source_type, source_id, created_at)")
      .eq("department", "bar")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    const channel = supabase.channel("bar-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: "department=eq.bar" }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("order_items").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Status updated to ${status}`);
      fetchItems();
    }
  };

  const timeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-full border border-border hover:bg-muted"><ArrowLeft size={18} /></Link>
          <Wine size={24} className="text-primary" />
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Bar Dashboard</h1>
            <p className="text-xs text-muted-foreground font-sans">{items.length} active items</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans py-12">No active drink orders right now 🍺</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="bg-card border border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-sans px-2 py-1 rounded-full capitalize ${statusColors[item.status]}`}>{item.status}</span>
                    <span className="text-xs text-muted-foreground font-sans flex items-center gap-1"><Clock size={12} />{item.order ? timeAgo(item.order.created_at) : ""}</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-foreground">{item.product?.name} × {item.quantity}</h3>
                    {item.note && <p className="text-xs text-muted-foreground font-sans italic mt-1">Note: {item.note}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    {item.order?.source_type === "room" ? "🏨 Room" : "🪑 Table"} — {item.order?.source_id}
                  </p>
                  <div className="flex gap-2">
                    {item.status === "pending" && (
                      <Button size="sm" onClick={() => updateStatus(item.id, "preparing")} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-sans">Start Preparing</Button>
                    )}
                    {item.status === "preparing" && (
                      <Button size="sm" onClick={() => updateStatus(item.id, "ready")} className="flex-1 bg-green-600 text-white hover:bg-green-700 font-sans">Mark Ready</Button>
                    )}
                    {item.status === "ready" && (
                      <Button size="sm" onClick={() => updateStatus(item.id, "delivered")} className="flex-1 font-sans" variant="outline">Mark Delivered</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarDashboard;
