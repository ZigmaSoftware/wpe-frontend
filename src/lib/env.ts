const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isLocalFrontendHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
};

const isLiveFrontendHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname === "115.245.93.26";
};

// VITE_PROD=true always selects production. Otherwise VITE_ENV selects
// between the local developer machine and the LAN server.
// Keep deployment config intact, but when the app is opened from localhost
// use the local backend so login does not hang on an unreachable LAN server.
const IS_PROD = import.meta.env.VITE_PROD === "true";
const ENV =
  IS_PROD || isLiveFrontendHost()
    ? "prod"
    : import.meta.env.VITE_ENV === "server" && isLocalFrontendHost()
      ? "local"
      : (import.meta.env.VITE_ENV ?? "local");

const USE_DEV_SERVER_PROXY = import.meta.env.DEV && !isLocalFrontendHost();

export const CORE_API_URL = trimTrailingSlash(
  USE_DEV_SERVER_PROXY
    ? ""
    : ENV === "prod"
    ? (import.meta.env.VITE_CORE_API_PROD   ?? "http://115.245.93.26:7904")
    : ENV === "server"
    ? (import.meta.env.VITE_CORE_API_SERVER ?? "http://192.168.5.19:8000")
    : (import.meta.env.VITE_CORE_API_LOCAL  ?? "http://127.0.0.1:8000"),
);

export const GRN_API_URL = trimTrailingSlash(
  USE_DEV_SERVER_PROXY
    ? ""
    : ENV === "prod"
    ? (import.meta.env.VITE_GRN_API_PROD   ?? CORE_API_URL)
    : ENV === "server"
    ? (import.meta.env.VITE_GRN_API_SERVER ?? CORE_API_URL)
    : (import.meta.env.VITE_GRN_API_LOCAL  ?? CORE_API_URL),
);
