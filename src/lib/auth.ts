import { coreApi, clearAuthState, getAuthSnapshot, setAuthTokens, setAuthUser } from "@/lib/api";
import type { AuthTokens, AuthUser } from "@/lib/token-storage";

type LoginResponse = AuthTokens & {
  user: AuthUser;
};

export const loginRequest = async (username: string, password: string) => {
  const response = await coreApi.post<LoginResponse>("/api/token/", { username, password });
  setAuthTokens(
    {
      access: response.data.access,
      refresh: response.data.refresh,
    },
    response.data.user,
  );
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await coreApi.get<AuthUser>("/api/auth/me/");
  setAuthUser(response.data);
  return response.data;
};

export const verifyToken = async () => {
  const tokens = getAuthSnapshot();
  if (!tokens.accessToken) {
    return false;
  }

  await coreApi.post("/api/token/verify/", { token: tokens.accessToken });
  return true;
};

export const bootstrapAuth = async () => {
  const snapshot = getAuthSnapshot();
  if (!snapshot.accessToken || !snapshot.refreshToken) {
    return null;
  }

  try {
    return await fetchCurrentUser();
  } catch {
    clearAuthState();
    return null;
  }
};

export const logoutRequest = async () => {
  const snapshot = getAuthSnapshot();

  try {
    if (snapshot.refreshToken) {
      await coreApi.post("/api/auth/logout/", { refresh: snapshot.refreshToken });
    }
  } finally {
    clearAuthState();
  }
};
