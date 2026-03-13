import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Bell, Palette, Users, Phone, Mail, MapPin, Globe, Save, Loader2 } from "lucide-react";

type SiteSettings = Record<string, any>;

const AdminSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeSection, setActiveSection] = useState("hotel");

  // Site settings
  const [hotelInfo, setHotelInfo] = useState<SiteSettings>({
    name: "", phone: "", email: "", address: "", currency: "RWF", description: ""
  });
  const [notifications, setNotifications] = useState<SiteSettings>({
    sms_on_booking_created: true,
    sms_on_booking_confirmed: true,
    sms_on_booking_cancelled: false,
    in_app_notifications: true,
    admin_phone: "",
  });
  const [branding, setBranding] = useState<SiteSettings>({
    primary_color: "#b8965a", logo_url: "", tagline: ""
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        if (data) setProfileForm({ full_name: data.full_name || "", phone: data.phone || "" });
      });
  }, [user]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: profiles } = await supabase.from("profiles").select("*");
      const merged = (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
      }));
      setUsers(merged);
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        data.forEach((row: any) => {
          if (row.key === "hotel_info") setHotelInfo(row.value);
          if (row.key === "notifications") setNotifications(row.value);
          if (row.key === "branding") setBranding(row.value);
        });
      }
    };
    loadSettings();
  }, []);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
    }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const changeUserRole = async (userId: string, currentRole: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", currentRole as any);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) toast.error(error.message);
    else {
      toast.success("Role updated");
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, roles: [newRole] } : u));
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    setSavingSettings(false);
    if (error) toast.error(error.message);
    else toast.success(`${key.replace("_", " ")} settings saved`);
  };

  const sections = [
    { key: "hotel", label: "Hotel Info", icon: Building2 },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "branding", label: "Theme & Branding", icon: Palette },
    { key: "users", label: "User Management", icon: Users },
    { key: "profile", label: "My Profile", icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <Button
            key={s.key}
            variant={activeSection === s.key ? "default" : "outline"}
            size="sm"
            className="font-sans gap-2 text-xs"
            onClick={() => setActiveSection(s.key)}
          >
            <s.icon size={14} />
            {s.label}
          </Button>
        ))}
      </div>

      {/* Hotel Info */}
      {activeSection === "hotel" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><Building2 size={18} /> Hotel Information</CardTitle>
            <CardDescription className="font-sans">Manage your hotel's public-facing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs flex items-center gap-1"><Building2 size={12} /> Hotel Name</Label>
                <Input value={hotelInfo.name || ""} onChange={e => setHotelInfo({ ...hotelInfo, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs flex items-center gap-1"><Phone size={12} /> Phone</Label>
                <Input value={hotelInfo.phone || ""} onChange={e => setHotelInfo({ ...hotelInfo, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs flex items-center gap-1"><Mail size={12} /> Email</Label>
                <Input value={hotelInfo.email || ""} onChange={e => setHotelInfo({ ...hotelInfo, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs flex items-center gap-1"><MapPin size={12} /> Address</Label>
                <Input value={hotelInfo.address || ""} onChange={e => setHotelInfo({ ...hotelInfo, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs flex items-center gap-1"><Globe size={12} /> Currency</Label>
                <Select value={hotelInfo.currency || "RWF"} onValueChange={v => setHotelInfo({ ...hotelInfo, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Description</Label>
              <Textarea value={hotelInfo.description || ""} onChange={e => setHotelInfo({ ...hotelInfo, description: e.target.value })} rows={3} />
            </div>
            <Button onClick={() => saveSetting("hotel_info", hotelInfo)} className="font-sans gap-2" disabled={savingSettings}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Hotel Info
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {activeSection === "notifications" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><Bell size={18} /> Notification Preferences</CardTitle>
            <CardDescription className="font-sans">Configure SMS and in-app notifications for bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Admin Phone (for receiving alerts)</Label>
              <Input
                placeholder="+250 7XX XXX XXX"
                value={notifications.admin_phone || ""}
                onChange={e => setNotifications({ ...notifications, admin_phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground font-sans">Phone number to receive admin SMS alerts</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-sans text-sm font-semibold text-foreground">Booking SMS Notifications</h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-foreground">New Booking Created</p>
                  <p className="text-xs text-muted-foreground font-sans">Send SMS when a guest creates a booking</p>
                </div>
                <Switch
                  checked={notifications.sms_on_booking_created}
                  onCheckedChange={v => setNotifications({ ...notifications, sms_on_booking_created: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-foreground">Booking Confirmed</p>
                  <p className="text-xs text-muted-foreground font-sans">Send SMS when admin confirms a booking</p>
                </div>
                <Switch
                  checked={notifications.sms_on_booking_confirmed}
                  onCheckedChange={v => setNotifications({ ...notifications, sms_on_booking_confirmed: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-foreground">Booking Cancelled</p>
                  <p className="text-xs text-muted-foreground font-sans">Send SMS when a booking is cancelled</p>
                </div>
                <Switch
                  checked={notifications.sms_on_booking_cancelled}
                  onCheckedChange={v => setNotifications({ ...notifications, sms_on_booking_cancelled: v })}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-sm text-foreground">In-App Notifications</p>
                <p className="text-xs text-muted-foreground font-sans">Show toast notifications in admin dashboard</p>
              </div>
              <Switch
                checked={notifications.in_app_notifications}
                onCheckedChange={v => setNotifications({ ...notifications, in_app_notifications: v })}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground font-sans">
                💡 <strong>SMS Setup:</strong> To enable SMS notifications, connect your Twilio account in the project settings. SMS will be sent to the guest's phone number on file.
              </p>
            </div>

            <Button onClick={() => saveSetting("notifications", notifications)} className="font-sans gap-2" disabled={savingSettings}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Theme & Branding */}
      {activeSection === "branding" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><Palette size={18} /> Theme & Branding</CardTitle>
            <CardDescription className="font-sans">Customize the look and feel of your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primary_color || "#b8965a"}
                    onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                  />
                  <Input
                    value={branding.primary_color || ""}
                    onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                    className="flex-1"
                    placeholder="#b8965a"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Logo URL</Label>
                <Input
                  value={branding.logo_url || ""}
                  onChange={e => setBranding({ ...branding, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Tagline</Label>
              <Input
                value={branding.tagline || ""}
                onChange={e => setBranding({ ...branding, tagline: e.target.value })}
                placeholder="Your Gateway to Gorilla Trekking Adventures"
              />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border border-border" style={{ backgroundColor: branding.primary_color + "15" }}>
              <p className="text-xs text-muted-foreground font-sans mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {branding.logo_url && (
                  <img src={branding.logo_url} alt="Logo" className="w-10 h-10 rounded object-cover" />
                )}
                <div>
                  <p className="font-serif font-bold text-foreground" style={{ color: branding.primary_color }}>{hotelInfo.name || "Hotel Name"}</p>
                  <p className="text-xs text-muted-foreground font-sans">{branding.tagline || "Tagline"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-sans text-sm text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground font-sans">Currently active as default theme</p>
              </div>
              <span className="text-xs font-sans px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Active</span>
            </div>

            <Button onClick={() => saveSetting("branding", branding)} className="font-sans gap-2" disabled={savingSettings}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Branding
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      {activeSection === "users" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2"><Users size={18} /> User Management</CardTitle>
            <CardDescription className="font-sans">Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground font-sans">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <p className="font-sans font-medium text-foreground text-sm">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground font-sans">{u.phone || "No phone"}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-sans">{u.user_id.slice(0, 12)}...</p>
                    </div>
                    <Select value={u.roles[0] || "user"} onValueChange={v => changeUserRole(u.user_id, u.roles[0] || "user", v)}>
                      <SelectTrigger className="w-28 font-sans text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Profile */}
      {activeSection === "profile" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif">My Profile</CardTitle>
            <CardDescription className="font-sans">Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Full Name</Label>
              <Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Phone</Label>
              <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Email</Label>
              <Input value={user?.email || ""} disabled className="opacity-60" />
            </div>
            <Button onClick={updateProfile} className="font-sans gap-2"><Save size={14} /> Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-sm">System Info</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-xs font-sans text-muted-foreground">
          <p><strong className="text-foreground">Platform:</strong> Integrated Hotel & Restaurant System</p>
          <p><strong className="text-foreground">Version:</strong> 2.0.0</p>
          <p><strong className="text-foreground">SMS Provider:</strong> Twilio (Connect in project settings)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
