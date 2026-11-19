import { describe, expect, it } from "vitest";
import { allowedStaffTabs, primaryStaffRole, staffCanOpen } from "./staffAccess";

describe("staff access rules", () => {
  it("recognizes administrators even when the guest role is listed first", () => {
    expect(primaryStaffRole(["user", "admin"])).toBe("admin");
  });
  it("gives administrators access to every management page", () => {
    for (const tab of ["overview", "orders", "kitchen", "bar", "invoices", "rooms", "bookings", "products", "tables", "promotions", "staff", "audit", "security", "content", "settings"]) {
      expect(staffCanOpen("admin", [], tab)).toBe(true);
    }
  });
  it("never grants guest accounts management access", () => {
    expect(primaryStaffRole(["user"])).toBeNull();
    expect(staffCanOpen(null, ["orders"], "orders")).toBe(false);
  });
  it("keeps Website Design administrator-only even with a configured staff permission", () => {
    expect(allowedStaffTabs("waiter", ["orders", "content", "settings", "staff", "audit", "security"])).toEqual(["orders"]);
    expect(staffCanOpen("waiter", ["content"], "content")).toBe(false);
  });
  it("only opens the pages assigned to a staff role", () => {
    expect(staffCanOpen("kitchen", ["kitchen"], "kitchen")).toBe(true);
    expect(staffCanOpen("kitchen", ["kitchen"], "bar")).toBe(false);
  });
});