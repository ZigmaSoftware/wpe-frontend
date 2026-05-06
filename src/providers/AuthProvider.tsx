import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { registerLogoutHandler } from "@/lib/api";
import { bootstrapAuth, loginRequest, logoutRequest } from "@/lib/auth";
import { readStoredAuth, type AuthUser } from "@/lib/token-storage";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleForcedLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(readStoredAuth().user);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;

    registerLogoutHandler(() => {
      if (!active) {
        return;
      }

      setUser(null);
      navigate("/", { replace: true });
      toast.error("Your session expired. Please sign in again.");
    });

    bootstrapAuth()
      .then((nextUser) => {
        if (active) {
          setUser(nextUser);
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
      isAuthenticated: Boolean(user),
      isBootstrapping,
      signIn: async (username: string, password: string) => {
        const response = await loginRequest(username, password);
        setUser(response.user);
      },
      signOut: async () => {
        await logoutRequest();
        setUser(null);
      },
      handleForcedLogout: () => {
        setUser(null);
      },
    }),
    [isBootstrapping, user],
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
