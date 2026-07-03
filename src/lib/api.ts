import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { CORE_API_URL, GRN_API_URL } from "@/lib/env";
import {
  clearStoredAuth,
  readStoredAuth,
  writeStoredAuth,
  type AuthTokens,
  type AuthUser,
} from "@/lib/token-storage";

type AuthSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const authState: AuthSnapshot = {
  accessToken: readStoredAuth().tokens?.access ?? null,
  refreshToken: readStoredAuth().tokens?.refresh ?? null,
  user: readStoredAuth().user ?? null,
};

let refreshPromise: Promise<AuthTokens | null> | null = null;
let logoutHandler: (() => void) | null = null;

const shouldUseCoreForGrnLocally =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

const persistSnapshot = () => {
  if (authState.accessToken && authState.refreshToken) {
    writeStoredAuth({
      tokens: {
        access: authState.accessToken,
        refresh: authState.refreshToken,
      },
      user: authState.user,
    });
    return;
  }

  clearStoredAuth();
};

export const getAuthSnapshot = () => ({
  accessToken: authState.accessToken,
  refreshToken: authState.refreshToken,
  user: authState.user,
});

export const setAuthTokens = (tokens: AuthTokens | null, user?: AuthUser | null) => {
  authState.accessToken = tokens?.access ?? null;
  authState.refreshToken = tokens?.refresh ?? null;

  if (user !== undefined) {
    authState.user = user;
  }

  persistSnapshot();
};

export const setAuthUser = (user: AuthUser | null) => {
  authState.user = user;
  persistSnapshot();
};

export const clearAuthState = () => {
  authState.accessToken = null;
  authState.refreshToken = null;
  authState.user = null;
  persistSnapshot();
};

export const registerLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

const withAuthHeader = (config: InternalAxiosRequestConfig) => {
  if (authState.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authState.accessToken}`;
  }

  return config;
};

export const coreApi = axios.create({
  baseURL: CORE_API_URL,
});

export const grnApi = axios.create({
  // Local development often runs only the core backend, which already serves
  // the GRN/QCR routes through `grn_app.urls`. Keep deployment GRN targets intact.
  baseURL: shouldUseCoreForGrnLocally ? CORE_API_URL : GRN_API_URL,
});

coreApi.interceptors.request.use(withAuthHeader);
grnApi.interceptors.request.use(withAuthHeader);

const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  if (!authState.refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    const currentRefreshToken = authState.refreshToken;
    refreshPromise = axios
      .post<{ access: string; refresh?: string }>(`${CORE_API_URL}/api/token/refresh/`, {
        refresh: currentRefreshToken,
      })
      .then((response) => {
        const tokens = {
          access: response.data.access,
          refresh: response.data.refresh ?? currentRefreshToken,
        };
        setAuthTokens(tokens);
        return tokens;
      })
      .catch(() => {
        clearAuthState();
        logoutHandler?.();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const shouldRefresh = (error: AxiosError) => {
  const status = error.response?.status;
  const requestUrl = error.config?.url ?? "";

  if (status !== 401) {
    return false;
  }

  if (requestUrl.includes("/api/token/refresh/")) {
    return false;
  }

  return true;
};

const installRefreshInterceptor = (client: typeof coreApi) => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      if (!originalRequest || originalRequest._retry || !shouldRefresh(error)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshedTokens = await refreshAccessToken();
      if (!refreshedTokens) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedTokens.access}`;
      return client(originalRequest);
    },
  );
};

installRefreshInterceptor(coreApi);
installRefreshInterceptor(grnApi);
