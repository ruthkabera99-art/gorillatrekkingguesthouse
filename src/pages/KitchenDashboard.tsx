import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffRole } from "@/hooks/useStaffRole";
import AdminKitchen from "@/components/admin/AdminKitchen";

const KitchenDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { can, loading: roleLoading, error, retry } = useStaffRole();
  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (error) return <div role="alert" className="p-6 space-y-3"><p className="text-destructive">{error}</p><Button onClick={retry}>Try again</Button></div>;
  if (!can("kitchen")) return <Navigate to="/dashboard" replace />;
  return <div className="min-h-screen bg-background"><header className="border-b border-border bg-card"><div className="container mx-auto px-4 py-4 flex items-center gap-3"><Button asChild variant="outline" size="icon"><Link to="/admin" aria-label="Back to staff panel"><ArrowLeft size={18} /></Link></Button><ChefHat className="text-primary" /><h1 className="font-serif text-xl">Kitchen Dashboard</h1></div></header><main className="container mx-auto p-4"><AdminKitchen /></main></div>;
};

export default KitchenDashboard;
