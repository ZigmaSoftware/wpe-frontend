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

const collectAllPages = async <T>(fetchPage: (page: number, pageSize: number) => Promise<InventoryPage<T>>) => {
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

  listAllSummary: async (
    module: InventoryModule,
    params: {
      search?: string;
    },
  ) =>
    collectAllPages<InventorySummaryRow>((page, pageSize) =>
      itemsInventoryApi.listSummary(module, {
        page,
        pageSize,
        search: params.search?.trim() || undefined,
      }),
    ),

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

  listAllHistory: async (
    module: InventoryModule,
    itemId: number,
    params: {
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) =>
    collectAllPages<InventoryHistoryRow>((page, pageSize) =>
      itemsInventoryApi.listHistory(module, itemId, {
        page,
        pageSize,
        search: params.search?.trim() || undefined,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
      }),
    ),
};
