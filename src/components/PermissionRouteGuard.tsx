import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ErrorState } from "@/components/QueryState";
import type { AdminAction } from "@/features/admin-master/types";
import { buildAppNavigation, flattenNavigationLinks } from "@/lib/appNavigation";
import { useAuth } from "@/providers/AuthProvider";

const PermissionRouteGuard = ({
  screenCodes,
  action = "list",
}: {
  screenCodes: readonly string[];
  action?: AdminAction;
}) => {
  const location = useLocation();
  const { adminMenu = [], can, isBootstrapping, user } = useAuth();

  const fallbackPath = useMemo(() => {
    const navigation = buildAppNavigation(adminMenu, { hasFullAccess: Boolean(user?.is_staff) });
    return flattenNavigationLinks(navigation)[0]?.to ?? null;
  }, [adminMenu, user?.is_staff]);

  if (isBootstrapping) {
    return null;
  }

  if (screenCodes.some((screenCode) => can(screenCode, action))) {
    return <Outlet />;
  }

  if (!fallbackPath || fallbackPath === location.pathname) {
    return <ErrorState description="No accessible screens are assigned to this login." />;
  }

  return <Navigate to={fallbackPath} replace />;
};

export default PermissionRouteGuard;
