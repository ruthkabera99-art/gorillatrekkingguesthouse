import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ roles: vi.fn(), permissions: vi.fn(), auth: { user: { id: "admin-a" } as { id: string } | null, loading: false } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => api.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: (table: string) => ({ select: () => ({ eq: () => table === "user_roles" ? api.roles() : { maybeSingle: api.permissions } }) }),
} }));
import { useStaffRole } from "./useStaffRole";

describe("staff role loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.auth = { user: { id: "admin-a" }, loading: false };
    api.roles.mockResolvedValue({ data: [{ role: "user" }, { role: "admin" }], error: null });
    api.permissions.mockResolvedValue({ data: { tabs: ["orders"] }, error: null });
  });
  it("distinguishes a role loading error from an account with no staff access and supports retry", async () => {
    api.roles.mockResolvedValueOnce({ data: null, error: new Error("Connection lost") });
    const hook = renderHook(useStaffRole);
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.error).not.toBe("");
    expect(hook.result.current.can("content")).toBe(false);
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.isAdmin).toBe(true));
    expect(hook.result.current.can("content")).toBe(true);
    expect(hook.result.current.error).toBe("");
    hook.unmount();
  });
  it("clears stale administrator access immediately on account change and ignores the old response", async () => {
    let resolveOld: (value: unknown) => void = () => undefined;
    api.roles.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    const hook = renderHook(useStaffRole);
    api.auth = { user: { id: "waiter-b" }, loading: false };
    api.roles.mockResolvedValue({ data: [{ role: "waiter" }], error: null });
    hook.rerender();
    expect(hook.result.current.can("settings")).toBe(false);
    await waitFor(() => expect(hook.result.current.role).toBe("waiter"));
    await act(async () => resolveOld({ data: [{ role: "admin" }], error: null }));
    expect(hook.result.current.role).toBe("waiter");
    expect(hook.result.current.can("settings")).toBe(false);
    hook.unmount();
  });
  it("does not reuse a previous staff member's pages after signing out", async () => {
    const hook = renderHook(useStaffRole);
    await waitFor(() => expect(hook.result.current.isAdmin).toBe(true));
    api.auth.user = null;
    hook.rerender();
    expect(hook.result.current.can("orders")).toBe(false);
    expect(hook.result.current.role).toBeNull();
    hook.unmount();
  });
  it("does not unmount the editor while refreshing the same account on focus", async () => {
    const hook = renderHook(useStaffRole);
    await waitFor(() => expect(hook.result.current.isAdmin).toBe(true));
    api.roles.mockImplementationOnce(() => new Promise(() => undefined));
    act(() => window.dispatchEvent(new Event("focus")));
    expect(hook.result.current.loading).toBe(false);
    expect(hook.result.current.can("content")).toBe(true);
    hook.unmount();
  });
});