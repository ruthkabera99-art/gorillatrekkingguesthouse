import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Printer, History, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrintableReceipt from "./PrintableReceipt";
import { format } from "date-fns";

const fmt = (n: number) => `RWF ${Math.round(n).toLocaleString()}`;
const getNights = (a: string, b: string) =>
  Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
const liveItems = (o: any) => (o.order_items || []).filter((i: any) => i.status !== "cancelled");
const orderSum = (o: any) => liveItems(o).reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
const fmtVal = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

type Txn = { id: string; date: string; kind: "Room" | "Order"; ref: string; who: string; amount: number; status: string; method: string };

const AdminInvoices = () => {
  const [view, setView] = useState<"invoices" | "transactions">("invoices");
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [invoiceOrders, setInvoiceOrders] = useState<any[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);

  const load = async () => {
    setLoading(true);
    const [b, o] = await Promise.all([
      supabase.from("bookings").select("*, rooms(name, type, base_price)")
        .in("status", ["confirmed", "checked_in", "completed"]).order("created_at", { ascending: false }).limit(500),
      supabase.from("orders").select("*, order_items(*, product:products(name, department))")
        .order("created_at", { ascending: false }).limit(500),
    ]);
    if (b.error) toast.error(b.error.message);
    if (o.error) toast.error(o.error.message);
    setBookings(b.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const ordersForBooking = (bk: any) =>
    orders.filter((o) => o.source_type === "room" && o.status !== "cancelled"
      && [bk.room_id, bk.rooms?.name].includes(o.source_id)
      && o.created_at.slice(0, 10) >= bk.check_in && o.created_at.slice(0, 10) <= bk.check_out);

  const openInvoice = (bk: any) => {
    setSelected(bk);
    setInvoiceLoading(true);
    setInvoiceOrders(ordersForBooking(bk));
    setInvoiceLoading(false);
  };

  const openHistory = async (ids: string[]) => {
    setHistory([]);
    const { data, error } = await (supabase as any).from("audit_log").select("*")
      .in("record_id", ids).order("created_at", { ascending: false }).limit(200);
    if (error) toast.error(error.message);
    setHistory(data || []);
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "completed" } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Guest checked out");
    setBookings((p) => p.map((b) => (b.id === id ? { ...b, status: "completed" } : b)));
  };

  const q = search.trim().toLowerCase();
  const filteredBookings = bookings.filter((b) => !q ||
    [b.guest_name, b.guest_phone, b.rooms?.name, b.invoice_number].some((v) => v?.toLowerCase().includes(q)));

  const txns: Txn[] = useMemo(() => {
    const t: Txn[] = [];
    bookings.forEach((b) => t.push({
      id: b.id, date: b.paid_at || b.created_at, kind: "Room", ref: b.invoice_number || b.id.slice(0, 8),
      who: b.guest_name || b.rooms?.name || "Guest", amount: Number(b.total_price),
      status: b.paid_at ? "paid" : b.status, method: b.payment_method || "—",
    }));
    orders.filter((o) => o.status !== "cancelled").forEach((o) => t.push({
      id: o.id, date: o.created_at, kind: "Order", ref: "#" + o.id.slice(0, 8).toUpperCase(),
      who: o.guest_name || (o.source_type === "room" ? "Room service" : `Table ${o.source_id}`),
      amount: orderSum(o), status: o.payment_status, method: o.payment_status === "charged_to_room" ? "room bill" : "—",
    }));
    return t.filter((x) => !q || [x.ref, x.who, x.status, x.method].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, orders, q]);

  const paidTotal = txns.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const openTotal = txns.filter((t) => !["paid", "charged_to_room", "cancelled"].includes(t.status)).reduce((s, t) => s + t.amount, 0);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">Invoices & Transactions</h2>
        <p className="text-sm text-muted-foreground">Room stays + food & bar on one bill, and a full record of every money movement.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant={view === "invoices" ? "default" : "outline"} onClick={() => setView("invoices")}>Invoices</Button>
        <Button size="sm" variant={view === "transactions" ? "default" : "outline"} onClick={() => setView("transactions")}>Transaction history</Button>
        <Input className="max-w-xs h-9" placeholder="Search guest, phone, room, invoice…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {view === "invoices" ? (
        filteredBookings.length === 0 ? <p className="text-center text-muted-foreground py-12">No bookings found.</p> : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const fb = ordersForBooking(b).reduce((s, o) => s + orderSum(o), 0);
              return (
                <Card key={b.id}><CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{b.rooms?.name || "Room"} <span className="text-xs font-mono text-muted-foreground">{b.invoice_number}</span></p>
                    <p className="text-sm text-foreground">{b.guest_name || "Registered guest"}{!b.user_id && " (walk-in)"}{b.guest_phone ? ` · ${b.guest_phone}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{b.check_in} → {b.check_out} ({getNights(b.check_in, b.check_out)} nights)</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-primary">{fmt(Number(b.total_price) + fb)}</p>
                    {fb > 0 && <p className="text-xs text-muted-foreground">incl. {fmt(fb)} food & bar</p>}
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Badge variant={b.status === "completed" ? "default" : "secondary"} className="capitalize">{b.status.replace("_", " ")}</Badge>
                      {b.payment_method && <Badge variant="outline" className="capitalize">{b.payment_method.replace("_", " ")}</Badge>}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openInvoice(b)}><FileText size={14} /> Invoice</Button>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => openHistory([b.id, ...ordersForBooking(b).map((o) => o.id)])}><History size={14} /> History</Button>
                      {b.status !== "completed" && <Button size="sm" onClick={() => markComplete(b.id)}>Check Out</Button>}
                    </div>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        )
      ) : (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Transactions</p><p className="text-lg font-bold">{txns.length}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Paid</p><p className="text-lg font-bold text-primary">{fmt(paidTotal)}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Still to collect</p><p className="text-lg font-bold">{fmt(openTotal)}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Date</th><th className="pr-3">Type</th><th className="pr-3">Ref</th><th className="pr-3">Guest / Source</th>
                <th className="pr-3">Method</th><th className="pr-3">Status</th><th className="pr-3 text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.kind + t.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{format(new Date(t.date), "dd MMM yyyy HH:mm")}</td>
                    <td className="pr-3"><Badge variant="outline">{t.kind}</Badge></td>
                    <td className="pr-3 font-mono text-xs">{t.ref}</td>
                    <td className="pr-3">{t.who}</td>
                    <td className="pr-3 capitalize">{t.method.replace("_", " ")}</td>
                    <td className="pr-3"><Badge variant={t.status === "paid" ? "default" : "secondary"} className="capitalize">{t.status.replace(/_/g, " ")}</Badge></td>
                    <td className="pr-3 text-right whitespace-nowrap font-semibold">{fmt(t.amount)}</td>
                    <td><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openHistory([t.id])}><History size={14} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txns.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions yet.</p>}
          </div>
        </CardContent></Card>
      )}

      {/* Invoice / receipt */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-serif">Invoice {selected?.invoice_number}</DialogTitle></DialogHeader>
          {invoiceLoading || !selected ? null : (
            <>
              <div className="rounded-md border border-border overflow-hidden">
                <PrintableReceipt
                  guestName={selected.guest_name || "Guest"}
                  roomName={selected.rooms?.name || "Room"}
                  roomType={selected.rooms?.type || ""}
                  checkIn={selected.check_in}
                  checkOut={selected.check_out}
                  adultsCount={selected.guests_adults}
                  childrenCount={selected.guests_children}
                  nightlyRate={Number(selected.rooms?.base_price || 0)}
                  accommodationTotal={Number(selected.total_price)}
                  invoiceNumber={selected.invoice_number}
                  paymentMethod={selected.payment_method}
                  paymentReference={selected.payment_reference}
                  items={invoiceOrders.flatMap((o) => liveItems(o).map((i: any) => ({
                    name: i.product?.name || "Item", qty: i.quantity, unitPrice: Number(i.unit_price),
                    department: (i.department || i.product?.department || "kitchen") as "kitchen" | "bar",
                  })))}
                />
              </div>
              <Button onClick={() => window.print()} className="w-full gap-2"><Printer size={16} /> Print Receipt</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={history !== null} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-serif">Movement history</DialogTitle></DialogHeader>
          {history?.length === 0 && <p className="text-sm text-muted-foreground">No changes recorded yet.</p>}
          <div className="space-y-2">
            {history?.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-2 text-sm">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{r.table_name.replace("_", " ")}</Badge>
                  <Badge variant={r.action === "DELETE" ? "destructive" : "secondary"}>{r.action === "INSERT" ? "created" : r.action === "UPDATE" ? "changed" : "deleted"}</Badge>
                  <span className="text-xs">by {r.actor_role || "system"}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(r.created_at), "dd MMM HH:mm")}</span>
                </div>
                {r.changed_fields?.map((f: string) => (
                  <div key={f} className="font-mono text-xs break-all mt-1">
                    {f}: <span className="line-through text-destructive">{fmtVal(r.old_data?.[f])}</span> → <span className="text-primary">{fmtVal(r.new_data?.[f])}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
