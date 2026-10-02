import { toast } from "sonner";

type Saved = { total_price: number | string; status: string; check_in: string; check_out: string } | null | undefined;
type Sent = { total_price: number; check_in: string; check_out: string };

/** Compare what the guest submitted with what the server saved, and explain any corrections. */
export const explainServerCorrections = (sent: Sent, saved: Saved) => {
  if (!saved) return;
  const notes: string[] = [];
  if (Math.round(Number(saved.total_price)) !== Math.round(sent.total_price)) {
    notes.push(`Total price was set to ${Number(saved.total_price).toLocaleString()} RWF using the room's current nightly rate.`);
  }
  if (saved.check_in !== sent.check_in || saved.check_out !== sent.check_out) {
    notes.push(`Dates were adjusted to ${saved.check_in} → ${saved.check_out}.`);
  }
  if (notes.length) {
    toast.info("Some details were corrected by the hotel system", {
      description: notes.join(" ") + " Status starts as pending until staff confirm.",
      duration: 10000,
    });
  }
};

export const GUEST_EDIT_RULES =
  "Prices are always calculated by the hotel from the room's nightly rate, and new bookings start as pending. After booking you can only change your special requests or cancel — contact reception to change dates, room or guests.";
