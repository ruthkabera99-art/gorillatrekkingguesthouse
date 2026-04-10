import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Printer, LogOut, Receipt, UtensilsCrossed, Wine } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

type BookingWithRoom = {
  id: string;
  user_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests_adults: number;
  guests_children: number;
  total_price: number;
  special_requests: string | null;
  status: string;
  created_at: string;
  rooms: { name: string; type: string; base_price: number; images: string[] | null } | null;
};

type Props = {
  booking: BookingWithRoom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckoutComplete: () => void;
  guestName: string;
};

type OrderWithItems = {
  id: string;
  total: number;
  created_at: string;
  status: string;
  payment_status: string;
  notes: string | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    status: string;
    product: { name: string; department: string } | null;
  }[];
};

const CheckoutDialog = ({ booking, open, onOpenChange, onCheckoutComplete, guestName }: Props) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (open && booking) {
      loadOrders();
    }
  }, [open, booking]);

  const loadOrders = async () => {
    if (!booking) return;
    setLoading(true);
    const roomName = booking.rooms?.name || "";

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name, department))")
      .eq("source_type", "room")
      .eq("source_id", roomName)
      .gte("created_at", `${booking.check_in}T00:00:00`)
      .lte("created_at", `${booking.check_out}T23:59:59`)
      .neq("status", "cancelled");

    setOrders((data as any) || []);
    setLoading(false);
  };

  if (!booking) return null;

  const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
  const accommodationTotal = Number(booking.total_price);

  // Separate kitchen and bar items
  const allItems = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => i.status !== "cancelled")
      .map(i => ({ ...i, orderDate: o.created_at }))
  );
  const kitchenItems = allItems.filter(i => i.product?.department === "kitchen");
  const barItems = allItems.filter(i => i.product?.department === "bar");

  const kitchenTotal = kitchenItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const barTotal = barItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const servicesTotal = kitchenTotal + barTotal;
  const grandTotal = accommodationTotal + servicesTotal;

  const handleCheckout = async () => {
    setCheckingOut(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" } as any)
      .eq("id", booking.id);

    if (error) {
      toast.error(error.message);
      setCheckingOut(false);
      return;
    }

    toast.success("Guest checked out successfully!", {
      description: `Final bill: ${fmt(grandTotal)}`,
    });
    setCheckingOut(false);
    onCheckoutComplete();
  };

  const printInvoice = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Receipt size={20} /> Checkout & Final Bill
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4" id="checkout-invoice">
            {/* Header */}
            <div className="text-center border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">GORILLA TREKKING GUEST HOUSE</h3>
              <p className="text-xs text-muted-foreground font-sans">Musanze, Rwanda · Final Invoice</p>
            </div>

            {/* Guest & Stay Info */}
            <div className="grid grid-cols-2 gap-2 text-sm font-sans">
              <div>
                <p className="text-muted-foreground text-xs">Guest</p>
                <p className="font-semibold text-foreground">{guestName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Room</p>
                <p className="font-semibold text-foreground">{booking.rooms?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Check-in</p>
                <p className="text-foreground">{format(new Date(booking.check_in), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Check-out</p>
                <p className="text-foreground">{format(new Date(booking.check_out), "MMM dd, yyyy")}</p>
              </div>
            </div>

            <Separator />

            {/* Accommodation */}
            <div>
              <h4 className="font-sans font-bold text-sm text-foreground mb-2">🏨 Accommodation</h4>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">
                  {nights} night(s) × {fmt(Number(booking.rooms?.base_price || 0))}
                </span>
                <span className="font-semibold text-foreground">{fmt(accommodationTotal)}</span>
              </div>
            </div>

            {/* Kitchen Services */}
            {kitchenItems.length > 0 && (
              <div>
                <h4 className="font-sans font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed size={14} /> Kitchen / Room Service
                </h4>
                {kitchenItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-sans pl-2">
                    <span className="text-muted-foreground">
                      {item.product?.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-sans font-semibold border-t border-dashed border-border mt-1 pt-1 pl-2">
                  <span>Subtotal</span>
                  <span>{fmt(kitchenTotal)}</span>
                </div>
              </div>
            )}

            {/* Bar Services */}
            {barItems.length > 0 && (
              <div>
                <h4 className="font-sans font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Wine size={14} /> Bar / Drinks
                </h4>
                {barItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-sans pl-2">
                    <span className="text-muted-foreground">
                      {item.product?.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-sans font-semibold border-t border-dashed border-border mt-1 pt-1 pl-2">
                  <span>Subtotal</span>
                  <span>{fmt(barTotal)}</span>
                </div>
              </div>
            )}

            {allItems.length === 0 && (
              <p className="text-sm text-muted-foreground font-sans italic text-center py-2">
                No food or bar services charged during this stay.
              </p>
            )}

            <Separator className="border-2" />

            {/* Summary */}
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex justify-between text-sm font-sans">
                  <span>Accommodation</span>
                  <span>{fmt(accommodationTotal)}</span>
                </div>
                {servicesTotal > 0 && (
                  <div className="flex justify-between text-sm font-sans">
                    <span>F&B Services ({allItems.length} items)</span>
                    <span>{fmt(servicesTotal)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-sans font-bold">
                  <span>GRAND TOTAL</span>
                  <span className="text-primary">{fmt(grandTotal)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={printInvoice} className="flex-1 font-sans gap-1.5">
                <Printer size={14} /> Print Bill
              </Button>
              {booking.status !== "completed" && (
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="flex-1 font-sans gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <LogOut size={14} /> {checkingOut ? "Processing..." : "Complete Checkout"}
                </Button>
              )}
            </div>

            {booking.status === "completed" && (
              <p className="text-center text-sm text-green-600 font-sans font-semibold">
                ✅ Guest has been checked out
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
