import { beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ getUser: vi.fn(), refresh: vi.fn(), invoke: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: api.getUser, refreshSession: api.refresh }, functions: { invoke: api.invoke }, rpc: api.rpc } }));
import { invokeAdminFunction, setStaffRole } from "./adminRequest";
describe("administrator requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getUser.mockResolvedValue({ data: { user: { id: "administrator" } }, error: null });
    api.rpc.mockResolvedValue({ data: null, error: null });
  });
  it("uses a single atomic server role change", async () => {
    await setStaffRole("staff-member", "admin");
    expect(api.rpc).toHaveBeenCalledExactlyOnceWith("admin_set_user_role", { _user_id: "staff-member", _role: "admin" });
  });
  it("does not let an administrator remove their own access", async () => {
    await expect(setStaffRole("administrator", "user")).rejects.toThrow("own role");
    expect(api.rpc).not.toHaveBeenCalled();
  });
  it("surfaces role-change rejection instead of claiming success", async () => {
    api.rpc.mockResolvedValue({ data: null, error: new Error("Access denied") });
    await expect(setStaffRole("staff-member", "admin")).rejects.toThrow("Access denied");
  });
  it("does not call staff services while signed out", async () => {
    api.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(invokeAdminFunction("admin-list-users")).rejects.toThrow("Sign in");
    expect(api.invoke).not.toHaveBeenCalled();
  });
  it("reports a staff-service error returned in a successful HTTP response", async () => {
    api.invoke.mockResolvedValue({ data: { error: "Admin only" }, error: null });
    await expect(invokeAdminFunction("admin-list-users")).rejects.toThrow("Admin only");
  });
});