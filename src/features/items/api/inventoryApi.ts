import { coreApi, grnApi } from "@/lib/api";
import { collectAllPages, normalizePaginatedEnvelope } from "@/lib/api/pagination";
import type { ApiPaginatedResult, ApiSuccessEnvelope } from "@/lib/types";
import {
  INVENTORY_MODULES,
  type InventoryHistoryRow,
  type InventoryModule,
  type InventorySummaryRow,
  type WarehouseInventoryRow,
} from "@/features/items/types";

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

  listWarehouseInventory: async (
    params: {
      warehouseName: string;
      page: number;
      pageSize: number;
      search?: string;
    },
  ) => {
    const response = await grnApi.get<ApiSuccessEnvelope<ApiPaginatedResult<WarehouseInventoryRow>> | ApiPaginatedResult<WarehouseInventoryRow>>(
      "/api/warehouse-inventory/",
      {
        params: {
          warehouse_name: params.warehouseName,
          page: params.page,
          page_size: params.pageSize,
          search: params.search?.trim() || undefined,
        },
      },
    );
    return normalizePaginatedEnvelope<WarehouseInventoryRow>(response.data);
  },

  listAllWarehouseInventory: async (
    params: {
      warehouseName: string;
      search?: string;
    },
  ) =>
    collectAllPages<WarehouseInventoryRow>((page, pageSize) =>
      itemsInventoryApi.listWarehouseInventory({
        warehouseName: params.warehouseName,
        page,
        pageSize,
        search: params.search?.trim() || undefined,
      }),
    ),
};
