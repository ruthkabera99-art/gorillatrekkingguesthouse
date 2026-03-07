import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingCart, Plus, Minus, X, UtensilsCrossed, Wine,
  Search, ArrowLeft, CheckCircle, Clock, ChefHat, Truck, User, ClipboardList
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = {
  id: string; name: string; description: string | null; price: number;
  category: string; department: string; image_url: string | null; available: boolean;
};
type CartItem = { product: Product; quantity: number; note: string; };
type GuestInfo = { name: string; phone: string; table?: string };

const categoryLabels: Record<string, string> = {
  appetizer: "Appetizers", main_course: "Main Courses", dessert: "Desserts",
  side: "Sides", soft_drink: "Soft Drinks", beer: "Beer", wine: "Wine",
  cocktail: "Cocktails", spirit: "Spirits", hot_beverage: "Hot Beverages",
};

const formatRWF = (amount: number) => `RWF ${amount.toLocaleString()}`;

const statusConfig: Record<string, { icon: any; label: string; color: string; message: string }> = {
  pending: { icon: Clock, label: "Order Received", color: "text-yellow-600", message: "Your order has been received and is waiting to be processed." },
  preparing: { icon: ChefHat, label: "Being Prepared", color: "text-blue-600", message: "Your order has been assigned to a waiter and is being prepared!" },
  ready: { icon: Truck, label: "Coming Soon!", color: "text-green-600", message: "Your order is ready and on its way to you! 🚀" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-green-700", message: "Your order has been delivered. Enjoy! 🎉" },
  cancelled: { icon: X, label: "Cancelled", color: "text-destructive", message: "This order has been cancelled." },
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
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [tables, setTables] = useState<{ id: string; table_number: number }[]>([]);

  // Guest login state
  const [guest, setGuest] = useState<GuestInfo | null>(() => {
    const saved = sessionStorage.getItem("guest_info");
    return saved ? JSON.parse(saved) : null;
  });
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", table: "" });

  const saveGuest = () => {
    const name = guestForm.name.trim();
    const phone = guestForm.phone.trim();
    if (!name || name.length < 2) { toast.error("Please enter your name"); return; }
    if (!phone || phone.length < 6) { toast.error("Please enter a valid phone number"); return; }
    const info: GuestInfo = { name, phone, table: guestForm.table || undefined };
    sessionStorage.setItem("guest_info", JSON.stringify(info));
    setGuest(info);
    toast.success(`Welcome, ${name}!`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: tbls }] = await Promise.all([
        supabase.from("products").select("*").eq("available", true).order("category"),
        supabase.from("restaurant_tables").select("id, table_number").order("table_number"),
      ]);
      setProducts((prods as Product[]) || []);
      setTables((tbls as any) || []);
      if (user) {
        const today = new Date().toISOString().split("T")[0];
        const { data: booking } = await supabase
          .from("bookings").select("*, rooms(name)")
          .eq("user_id", user.id).in("status", ["confirmed", "pending"])
          .lte("check_in", today).gte("check_out", today).maybeSingle();
        setActiveBooking(booking);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Realtime tracking for placed order
  useEffect(() => {
    if (!placedOrder) return;
    const ch = supabase.channel(`order-${placedOrder.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${placedOrder.id}` }, (payload) => {
        setPlacedOrder((prev: any) => ({ ...prev, ...payload.new }));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [placedOrder?.id]);

  // Realtime tracking for tracked orders
  useEffect(() => {
    if (trackedOrders.length === 0) return;
    const ids = trackedOrders.map(o => o.id);
    const ch = supabase.channel("tracked-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if (ids.includes((payload.new as any).id)) {
          setTrackedOrders(prev => prev.map(o => o.id === (payload.new as any).id ? { ...o, ...payload.new } : o));
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [trackedOrders.map(o => o.id).join(",")]);

  const fetchMyOrders = async () => {
    const phone = guest?.phone;
    if (!phone && !user) return;
    setTrackingLoading(true);
    let q = supabase.from("orders")
      .select("*, order_items(*, product:products(name, department))")
      .order("created_at", { ascending: false })
      .limit(10);
    if (user) {
      q = q.eq("user_id", user.id);
    } else if (phone) {
      q = q.eq("guest_phone", phone);
    }
    const { data } = await q;
    setTrackedOrders(data || []);
    setTrackingLoading(false);
    setTrackingOpen(true);
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
    if (!user && !guest) { toast.error("Please enter your details first"); return; }
    setSubmitting(true);

    const guestTable = guest?.table || tableNumber;
    const sourceType = activeBooking && chargeToRoom ? "room" : "table";
    const sourceId = activeBooking && chargeToRoom ? activeBooking.room_id : (guestTable || "online");

    const { data: order, error } = await supabase.from("orders").insert({
      source_type: sourceType,
      source_id: sourceId,
      user_id: user?.id || null,
      total: cartTotal,
      payment_status: chargeToRoom ? "charged_to_room" : "unpaid",
      notes: orderNotes || null,
      guest_name: guest?.name || null,
      guest_phone: guest?.phone || null,
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
        ...it, id: `temp-${idx}`,
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
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Guest login screen (only for non-authenticated users without guest session)
  if (!user && !guest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <Card className="bg-card border border-border">
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <UtensilsCrossed size={28} className="text-primary" />
                </div>
                <h2 className="font-serif text-xl font-bold text-foreground">Welcome!</h2>
                <p className="text-sm text-muted-foreground font-sans">
                  {tableNumber ? `Table ${tableNumber} — ` : ""}Enter your details to start ordering
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-sans font-medium text-foreground">Your Name</label>
                  <Input
                    placeholder="e.g. Jean Pierre"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                    className="font-sans mt-1"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-sans font-medium text-foreground">Phone Number</label>
                  <Input
                    placeholder="e.g. 0788123456"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="font-sans mt-1"
                    type="tel"
                    maxLength={20}
                  />
                </div>
                {!tableNumber && tables.length > 0 && (
                  <div>
                    <label className="text-sm font-sans font-medium text-foreground">Table (optional)</label>
                    <Select value={guestForm.table} onValueChange={(v) => setGuestForm({ ...guestForm, table: v })}>
                      <SelectTrigger className="font-sans mt-1"><SelectValue placeholder="Select a table..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">No table (takeaway/online)</SelectItem>
                        {tables.map((t) => (
                          <SelectItem key={t.id} value={String(t.table_number)}>Table {t.table_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={saveGuest} className="w-full font-sans py-5 text-base">
                  Start Ordering 🍽️
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground font-sans">No account needed. Quick & easy!</p>
                <Link to="/auth" className="text-xs text-primary font-sans hover:underline mt-1 inline-block">
                  Hotel guest? Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <p className="text-muted-foreground font-sans text-sm">
                {guest ? `Thank you, ${guest.name}!` : "Thank you!"}{" "}
                {placedOrder.assigned_waiter
                  ? `Your order has been sent to ${placedOrder.assigned_waiter} who will deliver it to you.`
                  : status.message}
              </p>

              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold capitalize ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium text-foreground">
                    {placedOrder.source_type === "room" ? "🏨 Room Service" : tableNumber ? `🪑 Table ${tableNumber}` : "📱 Online"}
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

              <p className="text-xs text-muted-foreground font-sans">This page updates in real-time.</p>
              <Button onClick={() => setPlacedOrder(null)} variant="outline" className="w-full font-sans">Order More</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-secondary via-secondary to-[hsl(var(--navy-light))] text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary blur-2xl" />
        </div>
        <div className="container mx-auto px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="p-2.5 rounded-full glass hover:bg-white/20 transition-all">
              <ArrowLeft size={18} className="text-secondary-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <button onClick={fetchMyOrders} className="p-2.5 rounded-full glass hover:bg-white/20 transition-all" title="Track My Order">
                <ClipboardList size={18} className="text-secondary-foreground" />
              </button>
              <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-full bg-primary text-primary-foreground shadow-luxury hover:scale-105 transition-transform">
                <ShoppingCart size={18} />
                {cart.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-sans font-bold ring-2 ring-secondary">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </motion.span>
                )}
              </button>
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <p className="text-primary text-xs font-sans tracking-[0.3em] uppercase">Gorilla Trekking Guest House</p>
              <h1 className="font-serif text-3xl font-bold mt-1 text-secondary-foreground">Our Menu</h1>
            </motion.div>
            <p className="text-sm font-sans text-secondary-foreground/70">
              {tableNumber ? `Table ${tableNumber}` : activeBooking ? `Room Service — ${activeBooking.rooms?.name}` : "Order Online"}{" "}
              {guest && <span>· Welcome, {guest.name} ✨</span>}
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex justify-center gap-2 mb-4">
            {([["all", "All", null], ["kitchen", "Food", UtensilsCrossed], ["bar", "Drinks", Wine]] as const).map(([val, label, Icon]) => (
              <motion.button key={val} whileTap={{ scale: 0.95 }} onClick={() => setFilter(val as any)}
                className={`px-5 py-2 rounded-full text-sm font-sans font-medium transition-all flex items-center gap-1.5 ${
                  filter === val 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : "glass text-secondary-foreground/80 hover:bg-white/20"
                }`}>
                {Icon && <Icon size={14} />}
                {label}
              </motion.button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground/50" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search our menu..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass text-secondary-foreground placeholder:text-secondary-foreground/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 0 480 0 720 20C960 40 1200 40 1440 20V40H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      {/* Menu items */}
      <div className="container mx-auto px-4 py-6 space-y-10">
        {Object.keys(grouped).length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <UtensilsCrossed size={36} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-sans text-lg">No menu items available yet.</p>
          </motion.div>
        )}
        {Object.entries(grouped).map(([category, items], catIdx) => (
          <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.08 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-base">{
                  category.includes("appetizer") ? "🥗" :
                  category.includes("main") ? "🍽️" :
                  category.includes("dessert") ? "🍰" :
                  category.includes("side") ? "🥘" :
                  category.includes("soft") ? "🥤" :
                  category.includes("beer") ? "🍺" :
                  category.includes("wine") ? "🍷" :
                  category.includes("cocktail") ? "🍸" :
                  category.includes("spirit") ? "🥃" :
                  category.includes("hot") ? "☕" : "🍴"
                }</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">{categoryLabels[category] || category}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-sans">{items.length} items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((product, idx) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <Card className={`group bg-card border overflow-hidden transition-all duration-300 hover:shadow-luxury hover:border-primary/30 ${inCart ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Icon/Image area */}
                          <div className={`w-20 flex items-center justify-center flex-shrink-0 transition-colors ${
                            inCart ? "bg-primary/15" : "bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/10 group-hover:to-primary/5"
                          }`}>
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              product.department === "kitchen" 
                                ? <UtensilsCrossed size={24} className="text-primary/70" /> 
                                : <Wine size={24} className="text-primary/70" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                            <h3 className="font-sans font-bold text-sm text-card-foreground leading-tight">{product.name}</h3>
                            {product.description && (
                              <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-1">{product.description}</p>
                            )}
                            <p className="text-sm font-bold text-primary font-sans mt-1.5">{formatRWF(product.price)}</p>
                          </div>
                          {/* Action */}
                          <div className="flex items-center pr-4">
                            {inCart ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateQuantity(product.id, -1)} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                  <Minus size={14} className="text-foreground" />
                                </button>
                                <span className="text-sm font-sans font-bold w-6 text-center text-foreground">{inCart.quantity}</span>
                                <button onClick={() => updateQuantity(product.id, 1)} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <motion.button whileTap={{ scale: 0.85 }} onClick={() => addToCart(product)}
                                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                                <Plus size={18} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Track Order drawer */}
      <AnimatePresence>
        {trackingOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setTrackingOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-serif text-lg font-bold text-card-foreground">My Orders</h2>
                <button onClick={() => setTrackingOpen(false)} className="p-2 rounded-full hover:bg-muted"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {trackingLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : trackedOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground font-sans py-12">No orders found.</p>
                ) : trackedOrders.map((o: any) => {
                  const st = statusConfig[o.status] || statusConfig.pending;
                  const StIcon = st.icon;
                  return (
                    <Card key={o.id} className="bg-card border border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StIcon size={18} className={st.color} />
                            <span className={`font-sans font-semibold text-sm capitalize ${st.color}`}>{st.label}</span>
                          </div>
                          <span className="text-lg font-bold font-sans text-primary">{formatRWF(Number(o.total))}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-sans">
                          {new Date(o.created_at).toLocaleString()}
                          {o.source_id !== "online" && o.source_type === "table" && ` · Table ${o.source_id}`}
                        </div>
                        {o.assigned_waiter && (
                          <p className="text-xs font-sans text-blue-600 font-medium">🧑‍🍳 Waiter: {o.assigned_waiter}</p>
                        )}
                        <p className="text-xs font-sans text-muted-foreground italic">{st.message}</p>
                        {/* Progress bar */}
                        <div className="flex gap-1">
                          {["pending", "preparing", "ready", "delivered"].map((step, idx) => {
                            const steps = ["pending", "preparing", "ready", "delivered"];
                            const currentIdx = steps.indexOf(o.status);
                            const active = o.status !== "cancelled" && idx <= currentIdx;
                            return <div key={step} className={`h-1.5 flex-1 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />;
                          })}
                        </div>
                        <div className="space-y-1">
                          {(o.order_items || []).map((item: any) => (
                            <div key={item.id} className="text-sm font-sans text-foreground flex justify-between">
                              <span>{item.product?.department === "kitchen" ? "🍽️" : "🍺"} {item.product?.name} × {item.quantity}</span>
                              <span className="text-muted-foreground">{formatRWF(item.unit_price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs font-sans text-muted-foreground">
                          <span>Payment: <span className="capitalize">{o.payment_status?.replace("_", " ")}</span></span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setCartOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-serif text-lg font-bold text-card-foreground">Your Order</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-muted"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground font-sans py-12">Cart is empty</p>
                ) : cart.map((item) => (
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
                    <Input placeholder="Special instructions..." value={item.note} onChange={(e) => updateItemNote(item.product.id, e.target.value)} className="text-xs h-8 font-sans" />
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <Textarea placeholder="Order notes..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="font-sans text-sm" rows={2} />

                  {activeBooking && (
                    <label className="flex items-center gap-2 text-sm font-sans text-foreground cursor-pointer">
                      <input type="checkbox" checked={chargeToRoom} onChange={(e) => setChargeToRoom(e.target.checked)} className="rounded border-border" />
                      Charge to Room ({activeBooking.rooms?.name})
                    </label>
                  )}

                  {!tableNumber && !activeBooking && (
                    <p className="text-xs text-muted-foreground font-sans bg-muted/50 rounded-lg p-2">
                      📱 Online order — pay at the restaurant when you arrive.
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

      {/* Floating cart */}
      {cart.length > 0 && !cartOpen && (
        <motion.button initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-4 font-sans z-30 hover:scale-105 transition-transform">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </div>
          <span className="font-semibold text-sm">View Order</span>
          <span className="font-bold text-primary">{formatRWF(cartTotal)}</span>
        </motion.button>
      )}
    </div>
  );
};

export default Menu;
