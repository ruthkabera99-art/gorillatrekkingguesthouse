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

    // Persist the latest user message
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const content = textOf(last);
      if (content) {
        const { error } = await db
          .from("chat_messages")
          .insert({ session_id: sessionId, role: "user", content });
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
      },
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      onFinish: async ({ responseMessage }) => {
        const content = textOf(responseMessage as UIMessage);
        if (!content) return;
        const { error } = await db
          .from("chat_messages")
          .insert({ session_id: sessionId, role: "assistant", content });
        if (error) console.error("save assistant message failed", error.message);
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
