import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HotelInfo {
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  currency?: string;
  description?: string;
}

const DEFAULTS: HotelInfo = {
  name: "Gorilla Trekking Guest House",
  phone: "+250 788 000 000",
  whatsapp: "250788000000",
  email: "info@gorillatrekkingguesthouse.com",
  address: "Musanze, Rwanda — Near Volcanoes National Park",
};

let cached: HotelInfo | null = null;
const listeners = new Set<(v: HotelInfo) => void>();

async function fetchHotelInfo(): Promise<HotelInfo> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hotel_info")
    .maybeSingle();
  const merged = { ...DEFAULTS, ...(data?.value as HotelInfo | undefined) };
  cached = merged;
  listeners.forEach((l) => l(merged));
  return merged;
}

export function useHotelInfo(): HotelInfo {
  const [info, setInfo] = useState<HotelInfo>(cached ?? DEFAULTS);

  useEffect(() => {
    listeners.add(setInfo);
    if (!cached) fetchHotelInfo();
    else setInfo(cached);

    const channel = supabase
      .channel("hotel-info-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.hotel_info" },
        () => fetchHotelInfo()
      )
      .subscribe();

    return () => {
      listeners.delete(setInfo);
      supabase.removeChannel(channel);
    };
  }, []);

  return info;
}
