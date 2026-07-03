export type AuthUser = {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  user_type?: number | null;
  user_type_name?: string | null;
  department?: number | null;
  department_name?: string | null;
  role?: number | null;
  role_name?: string | null;
  auth_type?: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type StoredAuth = {
  tokens: AuthTokens | null;
  user: AuthUser | null;
};

const AUTH_STORAGE_KEY = "wpe.auth";
const ACTIVITY_KEY = "wpe.last_activity";

export const readStoredAuth = (): StoredAuth => {
  if (typeof window === "undefined") {
    return { tokens: null, user: null };
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return { tokens: null, user: null };
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredAuth;
    return {
      tokens: parsed.tokens ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return { tokens: null, user: null };
  }
};

export const writeStoredAuth = (value: StoredAuth) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const readLastActivity = (): number | null => {
  if (typeof window === "undefined") return null;
  const val = window.localStorage.getItem(ACTIVITY_KEY);
  return val ? Number(val) : null;
};

export const writeLastActivity = (timestamp: number) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVITY_KEY, String(timestamp));
};

export const clearLastActivity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVITY_KEY);
};
