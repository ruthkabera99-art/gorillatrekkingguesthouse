import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

const HOTEL = 'Gorilla Trekking Guest House';

type Ctx = {
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
};

// Only these pre-approved templates can ever be sent. No free-form text.
const TEMPLATES: Record<string, (c: Ctx) => string> = {
  pending: (c) =>
    `Hello ${c.guestName}, your booking at ${HOTEL} for ${c.roomName} (${c.checkIn} to ${c.checkOut}) has been received. We'll confirm shortly!`,
  confirmed: (c) =>
    `Great news ${c.guestName}! Your booking for ${c.roomName} at ${HOTEL} (${c.checkIn} to ${c.checkOut}) is CONFIRMED. We look forward to welcoming you!`,
  checked_in: (c) =>
    `Welcome ${c.guestName}! You've been checked in to ${c.roomName} at ${HOTEL}. Enjoy your stay!`,
  cancelled: (c) =>
    `Dear ${c.guestName}, your booking for ${c.roomName} (${c.checkIn} to ${c.checkOut}) at ${HOTEL} has been cancelled. Contact us for questions.`,
  completed: (c) =>
    `Thank you ${c.guestName} for staying at ${HOTEL}! We hope you enjoyed your time in ${c.roomName}. We'd love to see you again!`,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Authentication: a valid Supabase JWT is required ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const caller = userData?.user;
    if (userError || !caller) return json({ success: false, error: 'Unauthorized' }, 401);

    const { bookingId, template } = await req.json();
    if (!bookingId || !template || !TEMPLATES[template]) {
      return json({ success: false, error: 'Invalid request' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // --- Authorization: caller must own the booking, or be an admin ---
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();
    const isAdmin = !!roleRow;

    const { data: booking } = await admin
      .from('bookings')
      .select('id, user_id, guest_name, guest_phone, check_in, check_out, room:rooms(name)')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) return json({ success: false, error: 'Booking not found' }, 404);
    if (!isAdmin && booking.user_id !== caller.id) {
      return json({ success: false, error: 'Forbidden' }, 403);
    }

    // --- Recipient is derived server-side from the booking, never from the client ---
    let guestName = (booking as any).guest_name as string | null;
    let to = (booking as any).guest_phone as string | null;
    if (booking.user_id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', booking.user_id)
        .maybeSingle();
      guestName = profile?.full_name || guestName;
      to = profile?.phone || to;
    }
    if (!to) return json({ success: false, error: 'No phone number on file for this booking' }, 200);

    const message = TEMPLATES[template]({
      guestName: guestName || 'Guest',
      roomName: (booking as any).room?.name || 'your room',
      checkIn: (booking as any).check_in,
      checkOut: (booking as any).check_out,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      console.log('Twilio not configured, skipping SMS');
      return json({ success: false, error: 'Twilio not configured. Connect Twilio in settings to enable SMS.' });
    }

    const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER') || '+15005550006';

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Twilio error [${response.status}]:`, JSON.stringify(data));
      return json({ success: false, error: 'SMS provider request failed' }, response.status);
    }

    return json({ success: true, sid: data.sid });
  } catch (error: unknown) {
    console.error('SMS error:', error);
    return json({ success: false, error: 'Unable to send SMS' }, 500);
  }
});
