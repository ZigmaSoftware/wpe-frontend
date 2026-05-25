const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

// VITE_ENV: "local" | "server" | "prod"
const ENV = import.meta.env.VITE_ENV ?? "local";

export const CORE_API_URL = trimTrailingSlash(
  ENV === "prod"
    ? (import.meta.env.VITE_CORE_API_PROD   ?? "http://115.245.93.26:7904")
    : ENV === "server"
    ? (import.meta.env.VITE_CORE_API_SERVER ?? "http://192.168.5.19:8000")
    : (import.meta.env.VITE_CORE_API_LOCAL  ?? "http://127.0.0.1:8000"),
);

export const GRN_API_URL = trimTrailingSlash(
  ENV === "prod"
    ? (import.meta.env.VITE_GRN_API_PROD   ?? CORE_API_URL)
    : ENV === "server"
    ? (import.meta.env.VITE_GRN_API_SERVER ?? CORE_API_URL)
    : (import.meta.env.VITE_GRN_API_LOCAL  ?? CORE_API_URL),
);
