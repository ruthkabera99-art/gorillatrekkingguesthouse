import { supabase } from "@/integrations/supabase/client";

/** Server-verified session for administrator controls; RLS still decides access. */
export async function verifyAdminSession(expectedUserId?: string) {
  let result = await supabase.auth.getUser();
  if (result.error?.status === 401 || result.error?.code === "jwt_expired") {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw new Error("Your sign-in expired. Sign in again and retry.");
    result = await supabase.auth.getUser();
  }
  if (result.error) throw new Error("Could not verify your sign-in. Check your connection and retry.");
  if (!result.data.user) throw new Error("Sign in as an administrator to continue.");
  if (expectedUserId && result.data.user.id !== expectedUserId) throw new Error("Your signed-in account changed. Reload before continuing.");
  return result.data.user;
}

export async function invokeAdminFunction<T>(name: string, body?: unknown): Promise<T> {
  await verifyAdminSession();
  const { data, error } = await supabase.functions.invoke(name, body === undefined ? {} : { body });
  if (error || data?.error) {
    let message = data?.error || error?.message || "The request failed. Please retry.";
    if (error && "context" in error && error.context instanceof Response) {
      try { message = (await error.context.clone().json()).error || message; } catch { /* retain the original error */ }
    }
    throw new Error(message);
  }
  return data as T;
}

export async function setStaffRole(userId: string, role: "admin" | "waiter" | "kitchen" | "bar" | "receptionist" | "user") {
  const caller = await verifyAdminSession();
  if (caller.id === userId) throw new Error("You cannot change your own role here.");
  const { error } = await supabase.rpc("admin_set_user_role", { _user_id: userId, _role: role });
  if (error) throw error;
}