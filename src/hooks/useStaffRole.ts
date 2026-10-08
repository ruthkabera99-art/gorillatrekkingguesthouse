import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const STAFF_ROLES = ["admin", "waiter", "kitchen", "bar", "receptionist"] as const;
export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", waiter: "Waiter", kitchen: "Kitchen", bar: "Bar", receptionist: "Receptionist", user: "Guest", moderator: "Moderator",
};
/** Pages that are always admin-only, whatever the permission table says */
export const ADMIN_ONLY_TABS = ["staff", "settings", "security", "audit"];

/** Current user's staff role + which admin pages it can open */
export function useStaffRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRole(null); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r: any) => r.role as string);
      const r = roles.includes("admin") ? "admin" : STAFF_ROLES.find((s) => roles.includes(s)) || null;
      setRole(r);
      if (r && r !== "admin") {
        const { data: p } = await (supabase as any).from("role_permissions").select("tabs").eq("role", r).maybeSingle();
        setTabs(((p?.tabs as string[]) || []).filter((t) => !ADMIN_ONLY_TABS.includes(t)));
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const can = (tab: string) => role === "admin" || tabs.includes(tab);
  return { role, isAdmin: role === "admin", isStaff: !!role, can, tabs, loading };
}
