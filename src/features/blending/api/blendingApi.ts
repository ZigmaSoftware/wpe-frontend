import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope, StoreStockRequest } from "@/lib/types";

type PaginatedPage<T> = {
  items: T[];
  total: number;
  next: string | null;
  previous: string | null;
};

type PaginatedEnvelope<T> = ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>;

export type BlendingStoreRequestPayload = {
  request_type: "ADDITIVE" | "GENERAL";
  department: string;
  request_date: string;
  require_date: string;
  require_time: string;
  requested_for_name: string;
  request_reason: string;
  items: Array<{
    item_id: number;
    quantity: string;
  }>;
};

const normalizePaginatedEnvelope = <T,>(payload: PaginatedEnvelope<T>): PaginatedPage<T> => {
  const normalized = unwrapSuccessEnvelope(payload);

  return {
    items: normalized.results ?? [],
    total: normalized.count ?? 0,
    next: normalized.next ?? null,
    previous: normalized.previous ?? null,
  };
};

const collectAllPages = async <T,>(fetchPage: (page: number, pageSize: number) => Promise<PaginatedPage<T>>) => {
  const pageSize = 200;
  let page = 1;
  let total = 0;
  const items: T[] = [];

  while (page <= 100) {
    const response = await fetchPage(page, pageSize);
    items.push(...response.items);
    total = response.total;

    if (!response.next || items.length >= total) {
      break;
    }

    page += 1;
  }

  return items;
};

export const blendingApi = {
  listRequests: async (params: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    requestType?: string;
    department?: string;
  }) =>
    collectAllPages<StoreStockRequest>(async (page, pageSize) => {
      const response = await coreApi.get<PaginatedEnvelope<StoreStockRequest>>("/api/blending/store-requests/", {
        params: {
          page,
          page_size: pageSize,
          search: params.search?.trim() || undefined,
          status: params.status && params.status !== "all" ? params.status : undefined,
          date_from: params.dateFrom || undefined,
          date_to: params.dateTo || undefined,
          request_type: params.requestType || undefined,
          department: params.department || undefined,
        },
      });

      return normalizePaginatedEnvelope(response.data);
    }),

  getRequestDetail: async (requestId: number) => {
    const response = await coreApi.get<ApiSuccessEnvelope<StoreStockRequest>>(`/api/blending/store-requests/${requestId}/`);
    return unwrapSuccessEnvelope(response.data);
  },

  createStoreRequest: async (payload: BlendingStoreRequestPayload) => {
    const response = await coreApi.post<ApiSuccessEnvelope<StoreStockRequest>>("/api/blending/store-requests/", payload);
    return unwrapSuccessEnvelope(response.data);
  },
};
