import axios from "axios";
import type { ApiListEnvelope, GrnListResponse, ImportResponse } from "@/lib/types";

export const normalizeListResponse = <T>(payload: T[] | ApiListEnvelope<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
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
    const detail =
      (error.response?.data as Record<string, unknown> | undefined)?.detail ??
      (error.response?.data as Record<string, unknown> | undefined)?.message;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    const errors = (error.response?.data as Record<string, unknown> | undefined)?.errors;
    if (errors && typeof errors === "object") {
      const firstValue = Object.values(errors)[0];
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0];
      }
      if (typeof firstValue === "string") {
        return firstValue;
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
