import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import type { LookupOption } from "@/features/admin-master/types";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import type { InventoryHistoryRow, InventorySummaryRow } from "@/features/items/types";
import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope, StoreStockRequest, StoreTransactionRecord } from "@/lib/types";

type PaginatedPage<T> = {
  items: T[];
  total: number;
  next: string | null;
  previous: string | null;
};

type PaginatedEnvelope<T> = ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>;

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

export const storeApi = {
  getDashboard: async () => {
    const response = await coreApi.get<ApiSuccessEnvelope<StoreDashboardSummary>>("/api/store/dashboard/");
    return unwrapSuccessEnvelope(response.data);
  },

  listDepartments: async (): Promise<LookupOption[]> => adminMasterApi.lookupUserTypeDepartments(),

  listStockSummary: async (params: { search?: string }) =>
    collectAllPages<InventorySummaryRow>((page, pageSize) =>
      itemsInventoryApi.listSummary("store", {
        page,
        pageSize,
        search: params.search?.trim() || undefined,
      }),
    ),

  listRequests: async (params: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }) =>
    collectAllPages<StoreStockRequest>(async (page, pageSize) => {
      const response = await coreApi.get<PaginatedEnvelope<StoreStockRequest>>("/api/store/requests/", {
        params: {
          page,
          page_size: pageSize,
          search: params.search?.trim() || undefined,
          status: params.status && params.status !== "all" ? params.status : undefined,
          date_from: params.dateFrom || undefined,
          date_to: params.dateTo || undefined,
          department: params.department && params.department !== "all" ? params.department : undefined,
        },
      });

      return normalizePaginatedEnvelope(response.data);
    }),

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
  }) =>
    collectAllPages<InventoryHistoryRow>((page, pageSize) =>
      itemsInventoryApi.listHistory("store", params.itemId, {
        page,
        pageSize,
        search: params.search?.trim() || undefined,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
      }),
    ),
};
