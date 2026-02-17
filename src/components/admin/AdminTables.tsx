import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, QrCode } from "lucide-react";

const AdminTables = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ table_number: "", capacity: "4" });

  const fetch = async () => {
    const { data } = await supabase.from("restaurant_tables").select("*").order("table_number");
    setTables(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    const { error } = await supabase.from("restaurant_tables").insert({
      table_number: Number(form.table_number),
      capacity: Number(form.capacity),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Table added");
    setOpen(false);
    setForm({ table_number: "", capacity: "4" });
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetch(); }
  };

  const qrUrl = (num: number) => `${window.location.origin}/menu?table=${num}`;

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Restaurant Tables</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-sans gap-1"><Plus size={14} /> Add Table</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Add Table</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="font-sans">Table Number</Label><Input type="number" value={form.table_number} onChange={e => setForm({ ...form, table_number: e.target.value })} /></div>
              <div><Label className="font-sans">Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
              <Button onClick={save} className="w-full font-sans">Create Table</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tables.map(t => (
          <Card key={t.id} className="bg-card border border-border">
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-3xl font-bold font-sans text-foreground">{t.table_number}</p>
              <p className="text-xs text-muted-foreground font-sans">{t.capacity} seats</p>
              <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize inline-block ${
                t.status === "available" ? "bg-green-100 text-green-700" :
                t.status === "occupied" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>{t.status}</span>
              <div className="flex gap-1 justify-center mt-2">
                <Button size="sm" variant="outline" className="font-sans gap-1 text-xs" onClick={() => {
                  navigator.clipboard.writeText(qrUrl(t.table_number));
                  toast.success("QR link copied!");
                }}>
                  <QrCode size={12} /> Copy QR Link
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(t.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminTables;
