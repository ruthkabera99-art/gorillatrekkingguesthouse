import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RefreshCw, Printer, Receipt, History, Plus, Minus } from "lucide-react";
import { useStaffRole } from "@/hooks/useStaffRole";
import { useAuth } from "@/contexts/AuthContext";
import { printOrder } from "@/lib/printOrder";
import OrderStepper from "./OrderStepper";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [waiterDialog, setWaiterDialog] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" });
  const [waiterName, setWaiterName] = useState("");
  const [history, setHistory] = useState<{ open: boolean; title: string; rows: any[] }>({ open: false, title: "", rows: [] });

  const { role } = useStaffRole();
  const { user } = useAuth();
  const isWaiter = role === "waiter";
  const [myName, setMyName] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [menu, setMenu] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [draft, setDraft] = useState<{ table: string; guest: string; notes: string; qty: Record<string, number> }>({ table: "", guest: "", notes: "", qty: {} });
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => setMyName(data?.full_name || user.email?.split("@")[0] || "Waiter"));
  }, [user]);

  const openNew = async () => {
    setDraft({ table: "", guest: "", notes: "", qty: {} });
    setNewOpen(true);
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("products").select("*").eq("available", true).order("category"),
      supabase.from("restaurant_tables").select("id, table_number").order("table_number"),
    ]);
    setMenu(p || []); setTables(t || []);
  };

  const setQty = (prod: any, d: number) => setDraft((x) => {
    const max = prod.stock > 0 ? prod.stock : 50;
    const n = Math.max(0, Math.min((x.qty[prod.id] || 0) + d, max));
    return { ...x, qty: { ...x.qty, [prod.id]: n } };
  });
  const draftItems = menu.filter((p) => (draft.qty[p.id] || 0) > 0);
  const draftTotal = draftItems.reduce((s, p) => s + p.price * draft.qty[p.id], 0);

  const placeOrder = async () => {
    if (!draft.table) { toast.error("Choose a table"); return; }
    if (draftItems.length === 0) { toast.error("Add at least one item"); return; }
    setPlacing(true);
    const { data: order, error } = await supabase.from("orders").insert({
      source_type: "table", source_id: draft.table, guest_name: draft.guest.trim() || null,
      notes: draft.notes.trim() || null, payment_status: "unpaid", user_id: null,
    } as any).select().single();
    if (error || !order) { setPlacing(false); toast.error(error?.message || "Couldn't create order"); return; }
    const { error: iErr } = await supabase.from("order_items").insert(draftItems.map((p) => ({
      order_id: order.id, product_id: p.id, quantity: draft.qty[p.id], unit_price: p.price, department: p.department,
    })) as any);
    if (iErr) { toast.error(iErr.message); await supabase.from("orders").update({ status: "cancelled" } as any).eq("id", order.id); }
    else {
      if (!isWaiter) await supabase.from("orders").update({ assigned_waiter: myName, assigned_waiter_id: user?.id } as any).eq("id", order.id);
      else await supabase.from("orders").update({ assigned_waiter: myName } as any).eq("id", order.id);
      toast.success(`Order placed for Table ${draft.table}`);
      setNewOpen(false); fetchOrders();
    }
    setPlacing(false);
  };

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
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const handleStart = (orderId: string) => {
    if (isWaiter) { startWith(orderId, myName); return; }
    setWaiterName("");
    setWaiterDialog({ open: true, orderId });
  };

  const startWith = async (orderId: string, name: string) => {
    const { error } = await supabase.from("orders")
      .update({ status: "preparing", assigned_waiter: name } as any)
      .eq("id", orderId);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order started — assigned to ${name}`);
      await supabase.from("order_items").update({ status: "preparing" } as any).eq("order_id", orderId).neq("status", "cancelled");
      fetchOrders();
    }
  };

  const confirmStart = async () => {
    if (!waiterName.trim()) { toast.error("Please enter waiter name"); return; }
    await startWith(waiterDialog.orderId, waiterName.trim());
    setWaiterDialog({ open: false, orderId: "" });
  };

  const updateOrderStatus = async (id: string, status: string) => {
    if (status === "cancelled" && !confirm("Cancel this order? Stock will be restored.")) return;
    const { error } = await supabase.from("orders").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Order ${status}`);
      // Sync item statuses, but never revive items that were already cancelled
      if (status === "ready" || status === "delivered" || status === "cancelled") {
        await supabase.from("order_items").update({ status } as any).eq("order_id", id).neq("status", "cancelled");
      }
      fetchOrders();
    }
  };

  const updatePayment = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Payment marked ${status}`); fetchOrders(); }
  };

  const doPrint = (o: any, kind: "order" | "bill") => {
    if (!printOrder(o, kind)) toast.error("Please allow pop-ups to print");
  };

  const openHistory = async (o: any) => {
    setHistory({ open: true, title: `#${o.id.slice(0, 8).toUpperCase()}`, rows: [] });
    const ids = [o.id, ...(o.order_items || []).map((i: any) => i.id)];
    const { data } = await (supabase as any).from("audit_log").select("*")
      .in("record_id", ids).order("created_at", { ascending: true });
    setHistory({ open: true, title: `#${o.id.slice(0, 8).toUpperCase()}`, rows: data || [] });
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
        <Button size="sm" onClick={openNew} className="font-sans gap-1"><Plus size={14} />New order</Button>
        {isWaiter && <span className="text-xs text-muted-foreground font-sans">Showing new orders and orders you took</span>}
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
                    <OrderStepper order={o} />
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
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Button size="sm" variant="outline" className="text-xs font-sans gap-1" onClick={() => doPrint(o, "order")}><Printer size={12} />Order</Button>
                      <Button size="sm" variant="outline" className="text-xs font-sans gap-1" onClick={() => doPrint(o, "bill")}><Receipt size={12} />Bill</Button>
                      <Button size="sm" variant="ghost" className="text-xs font-sans gap-1" onClick={() => openHistory(o)}><History size={12} />History</Button>
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

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">New order</DialogTitle></DialogHeader>
          <div className="space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-2">
              <Select value={draft.table} onValueChange={(v) => setDraft({ ...draft, table: v })}>
                <SelectTrigger><SelectValue placeholder="Table" /></SelectTrigger>
                <SelectContent>{tables.map((t) => <SelectItem key={t.id} value={String(t.table_number)}>Table {t.table_number}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Guest name (optional)" value={draft.guest} onChange={(e) => setDraft({ ...draft, guest: e.target.value })} />
            </div>
            <div className="divide-y divide-border border border-border rounded-md max-h-72 overflow-y-auto">
              {menu.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 text-sm">
                  <span>{p.department === "kitchen" ? "🍽️" : "🍺"}</span>
                  <span className="flex-1">{p.name}<span className="text-muted-foreground"> · {fmt(Number(p.price))}</span></span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p, -1)} aria-label={`Less ${p.name}`}><Minus size={12} /></Button>
                  <span className="w-6 text-center">{draft.qty[p.id] || 0}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p, 1)} aria-label={`More ${p.name}`}><Plus size={12} /></Button>
                </div>
              ))}
            </div>
            <Input placeholder="Notes for kitchen/bar (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <p className="text-right font-bold text-primary">{fmt(draftTotal)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={placeOrder} disabled={placing}>Place order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={history.open} onOpenChange={(open) => setHistory({ ...history, open })}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Order history {history.title}</DialogTitle></DialogHeader>
          {history.rows.length === 0 ? <p className="text-sm text-muted-foreground font-sans">No recorded changes yet.</p> : (
            <ol className="space-y-2 text-sm font-sans">
              {history.rows.map((r: any) => (
                <li key={r.id} className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{r.table_name === "orders" ? "Order" : "Item"} {r.action.toLowerCase()} · <span className="capitalize">{r.actor_role || "system"}</span>{r.new_data?.assigned_waiter && r.actor_role === "waiter" ? ` (${r.new_data.assigned_waiter})` : ""}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  {r.action === "UPDATE" && (r.changed_fields || []).map((f: string) => (
                    <p key={f} className="text-xs">{({status:"Step",payment_status:"Payment",assigned_waiter:"Waiter",total:"Total"} as any)[f] || f}: {String(r.old_data?.[f] ?? "—")} → <strong>{String(r.new_data?.[f] ?? "—")}</strong>{r.table_name === "order_items" && r.new_data?.department ? ` (${r.new_data.department})` : ""}</p>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
