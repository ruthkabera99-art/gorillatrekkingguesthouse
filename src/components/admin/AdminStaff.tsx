import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Search, Loader2, Save, KeyRound, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { ROLE_LABELS, ADMIN_ONLY_TABS } from "@/hooks/useStaffRole";

const ASSIGNABLE = ["admin", "waiter", "kitchen", "bar", "receptionist", "user"];
const PERM_ROLES = ["waiter", "kitchen", "bar", "receptionist"];
const PAGES: { key: string; label: string }[] = [
  { key: "overview", label: "Overview" }, { key: "orders", label: "Orders" }, { key: "kitchen", label: "Kitchen" },
  { key: "bar", label: "Bar" }, { key: "invoices", label: "Billing" }, { key: "rooms", label: "Rooms" },
  { key: "bookings", label: "Bookings" }, { key: "products", label: "Menu Products" }, { key: "tables", label: "Tables" },
  { key: "promotions", label: "Promotions" },
];

type StaffUser = { user_id: string; email: string; phone: string; full_name: string; roles: string[]; banned_until: string | null; created_at: string };

const call = async (body: any) => {
  const { data, error } = await supabase.functions.invoke("admin-manage-staff", { body });
  if (error || data?.error) {
    let msg = data?.error || error?.message;
    try { msg = (await (error as any)?.context?.json())?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
};

const AdminStaff = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("staff");
  const [busy, setBusy] = useState<string | null>(null);
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [savingPerms, setSavingPerms] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "waiter" });
  const [pwDialog, setPwDialog] = useState<{ id: string; name: string } | null>(null);
  const [newPw, setNewPw] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: p }] = await Promise.all([
      supabase.functions.invoke("admin-list-users"),
      (supabase as any).from("role_permissions").select("role, tabs"),
    ]);
    if (error) toast.error("Couldn't load staff list");
    setUsers(data?.users || []);
    setPerms(Object.fromEntries((p || []).map((r: any) => [r.role, r.tabs || []])));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const run = async (id: string, body: any, ok: string) => {
    setBusy(id);
    try { await call(body); toast.success(ok); await load(); }
    catch (e: any) { toast.error(e.message); }
    setBusy(null);
  };

  const createStaff = async () => {
    if (!form.full_name.trim() || (!form.email.trim() && !form.phone.trim())) return toast.error("Enter a name and an email or phone");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy("new");
    try {
      await call({ action: "create", ...form });
      toast.success(`${form.full_name} added as ${ROLE_LABELS[form.role]}`);
      setAddOpen(false);
      setForm({ full_name: "", email: "", phone: "", password: "", role: "waiter" });
      await load();
    } catch (e: any) { toast.error(e.message); }
    setBusy(null);
  };

  const togglePerm = (role: string, tab: string) =>
    setPerms((p) => {
      const cur = p[role] || [];
      return { ...p, [role]: cur.includes(tab) ? cur.filter((t) => t !== tab) : [...cur, tab] };
    });

  const savePerms = async () => {
    setSavingPerms(true);
    const rows = PERM_ROLES.map((role) => ({ role, tabs: (perms[role] || []).filter((t) => !ADMIN_ONLY_TABS.includes(t)) }));
    const { error } = await (supabase as any).from("role_permissions").upsert(rows, { onConflict: "role" });
    setSavingPerms(false);
    if (error) toast.error(error.message); else toast.success("Page access saved — staff see it on their next page load");
  };

  const roleOf = (u: StaffUser) => u.roles.includes("admin") ? "admin" : u.roles.find((r) => r !== "user") || "user";
  const shown = users.filter((u) => {
    const r = roleOf(u);
    if (roleFilter === "staff" && r === "user") return false;
    if (roleFilter !== "staff" && roleFilter !== "all" && r !== roleFilter) return false;
    const q = search.toLowerCase();
    return !q || [u.full_name, u.email, u.phone].some((v) => (v || "").toLowerCase().includes(q));
  });
  const isOff = (u: StaffUser) => !!u.banned_until && new Date(u.banned_until) > new Date();
  const loginOf = (u: StaffUser) => u.email?.endsWith("@whatsapp.guest") ? `📱 ${u.email.split("@")[0]}` : u.email;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="font-serif">Staff accounts</CardTitle>
            <CardDescription className="font-sans">Add staff, change their role, reset passwords, or turn accounts off.</CardDescription>
          </div>
          <Button className="font-sans gap-2" onClick={() => setAddOpen(true)}><UserPlus size={16} />Add staff</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 font-sans" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44 font-sans"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">All staff</SelectItem>
                <SelectItem value="all">Everyone (incl. guests)</SelectItem>
                {ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : shown.length === 0 ? (
            <p className="text-center text-muted-foreground font-sans py-8">No accounts match.</p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg">
              {shown.map((u) => {
                const self = u.user_id === user?.id;
                const r = roleOf(u);
                const off = isOff(u);
                return (
                  <div key={u.user_id} className="p-3 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-foreground truncate">
                        {u.full_name || "No name"} {self && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans truncate">{loginOf(u)}{u.phone && !u.email?.endsWith("@whatsapp.guest") ? ` · ${u.phone}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {off ? <Badge variant="destructive">Off</Badge> : <Badge variant="secondary">Active</Badge>}
                      <Select value={r} disabled={self || busy === u.user_id}
                        onValueChange={(v) => run(u.user_id, { action: "set_role", user_id: u.user_id, role: v }, `Role changed to ${ROLE_LABELS[v]}`)}>
                        <SelectTrigger className="w-36 h-8 font-sans text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{ASSIGNABLE.map((x) => <SelectItem key={x} value={x}>{ROLE_LABELS[x]}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={self} onClick={() => { setNewPw(""); setPwDialog({ id: u.user_id, name: u.full_name }); }}>
                        <KeyRound size={12} />Password
                      </Button>
                      {off ? (
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={self || busy === u.user_id}
                          onClick={() => run(u.user_id, { action: "enable", user_id: u.user_id }, "Account turned on")}><CheckCircle2 size={12} />Turn on</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={self || busy === u.user_id}
                          onClick={() => confirm(`Turn off ${u.full_name || "this account"}? They won't be able to sign in. History is kept.`) && run(u.user_id, { action: "disable", user_id: u.user_id }, "Account turned off")}><Ban size={12} />Turn off</Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 text-destructive" disabled={self || busy === u.user_id} aria-label="Delete account"
                        onClick={() => confirm(`Permanently delete ${u.full_name || "this account"}?`) && run(u.user_id, { action: "delete", user_id: u.user_id }, "Account deleted")}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Page access by role</CardTitle>
          <CardDescription className="font-sans">Tick which pages each role can open. Admins can open everything. Staff, Settings, Security and Audit stay admin-only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Page</th>
                  {PERM_ROLES.map((r) => <th key={r} className="py-2 px-2 font-medium text-center">{ROLE_LABELS[r]}</th>)}
                </tr>
              </thead>
              <tbody>
                {PAGES.map((p) => (
                  <tr key={p.key} className="border-t border-border">
                    <td className="py-2 pr-4 text-foreground">{p.label}</td>
                    {PERM_ROLES.map((r) => (
                      <td key={r} className="py-2 px-2 text-center">
                        <Checkbox checked={(perms[r] || []).includes(p.key)} onCheckedChange={() => togglePerm(r, p.key)} aria-label={`${ROLE_LABELS[r]} can open ${p.label}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            What each role can change is also protected on the server: waiters only handle their own orders, Kitchen only food, Bar only drinks, Receptionist bookings and billing.
          </p>
          <Button onClick={savePerms} disabled={savingPerms} className="font-sans gap-2">
            {savingPerms ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Save page access
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Add staff member</DialogTitle></DialogHeader>
          <div className="space-y-3 font-sans">
            <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Jean Bosco" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="optional if phone given" /></div>
            <div><Label>Phone / WhatsApp</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0788123456" /></div>
            <div><Label>Password (min 8)</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASSIGNABLE.filter((r) => r !== "user").map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">If there's no email, staff sign in with the phone number (WhatsApp option) and this password.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={createStaff} disabled={busy === "new"}>{busy === "new" && <Loader2 size={14} className="animate-spin mr-1" />}Create account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwDialog} onOpenChange={(o) => !o && setPwDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">New password for {pwDialog?.name || "staff"}</DialogTitle></DialogHeader>
          <Input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" className="font-sans" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialog(null)}>Cancel</Button>
            <Button disabled={newPw.length < 8 || busy === pwDialog?.id}
              onClick={async () => { const id = pwDialog!.id; await run(id, { action: "reset_password", user_id: id, password: newPw }, "Password updated"); setPwDialog(null); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaff;
