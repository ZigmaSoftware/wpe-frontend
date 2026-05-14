import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/QueryState";
import { useAuth } from "@/providers/AuthProvider";

const AuthGuard = () => {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default AuthGuard;
