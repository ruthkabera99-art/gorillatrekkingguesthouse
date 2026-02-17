import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const AdminInvoices = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceOrders, setInvoiceOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("bookings")
        .select("*, rooms(name, type, base_price)")
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });
      setBookings(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const loadInvoice = async (booking: any) => {
    // Get all room-charged orders for this room during the stay
    const { data: orders } = await supabase.from("orders")
      .select("*, order_items(*, product:products(name, department))")
      .eq("source_type", "room")
      .eq("source_id", booking.rooms?.name || "")
      .gte("created_at", booking.check_in)
      .lte("created_at", booking.check_out + "T23:59:59");
    setInvoiceOrders(orders || []);
    setSelectedInvoice(booking);
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "completed" } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Booking completed & checked out");
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "completed" } : b));
    }
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const roomChargesTotal = invoiceOrders.reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = selectedInvoice ? Number(selectedInvoice.total_price) + roomChargesTotal : 0;

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-lg font-semibold text-foreground">Room Invoices & Checkout</h2>
      <p className="text-sm text-muted-foreground font-sans">Generate combined invoices for room stays + food & bar charges.</p>

      {bookings.length === 0 ? (
        <p className="text-center text-muted-foreground font-sans py-12">No active bookings.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="bg-card border border-border">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="font-sans font-bold text-foreground">{b.rooms?.name || "Room"}</p>
                  <p className="text-sm text-muted-foreground font-sans">{b.check_in} → {b.check_out}</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {b.guests_adults} adults, {b.guests_children} children
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-lg font-bold font-sans text-primary">{fmt(Number(b.total_price))}</p>
                  <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize ${
                    b.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>{b.status}</span>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="font-sans gap-1" onClick={() => loadInvoice(b)}>
                          <FileText size={14} /> View Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle className="font-serif">Invoice — {b.rooms?.name}</DialogTitle>
                        </DialogHeader>
                        {selectedInvoice?.id === b.id && (
                          <div className="space-y-4 print:text-black" id="invoice-content">
                            <div className="text-center border-b border-border pb-4">
                              <h3 className="font-serif text-xl font-bold">GORILLA TREKKING GUEST HOUSE</h3>
                              <p className="text-xs text-muted-foreground font-sans">Musanze, Rwanda</p>
                            </div>
                            <div className="text-sm font-sans space-y-1">
                              <p><strong>Room:</strong> {b.rooms?.name} ({b.rooms?.type})</p>
                              <p><strong>Check-in:</strong> {b.check_in}</p>
                              <p><strong>Check-out:</strong> {b.check_out}</p>
                              <p><strong>Guests:</strong> {b.guests_adults} adults, {b.guests_children} children</p>
                            </div>

                            <div className="border-t border-border pt-3">
                              <h4 className="font-sans font-bold text-sm mb-2">Room Charges</h4>
                              <div className="flex justify-between text-sm font-sans">
                                <span>Accommodation</span>
                                <span>{fmt(Number(b.total_price))}</span>
                              </div>
                            </div>

                            {invoiceOrders.length > 0 && (
                              <div className="border-t border-border pt-3">
                                <h4 className="font-sans font-bold text-sm mb-2">Food & Bar Charges</h4>
                                {invoiceOrders.map((o) => (
                                  <div key={o.id} className="mb-2">
                                    {(o.order_items || []).map((item: any) => (
                                      <div key={item.id} className="flex justify-between text-sm font-sans">
                                        <span>{item.product?.department === "kitchen" ? "🍽️" : "🍺"} {item.product?.name} × {item.quantity}</span>
                                        <span>{fmt(item.unit_price * item.quantity)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-sans font-bold border-t border-dashed border-border pt-1 mt-1">
                                  <span>Subtotal (F&B)</span>
                                  <span>{fmt(roomChargesTotal)}</span>
                                </div>
                              </div>
                            )}

                            <div className="border-t-2 border-foreground pt-3 flex justify-between text-lg font-sans font-bold">
                              <span>GRAND TOTAL</span>
                              <span className="text-primary">{fmt(grandTotal)}</span>
                            </div>

                            <Button onClick={printInvoice} className="w-full font-sans gap-2 mt-2">
                              <Printer size={16} /> Print Invoice
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {b.status === "confirmed" && (
                      <Button size="sm" className="font-sans" onClick={() => markComplete(b.id)}>Check Out</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
