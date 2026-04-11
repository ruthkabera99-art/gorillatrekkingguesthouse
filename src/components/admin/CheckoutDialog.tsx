import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Printer, LogOut, Receipt, UtensilsCrossed, Wine, Banknote, CreditCard, Smartphone } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, differenceInDays } from "date-fns";
import PrintableReceipt from "./PrintableReceipt";

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
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentRef, setPaymentRef] = useState("");

  useEffect(() => {
    if (open && booking) {
      loadOrders();
      setShowReceipt(false);
      setPaymentMethod("cash");
      setPaymentRef("");
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

  const receiptItems = allItems.map(i => ({
    name: i.product?.name || "Item",
    qty: i.quantity,
    unitPrice: i.unit_price,
    department: (i.product?.department || "kitchen") as "kitchen" | "bar",
  }));

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    setCheckingOut(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        payment_method: paymentMethod,
        payment_reference: paymentRef || null,
        paid_at: new Date().toISOString(),
      } as any)
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

  const printReceipt = () => {
    setShowReceipt(true);
    setTimeout(() => window.print(), 300);
  };

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
          <div className="space-y-4">
            {/* On-screen summary */}
            <div className="text-center border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">GORILLA TREKKING GUEST HOUSE</h3>
              <p className="text-xs text-muted-foreground font-sans">Musanze, Rwanda · Final Invoice</p>
            </div>

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

            <div>
              <h4 className="font-sans font-bold text-sm text-foreground mb-2">🏨 Accommodation</h4>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">
                  {nights} night(s) × {fmt(Number(booking.rooms?.base_price || 0))}
                </span>
                <span className="font-semibold text-foreground">{fmt(accommodationTotal)}</span>
              </div>
            </div>

            {kitchenItems.length > 0 && (
              <div>
                <h4 className="font-sans font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed size={14} /> Kitchen / Room Service
                </h4>
                {kitchenItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-sans pl-2">
                    <span className="text-muted-foreground">{item.product?.name} × {item.quantity}</span>
                    <span className="text-foreground">{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-sans font-semibold border-t border-dashed border-border mt-1 pt-1 pl-2">
                  <span>Subtotal</span>
                  <span>{fmt(kitchenTotal)}</span>
                </div>
              </div>
            )}

            {barItems.length > 0 && (
              <div>
                <h4 className="font-sans font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Wine size={14} /> Bar / Drinks
                </h4>
                {barItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-sans pl-2">
                    <span className="text-muted-foreground">{item.product?.name} × {item.quantity}</span>
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

            {/* Payment Method Selection */}
            {booking.status !== "completed" && (
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-sm text-foreground">Payment Method</h4>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-2">
                  {[
                    { value: "cash", label: "Cash", icon: <Banknote size={16} /> },
                    { value: "card", label: "Card", icon: <CreditCard size={16} /> },
                    { value: "mobile_money", label: "MoMo", icon: <Smartphone size={16} /> },
                  ].map((m) => (
                    <Label
                      key={m.value}
                      htmlFor={`pay-${m.value}`}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-colors ${
                        paymentMethod === m.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <RadioGroupItem value={m.value} id={`pay-${m.value}`} className="sr-only" />
                      {m.icon}
                      <span className="text-xs font-sans font-medium">{m.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
                <Input
                  placeholder={
                    paymentMethod === "card" ? "Last 4 digits or auth code" :
                    paymentMethod === "mobile_money" ? "Transaction ID" :
                    "Receipt number (optional)"
                  }
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="font-sans text-sm"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={printReceipt} className="flex-1 font-sans gap-1.5">
                <Printer size={14} /> Print Receipt
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

      {/* Hidden printable receipt – only visible during print */}
      {showReceipt && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableReceipt
            guestName={guestName}
            roomName={booking.rooms?.name || "Room"}
            roomType={booking.rooms?.type || "standard"}
            checkIn={booking.check_in}
            checkOut={booking.check_out}
            adultsCount={booking.guests_adults}
            childrenCount={booking.guests_children}
            nightlyRate={Number(booking.rooms?.base_price || 0)}
            accommodationTotal={accommodationTotal}
            items={receiptItems}
            paymentMethod={paymentMethod}
            paymentReference={paymentRef}
          />
        </div>
      )}
    </Dialog>
  );
};

export default CheckoutDialog;
