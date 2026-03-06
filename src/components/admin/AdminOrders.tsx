import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [waiterDialog, setWaiterDialog] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" });
  const [waiterName, setWaiterName] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    let q = supabase.from("orders")
      .select("*, order_items(*, product:products(name, department))")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  useEffect(() => {
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const handleStart = (orderId: string) => {
    setWaiterName("");
    setWaiterDialog({ open: true, orderId });
  };

  const confirmStart = async () => {
    if (!waiterName.trim()) { toast.error("Please enter waiter name"); return; }
    const { error } = await supabase.from("orders")
      .update({ status: "preparing", assigned_waiter: waiterName.trim() } as any)
      .eq("id", waiterDialog.orderId);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order started — assigned to ${waiterName.trim()}`);
      // Also update all order items to preparing
      await supabase.from("order_items").update({ status: "preparing" } as any).eq("order_id", waiterDialog.orderId);
      fetchOrders();
    }
    setWaiterDialog({ open: false, orderId: "" });
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order ${status}`);
      // Sync order items status
      if (status === "ready" || status === "delivered" || status === "cancelled") {
        await supabase.from("order_items").update({ status } as any).eq("order_id", id);
      }
      fetchOrders();
    }
  };

  const updatePayment = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Payment marked ${status}`); fetchOrders(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 font-sans"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="font-sans gap-1"><RefreshCw size={14} />Refresh</Button>
        <span className="text-sm text-muted-foreground font-sans ml-auto">{orders.length} orders</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground font-sans py-12">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-bold text-foreground text-sm">
                        {o.source_type === "room" ? "🏨 Room Service" : o.source_id === "online" ? "📱 Online Order" : `🪑 Table ${o.source_id}`}
                      </span>
                      {o.guest_name && (
                        <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-muted text-foreground">
                          👤 {o.guest_name} {o.guest_phone ? `· ${o.guest_phone}` : ""}
                        </span>
                      )}
                      <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize ${
                        o.status === "delivered" ? "bg-green-100 text-green-700" :
                        o.status === "cancelled" ? "bg-red-100 text-red-700" :
                        o.status === "preparing" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{o.status}</span>
                      <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize ${
                        o.payment_status === "paid" ? "bg-green-100 text-green-700" :
                        o.payment_status === "charged_to_room" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>{o.payment_status}</span>
                    </div>
                    {o.assigned_waiter && (
                      <p className="text-xs font-sans text-blue-600">🧑‍🍳 Waiter: {o.assigned_waiter}</p>
                    )}
                    <div className="text-xs text-muted-foreground font-sans">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                    <div className="space-y-1">
                      {(o.order_items || []).map((item: any) => (
                        <div key={item.id} className="text-sm font-sans text-foreground flex items-center gap-2">
                          <span>{item.department === "kitchen" ? "🍽️" : "🍺"}</span>
                          <span>{item.product?.name} × {item.quantity}</span>
                          <span className="text-muted-foreground">— {fmt(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[140px]">
                    <p className="text-lg font-bold font-sans text-primary">{fmt(Number(o.total))}</p>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {o.status === "pending" && (
                        <Button size="sm" className="text-xs font-sans" onClick={() => handleStart(o.id)}>Start</Button>
                      )}
                      {o.status === "preparing" && (
                        <Button size="sm" className="text-xs font-sans" onClick={() => updateOrderStatus(o.id, "ready")}>Ready</Button>
                      )}
                      {o.status === "ready" && (
                        <Button size="sm" className="text-xs font-sans" variant="outline" onClick={() => updateOrderStatus(o.id, "delivered")}>Delivered</Button>
                      )}
                      {o.payment_status === "unpaid" && (
                        <Button size="sm" className="text-xs font-sans" variant="secondary" onClick={() => updatePayment(o.id, "paid")}>Mark Paid</Button>
                      )}
                      {o.status !== "cancelled" && o.status !== "delivered" && (
                        <Button size="sm" className="text-xs font-sans" variant="destructive" onClick={() => updateOrderStatus(o.id, "cancelled")}>Cancel</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Waiter Dialog */}
      <Dialog open={waiterDialog.open} onOpenChange={(open) => setWaiterDialog({ ...waiterDialog, open })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Assign Waiter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-sans">Enter the waiter's name to assign this order:</p>
            <Input
              placeholder="e.g. Jean, Marie..."
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              className="font-sans"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmStart()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaiterDialog({ open: false, orderId: "" })} className="font-sans">Cancel</Button>
            <Button onClick={confirmStart} className="font-sans">Start Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
