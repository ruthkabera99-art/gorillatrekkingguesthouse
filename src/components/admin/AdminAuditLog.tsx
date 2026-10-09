import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Download, Printer } from "lucide-react";
import { format, subDays } from "date-fns";

type AuditRow = {
  id: string; table_name: string; record_id: string | null; action: string;
  actor_id: string | null; actor_role: string | null; old_data: any; new_data: any;
  changed_fields: string[] | null; created_at: string;
};
type SmsRow = {
  id: string; booking_id: string | null; template: string | null; recipient: string | null;
  status: string; error: string | null; provider_sid: string | null; created_at: string;
};

const LABEL: Record<string, string> = {
  status: "Status", total_price: "Room price", total: "Order total", check_in: "Check-in", check_out: "Check-out",
  quantity: "Quantity", unit_price: "Unit price", payment_status: "Payment", payment_method: "Payment method",
  payment_reference: "Payment ref", paid_at: "Paid at", guest_name: "Guest", guest_phone: "Phone",
  special_requests: "Special requests", assigned_waiter: "Waiter", assigned_waiter_id: "Waiter account",
  notes: "Notes", note: "Item note", guests_adults: "Adults", guests_children: "Children", room_id: "Room",
};
const TABLE: Record<string, string> = { bookings: "Booking", orders: "Order", order_items: "Order item" };
const money = new Set(["total_price", "total", "unit_price"]);
const show = (k: string, v: unknown) => {
  if (v === null || v === undefined || v === "") return "—";
  if (money.has(k)) return `RWF ${Number(v).toLocaleString()}`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).replace(/_/g, " ");
};
const who = (r: AuditRow) => {
  const n = r.new_data || r.old_data || {};
  return n.guest_name || (n.source_type === "table" ? `Table ${n.source_id}` : n.source_type === "room" ? "Room service" : "");
};
const describe = (r: AuditRow) => {
  const t = TABLE[r.table_name] || r.table_name;
  const n = r.new_data || {};
  if (r.action === "INSERT") {
    if (r.table_name === "order_items") return `Item added · qty ${n.quantity} @ ${show("unit_price", n.unit_price)}`;
    if (r.table_name === "bookings") return `Booking created · ${n.check_in} → ${n.check_out} · ${show("total_price", n.total_price)}`;
    return `${t} created`;
  }
  if (r.action === "DELETE") return `${t} deleted`;
  if (r.changed_fields?.includes("status")) return `${t} status: ${show("status", r.old_data?.status)} → ${show("status", n.status)}`;
  if (r.changed_fields?.includes("payment_status")) return `Payment: ${show("x", r.old_data?.payment_status)} → ${show("x", n.payment_status)}`;
  return `${t} updated`;
};
const statusVariant = (s: string) => (s === "sent" ? "default" : s === "skipped" ? "secondary" : "destructive") as any;

const AdminAuditLog = () => {
  const [view, setView] = useState<"audit" | "sms">("audit");
  const [table, setTable] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const src = view === "audit" ? "audit_log" : "sms_logs";
    let q = (supabase as any).from(src).select("*")
      .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false }).limit(1000);
    if (view === "audit" && table !== "all") q = q.eq("table_name", table);
    if (view === "audit" && action !== "all") q = q.eq("action", action);
    const { data } = await q;
    view === "audit" ? setRows(data || []) : setSms(data || []);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [view, table, action, from, to]);

  const s = search.trim().toLowerCase();
  const shown = useMemo(() => rows.filter((r) => !s ||
    [r.record_id, who(r), describe(r), r.actor_role].some((v) => v?.toLowerCase().includes(s))), [rows, s]);
  const shownSms = sms.filter((m) => !s || [m.booking_id, m.recipient, m.template, m.status].some((v) => v?.toLowerCase().includes(s)));

  const stats = useMemo(() => ({
    total: shown.length,
    created: shown.filter((r) => r.action === "INSERT").length,
    updated: shown.filter((r) => r.action === "UPDATE").length,
    deleted: shown.filter((r) => r.action === "DELETE").length,
    byRole: Object.entries(shown.reduce((a: Record<string, number>, r) => { const k = r.actor_role || "system"; a[k] = (a[k] || 0) + 1; return a; }, {})),
  }), [shown]);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = view === "audit"
      ? [["Date", "Type", "Action", "Description", "Guest/Source", "By role", "By user", "Record", "Changes"],
        ...shown.map((r) => [format(new Date(r.created_at), "yyyy-MM-dd HH:mm"), TABLE[r.table_name] || r.table_name, r.action, describe(r), who(r),
          r.actor_role || "system", r.actor_id || "", r.record_id || "",
          (r.changed_fields || []).map((f) => `${LABEL[f] || f}: ${show(f, r.old_data?.[f])} -> ${show(f, r.new_data?.[f])}`).join("; ")])]
      : [["Date", "Status", "Booking", "Recipient", "Template", "Details"],
        ...shownSms.map((m) => [format(new Date(m.created_at), "yyyy-MM-dd HH:mm"), m.status, m.booking_id, m.recipient, m.template, m.error || m.provider_sid])];
    const blob = new Blob([lines.map((l) => l.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${view === "audit" ? "history" : "sms"}-report-${from}-to-${to}.csv`;
    a.click();
  };

  const printReport = () => {
    const html = `<!doctype html><html><head><title>History report</title><style>
body{font-family:Arial,sans-serif;font-size:11px;padding:16px;color:#000}h1{font-size:16px;margin:0}table{width:100%;border-collapse:collapse;margin-top:10px}
td,th{border:1px solid #ccc;padding:4px;text-align:left;vertical-align:top}th{background:#eee}</style></head><body>
<h1>Gorilla Trekking Guest House — Movement History Report</h1>
<p>${from} to ${to} · ${stats.total} entries · ${stats.created} created · ${stats.updated} changed · ${stats.deleted} deleted · Printed ${new Date().toLocaleString()}</p>
<table><tr><th>Date</th><th>Type</th><th>What happened</th><th>Guest/Source</th><th>By</th><th>Changes</th></tr>
${shown.map((r) => `<tr><td>${format(new Date(r.created_at), "dd MMM yyyy HH:mm")}</td><td>${TABLE[r.table_name] || r.table_name}</td><td>${describe(r)}</td><td>${who(r)}</td><td>${r.actor_role || "system"}</td><td>${(r.changed_fields || []).map((f) => `${LABEL[f] || f}: ${show(f, r.old_data?.[f])} → ${show(f, r.new_data?.[f])}`).join("<br>")}</td></tr>`).join("")}
</table></body></html>`.replace(/<script/gi, "");
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;width:0;height:0;border:0";
    document.body.appendChild(f);
    f.contentWindow!.document.write(html); f.contentWindow!.document.close();
    setTimeout(() => { f.contentWindow!.print(); setTimeout(() => f.remove(), 1000); }, 250);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={view === "audit" ? "default" : "outline"} onClick={() => setView("audit")}>Movement history</Button>
        <Button size="sm" variant={view === "sms" ? "default" : "outline"} onClick={() => setView("sms")}>SMS delivery</Button>
      </div>

      <Card><CardContent className="p-4 flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted-foreground">From<Input type="date" className="h-9" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-muted-foreground">To<Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {view === "audit" && (<>
          <div className="flex gap-1 flex-wrap">{["all", "bookings", "orders", "order_items"].map((t) => (
            <Button key={t} size="sm" variant={table === t ? "secondary" : "ghost"} onClick={() => setTable(t)}>{t === "all" ? "All" : TABLE[t] + "s"}</Button>))}</div>
          <div className="flex gap-1 flex-wrap">{[["all", "Any action"], ["INSERT", "Created"], ["UPDATE", "Changed"], ["DELETE", "Deleted"]].map(([k, l]) => (
            <Button key={k} size="sm" variant={action === k ? "secondary" : "ghost"} onClick={() => setAction(k)}>{l}</Button>))}</div>
        </>)}
        <Input className="max-w-xs h-9" placeholder="Search guest, table, ID, role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={exportCsv}><Download className="h-4 w-4" /> Excel (CSV)</Button>
        {view === "audit" && <Button size="sm" variant="outline" className="gap-1" onClick={printReport}><Printer className="h-4 w-4" /> Print report</Button>}
      </CardContent></Card>

      {view === "audit" ? (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["Total entries", stats.total], ["Created", stats.created], ["Changed", stats.updated], ["Deleted", stats.deleted]].map(([l, v]) => (
            <Card key={l as string}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold text-foreground">{v}</p></CardContent></Card>
          ))}
        </div>
        {stats.byRole.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm"><span className="text-muted-foreground">By who:</span>
            {stats.byRole.map(([r, n]) => <Badge key={r} variant="outline" className="capitalize">{r}: {n}</Badge>)}</div>
        )}
        <Card>
          <CardHeader><CardTitle className="text-lg">Bookings & orders — every movement</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {shown.length === 0 && <p className="text-sm text-muted-foreground">No entries for these dates.</p>}
            {shown.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}</span>
                  <Badge variant="outline">{TABLE[r.table_name] || r.table_name}</Badge>
                  <Badge variant={r.action === "DELETE" ? "destructive" : r.action === "INSERT" ? "default" : "secondary"}>
                    {r.action === "INSERT" ? "Created" : r.action === "UPDATE" ? "Changed" : "Deleted"}</Badge>
                  <span className="font-medium text-foreground">{describe(r)}</span>
                  {who(r) && <span className="text-muted-foreground">· {who(r)}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">by <span className="capitalize font-medium">{r.actor_role || "system"}</span> · #{r.record_id?.slice(0, 8)}</span>
                </div>
                {r.action === "UPDATE" && r.changed_fields && (
                  <div className="mt-2 grid gap-1">
                    {r.changed_fields.map((f) => (
                      <div key={f} className="text-xs break-all">
                        <span className="font-semibold">{LABEL[f] || f}</span>: <span className="text-destructive line-through">{show(f, r.old_data?.[f])}</span> → <span className="text-primary font-medium">{show(f, r.new_data?.[f])}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </>) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">SMS delivery attempts</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {shownSms.length === 0 ? <p className="text-sm text-muted-foreground">No SMS attempts for these dates.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Time</th><th className="pr-3">Status</th><th className="pr-3">Booking</th>
                  <th className="pr-3">Recipient</th><th className="pr-3">Template</th><th>Details</th></tr></thead>
                <tbody>
                  {shownSms.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{format(new Date(m.created_at), "dd MMM yyyy HH:mm")}</td>
                      <td className="pr-3"><Badge variant={statusVariant(m.status)}>{m.status}</Badge></td>
                      <td className="pr-3 font-mono text-xs">{m.booking_id?.slice(0, 8)}</td>
                      <td className="pr-3">{m.recipient || "—"}</td>
                      <td className="pr-3">{m.template}</td>
                      <td className="text-xs text-muted-foreground break-all">{m.error || m.provider_sid || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAuditLog;
