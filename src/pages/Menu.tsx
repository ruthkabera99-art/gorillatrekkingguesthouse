import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, UtensilsCrossed, Wine, Search, ArrowLeft, CheckCircle, Clock, ChefHat, Truck } from "lucide-react";
import { Link } from "react-router-dom";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  department: string;
  image_url: string | null;
  available: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
  note: string;
};

const categoryLabels: Record<string, string> = {
  appetizer: "Appetizers",
  main_course: "Main Courses",
  dessert: "Desserts",
  side: "Sides",
  soft_drink: "Soft Drinks",
  beer: "Beer",
  wine: "Wine",
  cocktail: "Cocktails",
  spirit: "Spirits",
  hot_beverage: "Hot Beverages",
};

const formatRWF = (amount: number) => `RWF ${amount.toLocaleString()}`;

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: "Order Received", color: "text-yellow-600" },
  preparing: { icon: ChefHat, label: "Being Prepared", color: "text-blue-600" },
  ready: { icon: CheckCircle, label: "Ready for Pickup/Delivery", color: "text-green-600" },
  delivered: { icon: Truck, label: "Delivered", color: "text-green-700" },
  cancelled: { icon: X, label: "Cancelled", color: "text-destructive" },
};

const Menu = () => {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table");
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "kitchen" | "bar">("all");
  const [search, setSearch] = useState("");
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [chargeToRoom, setChargeToRoom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  
  // Order tracking state
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("products").select("*").eq("available", true).order("category");
      setProducts((data as Product[]) || []);

      if (user) {
        const today = new Date().toISOString().split("T")[0];
        const { data: booking } = await supabase
          .from("bookings")
          .select("*, rooms(name)")
          .eq("user_id", user.id)
          .in("status", ["confirmed", "pending"])
          .lte("check_in", today)
          .gte("check_out", today)
          .maybeSingle();
        setActiveBooking(booking);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Realtime order tracking
  useEffect(() => {
    if (!placedOrder) return;
    const ch = supabase
      .channel(`order-${placedOrder.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${placedOrder.id}` }, (payload) => {
        setPlacedOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "order_items", filter: `order_id=eq.${placedOrder.id}` }, () => {
        fetchOrderItems(placedOrder.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [placedOrder?.id]);

  const fetchOrderItems = async (orderId: string) => {
    const { data } = await supabase.from("order_items").select("*, product:products(name, department)").eq("order_id", orderId);
    setOrderItems(data || []);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, note: "" }];
    });
    toast.success(`${product.name} added`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0)
    );
  };

  const updateItemNote = (productId: string, note: string) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, note } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const sourceType = activeBooking && chargeToRoom ? "room" : "table";
    const sourceId = activeBooking && chargeToRoom ? activeBooking.room_id : (tableNumber || "online");

    const { data: order, error } = await supabase.from("orders").insert({
      source_type: sourceType,
      source_id: sourceId,
      user_id: user?.id || null,
      total: cartTotal,
      payment_status: chargeToRoom ? "charged_to_room" : "unpaid",
      notes: orderNotes || null,
    } as any).select().single();

    if (error || !order) {
      toast.error("Failed to place order. Please try again.");
      setSubmitting(false);
      return;
    }

    const items = cart.map((i) => ({
      order_id: (order as any).id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.price,
      note: i.note || null,
      department: i.product.department,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items as any);
    if (itemsError) {
      toast.error("Order created but items failed. Contact staff.");
    } else {
      toast.success("Order placed successfully!");
      setPlacedOrder(order);
      setOrderItems(items.map((it, idx) => ({
        ...it,
        id: `temp-${idx}`,
        product: { name: cart[idx].product.name, department: cart[idx].product.department },
        status: "pending",
      })));
      setCart([]);
      setCartOpen(false);
      setOrderNotes("");
    }
    setSubmitting(false);
  };

  const filtered = products.filter((p) => {
    if (filter !== "all" && p.department !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Order confirmation/tracking view
  if (placedOrder) {
    const status = statusConfig[placedOrder.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="bg-card border border-border">
            <CardContent className="p-6 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <StatusIcon size={56} className={`mx-auto ${status.color}`} />
              </motion.div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Order Placed!</h2>
              <p className="text-muted-foreground font-sans text-sm">Your order has been sent to our kitchen & bar staff.</p>
              
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold capitalize ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Order Source</span>
                  <span className="font-medium text-foreground">
                    {placedOrder.source_type === "room" ? "🏨 Room Service" : tableNumber ? `🪑 Table ${tableNumber}` : "📱 Online Order"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium text-foreground capitalize">{placedOrder.payment_status?.replace("_", " ")}</span>
                </div>
              </div>

              <div className="text-left space-y-2">
                <h3 className="font-sans font-semibold text-sm text-foreground">Items</h3>
                {orderItems.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex justify-between text-sm font-sans">
                    <span className="text-foreground">{item.department === "kitchen" ? "🍽️" : "🍺"} {item.product?.name} × {item.quantity}</span>
                    <span className="text-muted-foreground">{formatRWF(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-sans border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatRWF(Number(placedOrder.total))}</span>
              </div>

              <p className="text-xs text-muted-foreground font-sans">This page updates in real-time as your order progresses.</p>

              <Button onClick={() => setPlacedOrder(null)} variant="outline" className="w-full font-sans">
                Order More
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">Menu</h1>
                <p className="text-xs text-muted-foreground font-sans">
                  {tableNumber ? `Table ${tableNumber}` : activeBooking ? `Room Service — ${activeBooking.rooms?.name}` : "Order Online — Gorilla Trekking Guest House"}
                </p>
              </div>
            </div>
            <button onClick={() => setCartOpen(true)} className="relative p-3 rounded-full bg-primary text-primary-foreground shadow-luxury">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-sans font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-3">
            {([["all", "All"], ["kitchen", "Food"], ["bar", "Drinks"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-sans transition-colors ${filter === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {val === "kitchen" && <UtensilsCrossed size={14} className="inline mr-1" />}
                {val === "bar" && <Wine size={14} className="inline mr-1" />}
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="pl-9 font-sans" />
          </div>
        </div>
      </div>

      {/* Menu items by category */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 space-y-3">
            <UtensilsCrossed size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground font-sans">No menu items available yet.</p>
            <p className="text-xs text-muted-foreground font-sans">Menu items are added by admin in the dashboard.</p>
          </div>
        )}
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-3">{categoryLabels[category] || category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <Card key={product.id} className="bg-card border border-border overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {product.department === "kitchen" ? <UtensilsCrossed size={22} className="text-primary" /> : <Wine size={22} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-semibold text-sm text-card-foreground truncate">{product.name}</h3>
                        {product.description && <p className="text-xs text-muted-foreground font-sans truncate">{product.description}</p>}
                        <p className="text-sm font-bold text-primary font-sans mt-0.5">{formatRWF(product.price)}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(product.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus size={14} /></button>
                          <span className="text-sm font-sans font-bold w-5 text-center">{inCart.quantity}</span>
                          <button onClick={() => updateQuantity(product.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-luxury">
                          <Plus size={18} />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-serif text-lg font-bold text-card-foreground">Your Order</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-muted"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground font-sans py-12">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-sans font-semibold text-sm text-foreground">{item.product.name}</h4>
                        <span className="font-sans font-bold text-sm text-primary">{formatRWF(item.product.price * item.quantity)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded-full bg-background flex items-center justify-center"><Minus size={12} /></button>
                        <span className="text-sm font-sans font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus size={12} /></button>
                      </div>
                      <Input
                        placeholder="Special instructions..."
                        value={item.note}
                        onChange={(e) => updateItemNote(item.product.id, e.target.value)}
                        className="text-xs h-8 font-sans"
                      />
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <Textarea
                    placeholder="Order notes..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="font-sans text-sm"
                    rows={2}
                  />

                  {activeBooking && (
                    <label className="flex items-center gap-2 text-sm font-sans text-foreground cursor-pointer">
                      <input type="checkbox" checked={chargeToRoom} onChange={(e) => setChargeToRoom(e.target.checked)} className="rounded border-border" />
                      Charge to Room ({activeBooking.rooms?.name})
                    </label>
                  )}

                  {!tableNumber && !activeBooking && (
                    <p className="text-xs text-muted-foreground font-sans bg-muted/50 rounded-lg p-2">
                      📱 Online order — pay at the restaurant when you arrive, or contact us for delivery.
                    </p>
                  )}

                  <div className="flex items-center justify-between font-sans">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">{formatRWF(cartTotal)}</span>
                  </div>

                  <Button onClick={submitOrder} disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans py-5">
                    {submitting ? "Placing Order..." : `Place Order — ${formatRWF(cartTotal)}`}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating cart button */}
      {cart.length > 0 && !cartOpen && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-6 py-3 shadow-luxury flex items-center gap-3 font-sans z-30"
        >
          <ShoppingCart size={18} />
          <span className="font-semibold">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
          <span className="font-bold">{formatRWF(cartTotal)}</span>
        </motion.button>
      )}
    </div>
  );
};

export default Menu;
