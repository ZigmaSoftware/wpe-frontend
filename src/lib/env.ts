const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const CORE_API_URL = trimTrailingSlash(
  import.meta.env.VITE_CORE_API_URL ?? "http://127.0.0.1:8000",
);

export const GRN_API_URL = trimTrailingSlash(
  import.meta.env.VITE_GRN_API_URL ?? "http://127.0.0.1:8001",
);
