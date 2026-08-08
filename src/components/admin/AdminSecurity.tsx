import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PROJECT_REF = "wmsxhszqnlvvhtijnehi";
const AUTH_POLICY_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/policies`;
const AUTH_PROVIDERS_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers`;

interface SecuritySettings {
  leaked_password_protection: boolean;
  last_verified_at: string | null;
}

const defaults: SecuritySettings = { leaked_password_protection: false, last_verified_at: null };

const AdminSecurity = () => {
  const [settings, setSettings] = useState<SecuritySettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*").eq("key", "security").maybeSingle();
    if (data?.value) setSettings({ ...defaults, ...(data.value as any) });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (next: SecuritySettings) => {
    setSaving(true);
    setSettings(next);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "security", value: next as any, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Security status updated");
  };

  const enabled = settings.leaked_password_protection;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              {enabled ? <ShieldCheck className="h-5 w-5 text-primary" /> : <ShieldAlert className="h-5 w-5 text-destructive" />}
              Leaked Password Protection
            </CardTitle>
            <p className="text-sm text-muted-foreground font-sans">
              Blocks guests and staff from choosing passwords found in known data breaches (HaveIBeenPwned).
            </p>
          </div>
          <Badge variant={enabled ? "default" : "destructive"} className="shrink-0">
            {loading ? "Checking…" : enabled ? "Enabled" : "Not enabled"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-sans text-foreground">
              This setting lives in the Supabase dashboard and can only be toggled there.
            </p>
            <ol className="text-sm font-sans text-muted-foreground list-decimal pl-5 space-y-1">
              <li>Open Authentication → Providers → Email in the Supabase dashboard.</li>
              <li>Turn on <span className="text-foreground">“Prevent use of leaked passwords”</span>.</li>
              <li>Come back here and mark it as enabled so the team can see the current status.</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" className="font-sans gap-2">
                <a href={AUTH_PROVIDERS_URL} target="_blank" rel="noopener noreferrer">
                  Open password protection setting <ExternalLink size={14} />
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="font-sans gap-2">
                <a href={AUTH_POLICY_URL} target="_blank" rel="noopener noreferrer">
                  Auth policies <ExternalLink size={14} />
                </a>
              </Button>
              <Button size="sm" variant="ghost" className="font-sans gap-2" onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh status
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-sans font-medium text-foreground">Mark as enabled in Supabase</p>
              <p className="text-xs font-sans text-muted-foreground">
                {settings.last_verified_at
                  ? `Last confirmed ${new Date(settings.last_verified_at).toLocaleString()}`
                  : "Never confirmed"}
              </p>
            </div>
            <Switch
              checked={enabled}
              disabled={saving || loading}
              onCheckedChange={(checked) =>
                save({ leaked_password_protection: checked, last_verified_at: checked ? new Date().toISOString() : null })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
