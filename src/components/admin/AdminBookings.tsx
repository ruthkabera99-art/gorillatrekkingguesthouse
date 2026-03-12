import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Eye, CalendarDays, Users, Phone, Mail, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";

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
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  rooms: { name: string; type: string; base_price: number; images: string[] | null } | null;
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRoom | null>(null);
  const [guestProfile, setGuestProfile] = useState<Profile | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchBookings = async () => {
    let query = supabase
      .from("bookings")
      .select("*, rooms(name, type, base_price, images)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter as "pending" | "confirmed" | "cancelled" | "completed");
    }

    const { data, error } = await query;
    if (error) { toast.error(error.message); return; }
    setBookings((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const viewDetails = async (booking: BookingWithRoom) => {
    setSelectedBooking(booking);
    setGuestProfile(null);
    setGuestEmail(null);
    setDetailOpen(true);

    // Fetch guest profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", booking.user_id)
      .single();
    setGuestProfile(profile);

    // Fetch guest email from auth (via edge function or just show user_id)
    // We'll show what we have from profiles
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Booking ${status}`);
    fetchBookings();
    if (selectedBooking?.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, status: status as any } : null);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-yellow-500" },
          { label: "Confirmed", value: stats.confirmed, color: "text-blue-500" },
          { label: "Completed", value: stats.completed, color: "text-green-500" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-sans ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-sans">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Bookings</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground font-sans">
            No bookings found.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Room</TableHead>
                  <TableHead className="font-sans">Check-in</TableHead>
                  <TableHead className="font-sans">Check-out</TableHead>
                  <TableHead className="font-sans">Guests</TableHead>
                  <TableHead className="font-sans">Total</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-sans font-medium">
                      <div className="flex items-center gap-2">
                        {b.rooms?.images?.[0] && (
                          <img src={b.rooms.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{b.rooms?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{b.rooms?.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-sm">{format(new Date(b.check_in), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-sans text-sm">{format(new Date(b.check_out), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-sans text-sm">{b.guests_adults}A {b.guests_children > 0 ? `+ ${b.guests_children}C` : ""}</TableCell>
                    <TableCell className="font-sans text-sm font-bold text-primary">{fmt(Number(b.total_price))}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-sans px-2 py-1 rounded-full border capitalize ${statusColors[b.status]}`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => viewDetails(b)}>
                        <Eye size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Room Info */}
              <div className="rounded-lg overflow-hidden border border-border">
                {selectedBooking.rooms?.images?.[0] && (
                  <img src={selectedBooking.rooms.images[0]} alt="" className="w-full h-32 object-cover" />
                )}
                <div className="p-3">
                  <p className="font-sans font-bold text-foreground">{selectedBooking.rooms?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize font-sans">{selectedBooking.rooms?.type} Room</p>
                </div>
              </div>

              {/* Guest Info */}
              <Card className="bg-muted/50 border-border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-sans text-muted-foreground">Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="font-sans text-sm text-foreground">{guestProfile?.full_name || "Loading..."}</span>
                  </div>
                  {guestProfile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground" />
                      <span className="font-sans text-sm text-foreground">{guestProfile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="font-sans text-sm text-muted-foreground text-xs">User ID: {selectedBooking.user_id.slice(0, 8)}...</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stay Details */}
              <Card className="bg-muted/50 border-border">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-sans text-muted-foreground">Stay Details</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    <span className="font-sans text-sm text-foreground">
                      {format(new Date(selectedBooking.check_in), "MMM dd")} → {format(new Date(selectedBooking.check_out), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="font-sans text-sm text-foreground">
                      {differenceInDays(new Date(selectedBooking.check_out), new Date(selectedBooking.check_in))} night(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="font-sans text-sm text-foreground">
                      {selectedBooking.guests_adults} Adult(s){selectedBooking.guests_children > 0 ? `, ${selectedBooking.guests_children} Child(ren)` : ""}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border">
                    <p className="font-sans text-lg font-bold text-primary">{fmt(Number(selectedBooking.total_price))}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <Card className="bg-muted/50 border-border">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground font-sans mb-1">Special Requests</p>
                    <p className="text-sm text-foreground font-sans">{selectedBooking.special_requests}</p>
                  </CardContent>
                </Card>
              )}

              {/* Status & Actions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-sans">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "confirmed", "completed", "cancelled"] as const).map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedBooking.status === s ? "default" : "outline"}
                      className="capitalize font-sans text-xs"
                      onClick={() => updateStatus(selectedBooking.id, s)}
                      disabled={selectedBooking.status === s}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-sans">
                Booked on {format(new Date(selectedBooking.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
