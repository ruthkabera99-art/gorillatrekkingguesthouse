import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;
const CATEGORIES = Constants.public.Enums.product_category;
const DEPARTMENTS = Constants.public.Enums.product_department;

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "main_course", department: "kitchen", description: "", available: true, stock: "0" });
  const [filterDept, setFilterDept] = useState<string>("all");

  // Restock dialog state
  const [restockDialog, setRestockDialog] = useState<{ open: boolean; product: any }>({ open: false, product: null });
  const [restockQty, setRestockQty] = useState("");

  const fetch = async () => {
    let q = supabase.from("products").select("*").order("department").order("name");
    if (filterDept !== "all") q = q.eq("department", filterDept as any);
    const { data } = await q;
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filterDept]);

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), category: p.category, department: p.department, description: p.description || "", available: p.available, stock: String(p.stock ?? 0) });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", price: "", category: "main_course", department: "kitchen", description: "", available: true, stock: "0" });
    setOpen(true);
  };

  const save = async () => {
    const payload = { name: form.name, price: Number(form.price), category: form.category as any, department: form.department as any, description: form.description || null, available: form.available, stock: Number(form.stock) || 0 };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Product created");
    }
    setOpen(false);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetch(); }
  };

  const toggle = async (id: string, available: boolean) => {
    await supabase.from("products").update({ available } as any).eq("id", id);
    fetch();
  };

  const openRestock = (product: any) => {
    setRestockQty("");
    setRestockDialog({ open: true, product });
  };

  const confirmRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    const product = restockDialog.product;
    const newStock = (product.stock || 0) + qty;
    const updates: any = { stock: newStock };
    // Auto-enable if it was disabled and now has stock
    if (!product.available && newStock > 0) updates.available = true;
    const { error } = await supabase.from("products").update(updates).eq("id", product.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Restocked ${product.name}: +${qty} (now ${newStock})`);
      fetch();
    }
    setRestockDialog({ open: false, product: null });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg font-semibold text-foreground">Menu Products</h2>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-32 font-sans"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="font-sans gap-1"><Plus size={14} /> Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="font-sans">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-sans">Price (RWF)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label className="font-sans">Department</Label>
                  <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="font-sans">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="font-sans">Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label className="font-sans">Stock Quantity</Label><Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0 = unlimited" /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.available} onCheckedChange={v => setForm({ ...form, available: v })} />
                <Label className="font-sans">Available</Label>
              </div>
              <Button onClick={save} className="w-full font-sans">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(p => (
          <Card key={p.id} className={`bg-card border border-border ${!p.available ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-sans font-bold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-sans capitalize">{p.department} · {p.category.replace("_", " ")}</p>
                  <p className="text-sm font-sans text-primary font-bold mt-1">{fmt(Number(p.price))}</p>
                  <p className={`text-xs font-sans mt-0.5 ${(p.stock !== undefined && p.stock !== null && p.stock > 0) ? (p.stock <= 5 ? "text-orange-500 font-semibold" : "text-muted-foreground") : "text-muted-foreground"}`}>
                    {(p.stock !== undefined && p.stock !== null && p.stock > 0) ? `Stock: ${p.stock}` : "Unlimited"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" title="Restock" onClick={() => openRestock(p)}><PackagePlus size={14} className="text-green-600" /></Button>
                  <Switch checked={p.available} onCheckedChange={v => toggle(p.id, v)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(p.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Restock Dialog */}
      <Dialog open={restockDialog.open} onOpenChange={(open) => setRestockDialog({ ...restockDialog, open })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Restock — {restockDialog.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-sans">
              Current stock: <strong>{restockDialog.product?.stock || 0}</strong>
            </p>
            <div>
              <Label className="font-sans">Add Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && confirmRestock()}
              />
            </div>
            {restockQty && Number(restockQty) > 0 && (
              <p className="text-xs font-sans text-muted-foreground">
                New stock will be: <strong className="text-foreground">{(restockDialog.product?.stock || 0) + Number(restockQty)}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockDialog({ open: false, product: null })} className="font-sans">Cancel</Button>
            <Button onClick={confirmRestock} className="font-sans">Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
