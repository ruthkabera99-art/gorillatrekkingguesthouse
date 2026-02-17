import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;
const ROOM_TYPES = ["standard", "deluxe", "executive", "presidential"] as const;

const AdminRooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "standard", base_price: "", capacity: "2", description: "", status: "available" });

  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("*").order("name");
    setRooms(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchRooms(); }, []);

  const openEdit = (room: any) => {
    setEditing(room);
    setForm({ name: room.name, type: room.type, base_price: String(room.base_price), capacity: String(room.capacity), description: room.description || "", status: room.status });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", type: "standard", base_price: "", capacity: "2", description: "", status: "available" });
    setOpen(true);
  };

  const save = async () => {
    const payload = { name: form.name, type: form.type as any, base_price: Number(form.base_price), capacity: Number(form.capacity), description: form.description || null, status: form.status };
    if (editing) {
      const { error } = await supabase.from("rooms").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Room updated");
    } else {
      const { error } = await supabase.from("rooms").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Room created");
    }
    setOpen(false);
    fetchRooms();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room deleted"); fetchRooms(); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Manage Rooms</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="font-sans gap-1"><Plus size={14} /> Add Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Room" : "New Room"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="font-sans">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="font-sans">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROOM_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-sans">Price/night (RWF)</Label><Input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} /></div>
                <div><Label className="font-sans">Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
              </div>
              <div><Label className="font-sans">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="font-sans">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={save} className="w-full font-sans">{editing ? "Update" : "Create"} Room</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rooms.map(r => (
          <Card key={r.id} className="bg-card border border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-sans font-bold text-foreground">{r.name}</p>
                <p className="text-sm text-muted-foreground font-sans capitalize">{r.type} · {r.capacity} guests</p>
                <p className="text-sm font-sans text-primary font-bold">{fmt(Number(r.base_price))}/night</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-sans px-2 py-0.5 rounded-full capitalize ${
                  r.status === "available" ? "bg-green-100 text-green-700" :
                  r.status === "occupied" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{r.status}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRoom(r.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRooms;
