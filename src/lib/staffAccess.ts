export const STAFF_ROLES = ["admin", "waiter", "kitchen", "bar", "receptionist"] as const;
export const ASSIGNABLE_ROLES = [...STAFF_ROLES, "user"] as const;
export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", waiter: "Waiter", kitchen: "Kitchen", bar: "Bar", receptionist: "Receptionist", user: "Guest", moderator: "Moderator",
};
export const ADMIN_ONLY_TABS = ["staff", "settings", "security", "audit", "content"];

export function primaryStaffRole(roles: string[]): string | null {
  return STAFF_ROLES.find((role) => roles.includes(role)) ?? null;
}

export function allowedStaffTabs(role: string | null, tabs: unknown): string[] {
  if (!role || role === "admin" || !Array.isArray(tabs)) return [];
  return tabs.filter((tab): tab is string => typeof tab === "string" && !ADMIN_ONLY_TABS.includes(tab));
}

export function staffCanOpen(role: string | null, tabs: string[], tab: string): boolean {
  return role === "admin" || (!!role && !ADMIN_ONLY_TABS.includes(tab) && tabs.includes(tab));
}