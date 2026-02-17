import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });

  // User management
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      if (data) setProfileForm({ full_name: data.full_name || "", phone: data.phone || "" });
    };
    load();
  }, [user]);

  useEffect(() => {
    const loadUsers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: profiles } = await supabase.from("profiles").select("*");
      // Merge
      const merged = (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
      }));
      setUsers(merged);
      setLoadingUsers(false);
    };
    loadUsers();
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
    // Delete existing, insert new
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", currentRole as any);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) toast.error(error.message);
    else {
      toast.success("Role updated");
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, roles: [newRole] } : u));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-card border border-border">
        <CardHeader><CardTitle className="font-serif">My Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="font-sans">Full Name</Label><Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
          <div><Label className="font-sans">Phone</Label><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div><Label className="font-sans">Email</Label><Input value={user?.email || ""} disabled className="opacity-60" /></div>
          <Button onClick={updateProfile} className="font-sans">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border">
        <CardHeader><CardTitle className="font-serif">User Management</CardTitle></CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-sans font-medium text-foreground text-sm">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground font-sans">{u.user_id}</p>
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

      <Card className="bg-card border border-border">
        <CardHeader><CardTitle className="font-serif">System Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm font-sans text-muted-foreground">
          <p><strong className="text-foreground">Hotel:</strong> Gorilla Trekking Guest House</p>
          <p><strong className="text-foreground">Currency:</strong> Rwandan Franc (RWF)</p>
          <p><strong className="text-foreground">Location:</strong> Musanze, Rwanda</p>
          <p><strong className="text-foreground">Platform:</strong> Integrated Hotel & Restaurant System</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
