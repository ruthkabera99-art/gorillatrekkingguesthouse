import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), listener: undefined as undefined | ((event: string, session: unknown) => void), signIn: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: auth.getSession,
  onAuthStateChange: (listener: typeof auth.listener) => { auth.listener = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
  signInWithPassword: auth.signIn,
} } }));
import { AuthProvider, useAuth } from "./AuthContext";
describe("administrator session restoration", () => {
  it("does not overwrite a newer successful login with an older session read", async () => {
    let resolveSession: (value: unknown) => void = () => undefined;
    auth.getSession.mockImplementation(() => new Promise((resolve) => { resolveSession = resolve; }));
    const hook = renderHook(useAuth, { wrapper: AuthProvider });
    act(() => auth.listener?.("SIGNED_IN", { user: { id: "administrator" } }));
    await act(async () => resolveSession({ data: { session: null } }));
    expect(hook.result.current.user?.id).toBe("administrator");
    expect(hook.result.current.loading).toBe(false);
    hook.unmount();
  });
  it("stops loading when session restoration fails", async () => {
    auth.getSession.mockRejectedValue(new Error("Unavailable"));
    const hook = renderHook(useAuth, { wrapper: AuthProvider });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.user).toBeNull();
    hook.unmount();
  });
});