import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryStaffRole, allowedStaffTabs, staffCanOpen } from "@/lib/staffAccess";
export { STAFF_ROLES, ROLE_LABELS, ADMIN_ONLY_TABS } from "@/lib/staffAccess";

/** Current user's staff role + which admin pages it can open */
export function useStaffRole() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<{ userId: string | null; role: string | null; tabs: string[]; loading: boolean; error: string }>({ userId: null, role: null, tabs: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setState({ userId: null, role: null, tabs: [], loading: false, error: "" }); return; }
    let active = true;
    let request = 0;
    const load = async () => {
      const current = ++request;
      setState((previous) => previous.userId === userId && !previous.loading && !previous.error
        ? previous
        : { userId, role: null, tabs: [], loading: true, error: "" });
      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        if (error) throw error;
        const role = primaryStaffRole((data || []).map((row) => row.role));
        let tabs: string[] = [];
        if (role && role !== "admin") {
          const { data: permissions, error: permissionError } = await supabase.from("role_permissions").select("tabs").eq("role", role as "waiter" | "kitchen" | "bar" | "receptionist").maybeSingle();
          if (permissionError) throw permissionError;
          tabs = allowedStaffTabs(role, permissions?.tabs);
        }
        if (active && current === request) setState({ userId, role, tabs, loading: false, error: "" });
      } catch {
        if (active && current === request) setState({ userId, role: null, tabs: [], loading: false, error: "Could not check your staff access. Check your connection and try again." });
      }
    };
    void load();
    window.addEventListener("focus", load);
    window.addEventListener("staff-access-changed", load);
    return () => { active = false; window.removeEventListener("focus", load); window.removeEventListener("staff-access-changed", load); };
  }, [userId, authLoading, attempt]);

  const current = !authLoading && state.userId === userId;
  const role = current ? state.role : null;
  const tabs = current ? state.tabs : [];
  const loading = authLoading || !current || state.loading;
  const can = (tab: string) => !loading && staffCanOpen(role, tabs, tab);
  return { role, isAdmin: role === "admin", isStaff: !!role, can, tabs, loading, error: current ? state.error : "", retry };
}
