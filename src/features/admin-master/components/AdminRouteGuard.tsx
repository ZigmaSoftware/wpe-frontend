import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

const AdminRouteGuard = ({
  screenCode,
  action = "list",
  children,
}: {
  screenCode: string;
  action?: "add" | "update" | "list" | "delete" | "view" | "print";
  children?: ReactNode;
}) => {
  const { can, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!can(screenCode, action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRouteGuard;
