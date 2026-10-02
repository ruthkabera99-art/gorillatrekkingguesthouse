import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

type AuditRow = {
  id: string; table_name: string; record_id: string | null; action: string;
  actor_id: string | null; actor_role: string | null; old_data: any; new_data: any;
  changed_fields: string[] | null; created_at: string;
};
type SmsRow = {
  id: string; booking_id: string | null; template: string | null; recipient: string | null;
  status: string; error: string | null; provider_sid: string | null; created_at: string;
};

const fmtVal = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
const statusVariant = (s: string) => (s === "sent" ? "default" : s === "skipped" ? "secondary" : "destructive") as any;

const AdminAuditLog = () => {
  const [view, setView] = useState<"audit" | "sms">("audit");
  const [table, setTable] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    if (view === "audit") {
      let q = (supabase as any).from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (table !== "all") q = q.eq("table_name", table);
      if (search.trim()) q = q.eq("record_id", search.trim());
      const { data } = await q;
      setRows((data as AuditRow[]) || []);
    } else {
      let q = (supabase as any).from("sms_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (search.trim()) q = q.eq("booking_id", search.trim());
      const { data } = await q;
      setSms((data as SmsRow[]) || []);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [view, table]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={view === "audit" ? "default" : "outline"} onClick={() => setView("audit")}>Change history</Button>
        <Button size="sm" variant={view === "sms" ? "default" : "outline"} onClick={() => setView("sms")}>SMS delivery</Button>
        {view === "audit" && ["all", "bookings", "orders", "order_items"].map((t) => (
          <Button key={t} size="sm" variant={table === t ? "secondary" : "ghost"} onClick={() => setTable(t)}>{t.replace("_", " ")}</Button>
        ))}
        <Input className="max-w-xs h-9" placeholder={view === "audit" ? "Filter by record ID" : "Filter by booking ID"}
          value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </div>

      {view === "audit" ? (
        <Card>
          <CardHeader><CardTitle className="text-lg">Booking & order change history</CardTitle>
            <p className="text-sm text-muted-foreground">Values shown are what was finally saved, after server-side protections ran. Guest entries that never changed price or dates confirm the protections are working.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
            {rows.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{r.table_name}</Badge>
                  <Badge variant={r.action === "DELETE" ? "destructive" : r.action === "INSERT" ? "default" : "secondary"}>{r.action}</Badge>
                  <Badge variant={r.actor_role === "admin" ? "default" : "outline"}>{r.actor_role || "system"}</Badge>
                  <span className="text-muted-foreground">{format(new Date(r.created_at), "PP p")}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">record {r.record_id?.slice(0, 8)} · by {r.actor_id?.slice(0, 8) || "—"}</span>
                </div>
                {r.action === "UPDATE" && r.changed_fields && (
                  <div className="mt-2 space-y-1">
                    {r.changed_fields.map((f) => (
                      <div key={f} className="font-mono text-xs break-all">
                        <span className="font-semibold">{f}</span>: <span className="text-destructive line-through">{fmtVal(r.old_data?.[f])}</span> → <span className="text-primary">{fmtVal(r.new_data?.[f])}</span>
                      </div>
                    ))}
                  </div>
                )}
                {r.action === "INSERT" && r.new_data && (
                  <div className="mt-2 font-mono text-xs text-muted-foreground break-all">
                    {["status", "total_price", "total", "check_in", "check_out", "quantity", "unit_price", "payment_status"]
                      .filter((k) => k in r.new_data).map((k) => `${k}=${fmtVal(r.new_data[k])}`).join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">SMS delivery attempts</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {sms.length === 0 ? <p className="text-sm text-muted-foreground">No SMS attempts yet.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Time</th><th className="pr-3">Status</th><th className="pr-3">Booking</th>
                  <th className="pr-3">Recipient</th><th className="pr-3">Template</th><th>Details</th></tr></thead>
                <tbody>
                  {sms.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{format(new Date(s.created_at), "PP p")}</td>
                      <td className="pr-3"><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                      <td className="pr-3 font-mono text-xs">{s.booking_id?.slice(0, 8)}</td>
                      <td className="pr-3">{s.recipient || "—"}</td>
                      <td className="pr-3">{s.template}</td>
                      <td className="text-xs text-muted-foreground break-all">{s.error || s.provider_sid || ""}</td>
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
