import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "npm:ai@5";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages: UIMessage[] = body?.messages ?? [];
    const sessionId: string = String(body?.sessionId ?? "").slice(0, 64);
    const accessToken: string | null = body?.accessToken ? String(body.accessToken) : null;

    // GET-style history load
    if (body?.action === "history") {
      const { data } = await admin()
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(100);
      return new Response(JSON.stringify({ messages: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = admin();

    const textOf = (m: UIMessage) =>
      (m.parts ?? [])
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("")
        .trim();



    // Identify the guest (optional — anonymous visitors are still welcome)
    let userId: string | null = null;
    if (accessToken) {
      const { data: authData } = await db.auth.getUser(accessToken);
      userId = authData?.user?.id ?? null;
    }

    // Build a short memory of this guest: who they are, their last stay and room preferences
    let guestMemory = "This visitor is not signed in, so you have no stay history for them.";
    if (userId) {
      const [{ data: profile }, { data: stays }] = await Promise.all([
        db.from("profiles").select("full_name, phone, loyalty_points").eq("user_id", userId).maybeSingle(),
        db
          .from("bookings")
          .select("check_in, check_out, guests_adults, guests_children, status, total_price, room_id, rooms(name, type, base_price)")
          .eq("user_id", userId)
          .order("check_in", { ascending: false })
          .limit(5),
      ]);

      const history = stays ?? [];
      const counts = new Map<string, number>();
      for (const s of history as any[]) {
        const t = s.rooms?.type;
        if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      const favouriteType = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const lastStay = (history as any[])[0] ?? null;
      const typicalGuests = lastStay
        ? (lastStay.guests_adults ?? 1) + (lastStay.guests_children ?? 0)
        : null;

      guestMemory = [
        `Signed-in guest: ${profile?.full_name || "name unknown"}${profile?.phone ? ` (${profile.phone})` : ""}.`,
        `Loyalty points: ${profile?.loyalty_points ?? 0}.`,
        lastStay
          ? `Last booking: ${lastStay.rooms?.name ?? "a room"} (${lastStay.rooms?.type ?? "unknown type"}) from ${lastStay.check_in} to ${lastStay.check_out}, status ${lastStay.status}, for ${typicalGuests} guest(s).`
          : "No previous bookings on record.",
        favouriteType ? `Preferred room type based on past stays: ${favouriteType}.` : "",
        history.length > 1
          ? `Earlier stays: ${(history as any[])
              .slice(1)
              .map((s) => `${s.rooms?.name ?? "room"} ${s.check_in}→${s.check_out}`)
              .join("; ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    }

    // Persist the latest user message
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const content = textOf(last);
      if (content) {
        const { error } = await db
          .from("chat_messages")
          .insert({ session_id: sessionId, user_id: userId, role: "user", content });
        if (error) console.error("save user message failed", error.message);
      }
    }

    const { data: settings } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "hotel_info")
      .maybeSingle();
    const hotel = (settings?.value as Record<string, unknown>) ?? {};

    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const result = streamText({
      model: lovable.responses("openai/gpt-5.6-sol"),
      system: `You are "Kivu", the friendly front-desk assistant for Gorilla Trekking Guest House in Musanze, Rwanda (near Volcanoes National Park).

Help guests with rooms, prices, availability, the restaurant/bar menu, gorilla trekking packages, directions and general questions. Be warm, concise (2-4 sentences unless listing options), and never invent prices or availability — always use your tools for live data.

Known facts:
- Location: Musanze, Rwanda — about 15 minutes from Volcanoes National Park and roughly a 2 hour drive from Kigali International Airport.
- Trekking packages: Half-Day Trek RWF 150,000/person; Full-Day Gorilla Trek RWF 350,000/person; 3-Day Adventure Package RWF 800,000/person.
- Current promotion: 20% off all rooms for stays of 7+ nights.
- Contact details: ${JSON.stringify(hotel)}
- Prices are quoted in RWF.
- Today's date is ${new Date().toISOString().slice(0, 10)}.

Guest memory (what you already know about this visitor):
${guestMemory}

Use the guest memory to answer faster: greet returning guests by first name, assume their preferred room type and usual party size unless they say otherwise, and when they ask about "the same room" or "like last time" use the remembered room and dates instead of asking again. Always confirm your assumption in one short clause (e.g. "in the Deluxe again, for 2 guests?") and never state a remembered date or room as a new confirmed booking. Call get_my_stays if you need the full booking details.

To book, direct guests to the Rooms page on the site or to WhatsApp. You cannot create bookings or take payments yourself.`,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(20),
      providerOptions: { openai: { store: false, reasoningEffort: "low" } },
      tools: {
        list_rooms: tool({
          description: "List the guest house rooms with their nightly price, capacity and amenities.",
          inputSchema: z.object({}),
          execute: async () => {
            const { data, error } = await db
              .from("rooms")
              .select("id, name, type, description, base_price, capacity, amenities, status")
              .order("base_price");
            if (error) return { error: error.message };
            return { rooms: data ?? [], currency: "RWF" };
          },
        }),
        check_availability: tool({
          description:
            "Check which rooms are free between a check-in and check-out date (YYYY-MM-DD).",
          inputSchema: z.object({
            check_in: z.string().describe("Check-in date, YYYY-MM-DD"),
            check_out: z.string().describe("Check-out date, YYYY-MM-DD"),
          }),
          execute: async ({ check_in, check_out }) => {
            const { data: rooms, error } = await db
              .from("rooms")
              .select("id, name, type, base_price, capacity")
              .eq("status", "available");
            if (error) return { error: error.message };
            const { data: booked } = await db
              .from("bookings")
              .select("room_id")
              .in("status", ["pending", "confirmed", "checked_in"])
              .lt("check_in", check_out)
              .gt("check_out", check_in);
            const taken = new Set((booked ?? []).map((b: any) => b.room_id));
            const nights = Math.max(
              1,
              Math.round(
                (new Date(check_out).getTime() - new Date(check_in).getTime()) / 86400000,
              ),
            );
            const available = (rooms ?? [])
              .filter((r: any) => !taken.has(r.id))
              .map((r: any) => ({
                ...r,
                nights,
                total_price: Number(r.base_price) * nights * (nights >= 7 ? 0.8 : 1),
              }));
            return { check_in, check_out, nights, currency: "RWF", available };
          },
        }),
        get_menu: tool({
          description: "List available restaurant and bar menu items, optionally by department.",
          inputSchema: z.object({
            department: z
              .enum(["kitchen", "bar"])
              .nullable()
              .describe("Filter by kitchen or bar. Null for everything."),
          }),
          execute: async ({ department }) => {
            let q = db
              .from("products")
              .select("name, description, price, category, department")
              .eq("available", true)
              .order("category");
            if (department) q = q.eq("department", department);
            const { data, error } = await q.limit(80);
            if (error) return { error: error.message };
            return { items: data ?? [], currency: "RWF" };
          },
        }),
        get_my_stays: tool({
          description:
            "Get this signed-in guest's own booking history (dates, room, guests, status) to reuse their previous dates or room preference.",
          inputSchema: z.object({}),
          execute: async () => {
            if (!userId) return { signed_in: false, stays: [] };
            const { data, error } = await db
              .from("bookings")
              .select(
                "check_in, check_out, guests_adults, guests_children, status, total_price, invoice_number, rooms(name, type, base_price, capacity)",
              )
              .eq("user_id", userId)
              .order("check_in", { ascending: false })
              .limit(10);
            if (error) return { error: error.message };
            return { signed_in: true, currency: "RWF", stays: data ?? [] };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      onFinish: async ({ responseMessage }) => {
        const content = textOf(responseMessage as UIMessage);
        if (!content) return;
        const { error } = await db
          .from("chat_messages")
          .insert({ session_id: sessionId, user_id: userId, role: "assistant", content });
        if (error) console.error("save assistant message failed", error.message);
      },
      },
    });
  } catch (e) {
    console.error("guest-assistant error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
