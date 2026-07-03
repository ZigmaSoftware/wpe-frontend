import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import { collectAllPages, normalizePaginatedEnvelope, type PaginatedEnvelope } from "@/lib/api/pagination";
import type { ApiSuccessEnvelope, StoreStockRequest } from "@/lib/types";

export type BlendingStoreRequestPayload = {
  request_type: "ADDITIVE" | "GENERAL";
  department: string;
  request_date: string;
  require_date?: string;
  require_time?: string;
  requested_for_name: string;
  request_reason: string;
  items: Array<{
    item_id: number;
    quantity: string;
  }>;
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

  updateStoreRequest: async (requestId: number, payload: BlendingStoreRequestPayload) => {
    const response = await coreApi.put<ApiSuccessEnvelope<StoreStockRequest>>(`/api/blending/store-requests/${requestId}/`, payload);
    return unwrapSuccessEnvelope(response.data);
  },

  cancelStoreRequest: async (requestId: number, remarks?: string) => {
    const response = await coreApi.post<ApiSuccessEnvelope<StoreStockRequest>>(
      `/api/blending/store-requests/${requestId}/cancel/`,
      { remarks },
    );
    return unwrapSuccessEnvelope(response.data);
  },

  getBlendingHeadApprovals: async () => {
    const response = await coreApi.get<PaginatedEnvelope<StoreStockRequest>>("/api/blending/head-approvals/", {
      params: { page_size: 200 },
    });
    return normalizePaginatedEnvelope(response.data).items;
  },

  approveBlendingHeadRequest: async (
    requestId: number,
    payload: {
      remarks?: string;
      items?: Array<{
        item: number;
        accepted_qty: string;
        remarks: string;
      }>;
    },
  ) => {
    const response = await coreApi.post<ApiSuccessEnvelope<StoreStockRequest>>(
      `/api/blending/head-approvals/${requestId}/approve/`,
      payload,
    );
    return unwrapSuccessEnvelope(response.data);
  },

  rejectBlendingHeadRequest: async (requestId: number, remarks?: string) => {
    const response = await coreApi.post<ApiSuccessEnvelope<StoreStockRequest>>(
      `/api/blending/head-approvals/${requestId}/reject/`,
      { remarks },
    );
    return unwrapSuccessEnvelope(response.data);
  },
};
