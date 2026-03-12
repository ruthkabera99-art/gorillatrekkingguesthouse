import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;
const ROOM_TYPES = ["standard", "deluxe", "executive", "presidential"] as const;

const AVAILABLE_AMENITIES = [
  "WiFi", "AC", "TV", "Mini Bar", "Room Service", "Hot Water",
  "Balcony", "Safe Box", "Hair Dryer", "Iron", "Coffee Maker",
  "Bathtub", "Mountain View", "Parking", "Breakfast Included",
];

const DEFAULT_ROOM_IMAGES: Record<string, string> = {
  standard: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop",
  deluxe: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop",
  executive: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
  presidential: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop",
};

const AdminRooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "standard", base_price: "", capacity: "2", description: "", status: "available" });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("*").order("name");
    setRooms(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchRooms(); }, []);

  const openEdit = (room: any) => {
    setEditing(room);
    setForm({ name: room.name, type: room.type, base_price: String(room.base_price), capacity: String(room.capacity), description: room.description || "", status: room.status });
    setSelectedAmenities(room.amenities || []);
    setUploadedImages(room.images || []);
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", type: "standard", base_price: "", capacity: "2", description: "", status: "available" });
    setSelectedAmenities([]);
    setUploadedImages([]);
    setOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("room-images").upload(filePath, file);
      if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("room-images").getPublicUrl(filePath);
      newUrls.push(urlData.publicUrl);
    }
    setUploadedImages(prev => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    const images = uploadedImages.length > 0 ? uploadedImages : [DEFAULT_ROOM_IMAGES[form.type] || DEFAULT_ROOM_IMAGES.standard];
    const payload = {
      name: form.name,
      type: form.type as any,
      base_price: Number(form.base_price),
      capacity: Number(form.capacity),
      description: form.description || null,
      status: form.status,
      images,
      amenities: selectedAmenities,
    };
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

  const getRoomImage = (room: any) => {
    if (room.images && room.images.length > 0) return room.images[0];
    return DEFAULT_ROOM_IMAGES[room.type] || DEFAULT_ROOM_IMAGES.standard;
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Room" : "New Room"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
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

              {/* Amenities */}
              <div className="space-y-2">
                <Label className="font-sans">Amenities</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_AMENITIES.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 text-sm font-sans cursor-pointer hover:text-primary transition-colors">
                      <Checkbox
                        checked={selectedAmenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="font-sans">Room Images</Label>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden border border-border aspect-video">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-2 border-dashed border-border rounded-md aspect-video flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    {uploading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <><Upload size={16} /><span className="text-xs font-sans">Upload</span></>}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <p className="text-xs text-muted-foreground font-sans">
                  {uploadedImages.length === 0 ? "Default image used if none uploaded." : `${uploadedImages.length} image(s)`}
                </p>
              </div>

              <Button onClick={save} className="w-full font-sans" disabled={!form.name || !form.base_price}>
                {editing ? "Update" : "Create"} Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rooms.map(r => (
          <Card key={r.id} className="bg-card border border-border overflow-hidden">
            <div className="flex">
              <div className="w-28 h-28 flex-shrink-0">
                <img src={getRoomImage(r)} alt={r.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3 flex-1 flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <p className="font-sans font-bold text-foreground truncate">{r.name}</p>
                  <p className="text-sm text-muted-foreground font-sans capitalize">{r.type} · {r.capacity} guests</p>
                  <p className="text-sm font-sans text-primary font-bold">{fmt(Number(r.base_price))}/night</p>
                  {r.amenities && r.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.amenities.slice(0, 3).map((a: string) => (
                        <span key={a} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-sans">{a}</span>
                      ))}
                      {r.amenities.length > 3 && <span className="text-[10px] text-muted-foreground font-sans">+{r.amenities.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge variant={r.status === "available" ? "default" : r.status === "occupied" ? "secondary" : "outline"} className="capitalize text-xs">
                    {r.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRoom(r.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRooms;
