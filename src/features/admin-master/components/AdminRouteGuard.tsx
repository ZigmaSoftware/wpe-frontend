import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

const AdminRouteGuard = ({ screenCode, action = "list" }: { screenCode: string; action?: "add" | "update" | "list" | "delete" | "view" | "print" }) => {
  const { can, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!can(screenCode, action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRouteGuard;
