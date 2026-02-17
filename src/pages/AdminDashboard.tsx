import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, ShoppingCart, Receipt, BedDouble, UtensilsCrossed,
  Settings, Users, Tag, ChefHat, Wine, LogOut, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminInvoices from "@/components/admin/AdminInvoices";
import AdminRooms from "@/components/admin/AdminRooms";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminTables from "@/components/admin/AdminTables";
import AdminPromotions from "@/components/admin/AdminPromotions";
import AdminSettings from "@/components/admin/AdminSettings";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "invoices", label: "Invoices & Billing", icon: Receipt },
  { key: "rooms", label: "Rooms", icon: BedDouble },
  { key: "products", label: "Menu Products", icon: UtensilsCrossed },
  { key: "tables", label: "Tables", icon: BarChart3 },
  { key: "promotions", label: "Promotions", icon: Tag },
  { key: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r) => r.role);
      if (roles.includes("admin") || roles.includes("moderator")) {
        setIsAdmin(true);
      } else {
        navigate("/dashboard");
      }
      setChecking(false);
    };
    checkRole();
  }, [user, authLoading, navigate]);

  if (authLoading || checking) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return null;

  const setTab = (key: string) => setSearchParams({ tab: key });

  const renderContent = () => {
    switch (activeTab) {
      case "orders": return <AdminOrders />;
      case "invoices": return <AdminInvoices />;
      case "rooms": return <AdminRooms />;
      case "products": return <AdminProducts />;
      case "tables": return <AdminTables />;
      case "promotions": return <AdminPromotions />;
      case "settings": return <AdminSettings />;
      default: return <AdminOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarContent>
            <div className="p-4 border-b border-sidebar-border">
              <h2 className="font-serif text-lg font-bold text-sidebar-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground font-sans">Gorilla Trekking GH</p>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tabs.map((tab) => (
                    <SidebarMenuItem key={tab.key}>
                      <SidebarMenuButton
                        onClick={() => setTab(tab.key)}
                        isActive={activeTab === tab.key}
                        className="cursor-pointer"
                      >
                        <tab.icon className="mr-2 h-4 w-4" />
                        <span>{tab.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate("/kitchen")} className="cursor-pointer">
                      <ChefHat className="mr-2 h-4 w-4" /><span>Kitchen Screen</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate("/bar")} className="cursor-pointer">
                      <Wine className="mr-2 h-4 w-4" /><span>Bar Screen</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-4">
              <Button variant="outline" size="sm" className="w-full font-sans gap-2" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border h-14 flex items-center px-6 gap-4">
            <SidebarTrigger />
            <h1 className="font-serif text-lg font-semibold text-foreground capitalize">{activeTab}</h1>
          </header>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
