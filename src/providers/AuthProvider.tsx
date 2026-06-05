import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import type { AdminAction, AdminMenuMain, ResolvedPermissionResponse } from "@/features/admin-master/types";
import { canAccessAction, findScreenPermissions } from "@/features/admin-master/utils/permissions";
import { toast } from "@/components/ui/sonner";
import { registerLogoutHandler } from "@/lib/api";
import { bootstrapAuth, loginRequest, logoutRequest } from "@/lib/auth";
import { readStoredAuth, type AuthUser } from "@/lib/token-storage";

type AuthContextValue = {
  user: AuthUser | null;
  adminMenu: AdminMenuMain[];
  resolvedPermissions: ResolvedPermissionResponse | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleForcedLogout: () => void;
  refreshAdminPermissions: () => Promise<void>;
  can: (screenCode: string, action: AdminAction) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(readStoredAuth().user);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [adminMenu, setAdminMenu] = useState<AdminMenuMain[]>([]);
  const [resolvedPermissions, setResolvedPermissions] = useState<ResolvedPermissionResponse | null>(null);

  const hydrateAdminPermissions = async () => {
    setAdminMenu([]);
    setResolvedPermissions(null);

    try {
      const [menu, resolved] = await Promise.all([
        adminMasterApi.fetchPermissionMenu(),
        adminMasterApi.fetchResolvedPermissions(),
      ]);
      setAdminMenu(menu);
      setResolvedPermissions(resolved);
    } catch {
      setAdminMenu([]);
      setResolvedPermissions(null);
    }
  };

  useEffect(() => {
    let active = true;

    registerLogoutHandler(() => {
      if (!active) {
        return;
      }

      setUser(null);
      setAdminMenu([]);
      setResolvedPermissions(null);
      navigate("/", { replace: true });
      toast.error("Your session expired. Please sign in again.");
    });

    bootstrapAuth()
      .then(async (nextUser) => {
        if (active) {
          setUser(nextUser);
          if (nextUser) {
            await hydrateAdminPermissions();
          }
        }
      })
      .finally(() => {
        if (active) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      adminMenu,
      resolvedPermissions,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      signIn: async (username: string, password: string) => {
        const response = await loginRequest(username, password);
        setUser(response.user);
        await hydrateAdminPermissions();
      },
      signOut: async () => {
        await logoutRequest();
        setUser(null);
        setAdminMenu([]);
        setResolvedPermissions(null);
      },
      handleForcedLogout: () => {
        setUser(null);
        setAdminMenu([]);
        setResolvedPermissions(null);
      },
      refreshAdminPermissions: async () => {
        await hydrateAdminPermissions();
      },
      can: (screenCode: string, action: AdminAction) => {
        if (user?.is_staff) {
          return true;
        }

        return canAccessAction(findScreenPermissions(adminMenu, screenCode) ?? undefined, action);
      },
    }),
    [adminMenu, isBootstrapping, resolvedPermissions, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
