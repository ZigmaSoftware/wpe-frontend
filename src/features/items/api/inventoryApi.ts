import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope } from "@/lib/types";
import { INVENTORY_MODULES, type InventoryHistoryRow, type InventoryModule, type InventoryPage, type InventorySummaryRow } from "@/features/items/types";

const normalizePaginatedEnvelope = <T>(
  payload: ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>,
): InventoryPage<T> => {
  const unwrapped = unwrapSuccessEnvelope(payload);
  return {
    items: unwrapped.results ?? [],
    total: unwrapped.count ?? 0,
    next: unwrapped.next ?? null,
    previous: unwrapped.previous ?? null,
  };
};

export const itemsInventoryApi = {
  listSummary: async (
    module: InventoryModule,
    params: {
      page: number;
      pageSize: number;
      search?: string;
    },
  ) => {
    const response = await coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<InventorySummaryRow>>>(
      INVENTORY_MODULES[module].summaryEndpoint,
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          search: params.search?.trim() || undefined,
        },
      },
    );
    return normalizePaginatedEnvelope<InventorySummaryRow>(response.data);
  },

  listHistory: async (
    module: InventoryModule,
    itemId: number,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) => {
    const response = await coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<InventoryHistoryRow>>>(
      INVENTORY_MODULES[module].historyEndpoint(itemId),
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          search: params.search?.trim() || undefined,
          date_from: params.dateFrom || undefined,
          date_to: params.dateTo || undefined,
        },
      },
    );
    return normalizePaginatedEnvelope<InventoryHistoryRow>(response.data);
  },
};
