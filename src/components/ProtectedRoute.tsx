import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCv?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireCv = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: isRoleLoading } = useIsAdmin();

  if (loading || (requireAdmin && user && isRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if ((requireAdmin && !isAdmin) || (requireCv && !user.canCv)) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <>{children}</>;
}
