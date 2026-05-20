import axios from "axios";
import type { ApiSuccessEnvelope, GrnListResponse, ImportResponse } from "@/lib/types";

type QueryParamValue = string | number | boolean | null | undefined;

type QueryParamSource = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  filters?: Record<string, QueryParamValue>;
};

type NormalizedPaginatedResult<T> = {
  items: T[];
  total: number;
  filtered: number;
  next: string | null;
  previous: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const readFirstErrorValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = readFirstErrorValue(entry);
      if (message) {
        return message;
      }
    }
  }

  if (isRecord(value)) {
    for (const entry of Object.values(value)) {
      const message = readFirstErrorValue(entry);
      if (message) {
        return message;
      }
    }
  }

  return null;
};

const getFirstFieldError = (payload: Record<string, unknown>, ignoredKeys: string[] = []) => {
  const ignoredKeySet = new Set(ignoredKeys);

  for (const [key, value] of Object.entries(payload)) {
    if (ignoredKeySet.has(key)) {
      continue;
    }

    const message = readFirstErrorValue(value);
    if (message) {
      return message;
    }
  }

  return null;
};

export const unwrapSuccessEnvelope = <T>(payload: ApiSuccessEnvelope<T> | T): T => {
  if (isRecord(payload) && "success" in payload && "data" in payload) {
    return (payload as ApiSuccessEnvelope<T>).data;
  }

  return payload as T;
};

export const toQueryParams = ({ page, pageSize, search, ordering, filters }: QueryParamSource = {}) => ({
  page: page ?? undefined,
  page_size: pageSize ?? undefined,
  search: search || undefined,
  ordering: ordering || undefined,
  ...(filters ?? {}),
});

export const normalizePaginatedResponse = <T>(payload: unknown): NormalizedPaginatedResult<T> => {
  const unwrappedPayload = unwrapSuccessEnvelope(payload as ApiSuccessEnvelope<unknown> | unknown);

  if (Array.isArray(unwrappedPayload)) {
    return {
      items: unwrappedPayload as T[],
      total: unwrappedPayload.length,
      filtered: unwrappedPayload.length,
      next: null,
      previous: null,
    };
  }

  if (!isRecord(unwrappedPayload)) {
    return {
      items: [],
      total: 0,
      filtered: 0,
      next: null,
      previous: null,
    };
  }

  if (Array.isArray(unwrappedPayload.results)) {
    const count = Number(unwrappedPayload.count ?? unwrappedPayload.results.length ?? 0);

    return {
      items: unwrappedPayload.results as T[],
      total: count,
      filtered: count,
      next: typeof unwrappedPayload.next === "string" ? unwrappedPayload.next : null,
      previous: typeof unwrappedPayload.previous === "string" ? unwrappedPayload.previous : null,
    };
  }

  if (Array.isArray(unwrappedPayload.data)) {
    const items = unwrappedPayload.data as T[];

    return {
      items,
      total: Number(unwrappedPayload.recordsTotal ?? items.length ?? 0),
      filtered: Number(unwrappedPayload.recordsFiltered ?? items.length ?? 0),
      next: null,
      previous: null,
    };
  }

  if (isRecord(unwrappedPayload.data) && Array.isArray(unwrappedPayload.data.results)) {
    const nestedData = unwrappedPayload.data;
    const count = Number(nestedData.count ?? nestedData.results.length ?? 0);

    return {
      items: nestedData.results as T[],
      total: count,
      filtered: count,
      next: typeof nestedData.next === "string" ? nestedData.next : null,
      previous: typeof nestedData.previous === "string" ? nestedData.previous : null,
    };
  }

  return {
    items: [],
    total: 0,
    filtered: 0,
    next: null,
    previous: null,
  };
};

export const normalizeListResponse = <T>(payload: unknown): T[] =>
  normalizePaginatedResponse<T>(payload).items;

export const unwrapMutationPayload = <T>(payload: { data: T } | ApiSuccessEnvelope<T> | T): T => {
  if (isRecord(payload) && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

export const normalizeGrnResponse = (payload: GrnListResponse | unknown) => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as GrnListResponse).data)
  ) {
    return payload as GrnListResponse;
  }

  return {
    status: "success",
    message: "GRN data fetched successfully",
    count: 0,
    data: [],
  } as GrnListResponse;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === "string" && error.response.data.trim()) {
      return error.response.data;
    }

    const responseData = isRecord(error.response?.data) ? error.response.data : undefined;
    if (responseData) {
      const detail = responseData.detail ?? responseData.message;

      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }

      const rootFieldError = getFirstFieldError(responseData, [
        "detail",
        "message",
        "errors",
        "success",
        "data",
        "status",
        "count",
        "next",
        "previous",
      ]);
      if (rootFieldError) {
        return rootFieldError;
      }

      if (isRecord(responseData.errors)) {
        const nestedError = getFirstFieldError(responseData.errors);
        if (nestedError) {
          return nestedError;
        }
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const summarizeImportResponse = (payload: ImportResponse) => {
  const summaryParts = [
    `Processed ${payload.processed_count} row${payload.processed_count === 1 ? "" : "s"}`,
    `created ${payload.created_count}`,
  ];

  if (typeof payload.updated_count === "number") {
    summaryParts.push(`updated ${payload.updated_count}`);
  }
  if (typeof payload.existing_count === "number") {
    summaryParts.push(`existing ${payload.existing_count}`);
  }
  if (payload.failed_count > 0) {
    summaryParts.push(`failed ${payload.failed_count}`);
  }

  return summaryParts.join(", ");
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDecimal = (value?: string | number | null, maximumFractionDigits = 3) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};
