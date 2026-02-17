import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const AdminPromotions = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discount_percent: "", valid_to: "" });

  const fetch = async () => {
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    const { error } = await supabase.from("promotions").insert({
      code: form.code.toUpperCase(),
      discount_percent: Number(form.discount_percent),
      valid_to: form.valid_to,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Promotion created");
    setOpen(false);
    setForm({ code: "", discount_percent: "", valid_to: "" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promotions").update({ active } as any).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Promotions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-sans gap-1"><Plus size={14} /> Add Promo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">New Promotion</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="font-sans">Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. WELCOME20" /></div>
              <div><Label className="font-sans">Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} /></div>
              <div><Label className="font-sans">Valid Until</Label><Input type="date" value={form.valid_to} onChange={e => setForm({ ...form, valid_to: e.target.value })} /></div>
              <Button onClick={save} className="w-full font-sans">Create Promotion</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {promos.map(p => (
          <Card key={p.id} className="bg-card border border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-sans font-bold text-foreground text-lg">{p.code}</p>
                <p className="text-sm text-muted-foreground font-sans">{p.discount_percent}% off · Expires {new Date(p.valid_to).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={v => toggle(p.id, v)} />
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(p.id)}><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPromotions;
