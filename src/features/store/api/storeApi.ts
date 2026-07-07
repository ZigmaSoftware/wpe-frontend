import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import type { LookupOption } from "@/features/admin-master/types";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import { collectAllPages, normalizePaginatedEnvelope, type PaginatedEnvelope } from "@/lib/api/pagination";
import type { ApiSuccessEnvelope, StoreStockRequest, StoreTransactionRecord } from "@/lib/types";

export type StoreDashboardSummary = {
  warehouse_summary: Array<{
    warehouse_id: number;
    warehouse_code: string;
    warehouse_name: string;
    available_qty_total: string;
    reserved_qty_total: string;
  }>;
  pending_store_requests: number;
  approved_store_requests: number;
  stock_ledger_entries: number;
  warehouses: number;
};

export const storeApi = {
  getDashboard: async () => {
    const response = await coreApi.get<ApiSuccessEnvelope<StoreDashboardSummary>>("/api/store/dashboard/");
    return unwrapSuccessEnvelope(response.data);
  },

  listDepartments: async (): Promise<LookupOption[]> => adminMasterApi.lookupUserTypeDepartments(),

  listStockSummary: async (params: { search?: string }) => itemsInventoryApi.listAllSummary("store", params),

  listRequests: async (params: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    department?: string;
    queue?: "request_process" | "release_stock" | "closed_won" | "all";
  }) =>
    collectAllPages<StoreStockRequest>(async (page, pageSize) => {
      const response = await coreApi.get<PaginatedEnvelope<StoreStockRequest>>("/api/store/requests/", {
        params: {
          page,
          page_size: pageSize,
          queue: params.queue || undefined,
          search: params.search?.trim() || undefined,
          status: params.status && params.status !== "all" ? params.status : undefined,
          date_from: params.dateFrom || undefined,
          date_to: params.dateTo || undefined,
          department: params.department && params.department !== "all" ? params.department : undefined,
        },
      });

      return normalizePaginatedEnvelope(response.data);
    }),

  processRequest: async (
    requestId: number,
    payload: {
      approval_remarks?: string;
      items?: Array<{
        item: number;
        provided_qty: string;
        remarks?: string;
      }>;
    },
  ) => {
    const response = await coreApi.post<ApiSuccessEnvelope<{ request: StoreStockRequest }>>(
      `/api/store/requests/${requestId}/approve/`,
      payload,
    );
    return unwrapSuccessEnvelope(response.data);
  },

  rejectProcessedRequest: async (requestId: number, approval_remarks?: string) => {
    const response = await coreApi.post<ApiSuccessEnvelope<{ request: StoreStockRequest }>>(
      `/api/store/requests/${requestId}/reject/`,
      { approval_remarks },
    );
    return unwrapSuccessEnvelope(response.data);
  },

  releaseRequest: async (requestId: number, release_remarks?: string) => {
    const response = await coreApi.post<ApiSuccessEnvelope<{ request: StoreStockRequest }>>(
      `/api/store/requests/${requestId}/release/`,
      { release_remarks },
    );
    return unwrapSuccessEnvelope(response.data);
  },

  rejectReleaseRequest: async (requestId: number, release_remarks?: string) => {
    const response = await coreApi.post<ApiSuccessEnvelope<{ request: StoreStockRequest }>>(
      `/api/store/requests/${requestId}/release-reject/`,
      { release_remarks },
    );
    return unwrapSuccessEnvelope(response.data);
  },

  listTransactions: async (params: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    collectAllPages<StoreTransactionRecord>(async (page, pageSize) => {
      const response = await coreApi.get<PaginatedEnvelope<StoreTransactionRecord>>("/api/store/transactions/", {
        params: {
          page,
          page_size: pageSize,
          search: params.search?.trim() || undefined,
          date_from: params.dateFrom || undefined,
          date_to: params.dateTo || undefined,
        },
      });

      return normalizePaginatedEnvelope(response.data);
    }),

  listStockItemHistory: async (params: {
    itemId: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => itemsInventoryApi.listAllHistory("store", params.itemId, params),
};
