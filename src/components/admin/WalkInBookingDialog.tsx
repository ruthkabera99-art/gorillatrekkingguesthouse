import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { UserPlus } from "lucide-react";

type Room = { id: string; name: string; type: string; base_price: number; status: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const WalkInBookingDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    room_id: "",
    check_in: today,
    check_out: tomorrow,
    guests_adults: 1,
    guests_children: 0,
    special_requests: "",
    check_in_now: true,
  });

  useEffect(() => {
    if (!open) return;
    supabase.from("rooms").select("id, name, type, base_price, status").order("name").then(({ data }) => {
      setRooms((data as any) || []);
    });
  }, [open]);

  const selectedRoom = rooms.find((r) => r.id === form.room_id);
  const nights = Math.max(1, differenceInDays(new Date(form.check_out), new Date(form.check_in)) || 1);
  const total = selectedRoom ? Number(selectedRoom.base_price) * nights : 0;

  const reset = () => setForm({
    guest_name: "", guest_phone: "", room_id: "", check_in: today, check_out: tomorrow,
    guests_adults: 1, guests_children: 0, special_requests: "", check_in_now: true,
  });

  const handleSubmit = async () => {
    if (!form.guest_name.trim()) { toast.error("Guest name is required"); return; }
    if (!form.room_id) { toast.error("Please select a room"); return; }
    if (new Date(form.check_out) <= new Date(form.check_in)) { toast.error("Check-out must be after check-in"); return; }

    setSaving(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: null,
      guest_name: form.guest_name.trim(),
      guest_phone: form.guest_phone.trim() || null,
      room_id: form.room_id,
      check_in: form.check_in,
      check_out: form.check_out,
      guests_adults: form.guests_adults,
      guests_children: form.guests_children,
      total_price: total,
      special_requests: form.special_requests.trim() || null,
      status: form.check_in_now ? "checked_in" : "confirmed",
    } as any);
    setSaving(false);

    if (error) { toast.error(error.message); return; }
    toast.success(`Walk-in booking created for ${form.guest_name}`);
    reset();
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <UserPlus size={18} /> New Walk-in Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans text-xs">Guest Name *</Label>
              <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="John Doe" maxLength={100} />
            </div>
            <div>
              <Label className="font-sans text-xs">Phone (optional)</Label>
              <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} placeholder="+250 7..." maxLength={20} />
            </div>
          </div>

          <div>
            <Label className="font-sans text-xs">Room *</Label>
            <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} — RWF {Number(r.base_price).toLocaleString()}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans text-xs">Check-in</Label>
              <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
            </div>
            <div>
              <Label className="font-sans text-xs">Check-out</Label>
              <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans text-xs">Adults</Label>
              <Input type="number" min={1} value={form.guests_adults} onChange={(e) => setForm({ ...form, guests_adults: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label className="font-sans text-xs">Children</Label>
              <Input type="number" min={0} value={form.guests_children} onChange={(e) => setForm({ ...form, guests_children: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div>
            <Label className="font-sans text-xs">Special Requests</Label>
            <Textarea value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} rows={2} maxLength={500} />
          </div>

          <label className="flex items-center gap-2 text-sm font-sans cursor-pointer">
            <input type="checkbox" checked={form.check_in_now} onChange={(e) => setForm({ ...form, check_in_now: e.target.checked })} />
            Check guest in immediately
          </label>

          {selectedRoom && (
            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">{nights} night(s) × RWF {Number(selectedRoom.base_price).toLocaleString()}</span>
                <span className="font-bold text-primary">RWF {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInBookingDialog;
