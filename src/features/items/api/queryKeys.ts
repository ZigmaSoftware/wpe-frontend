import type { InventoryHistoryState, InventoryModule, InventorySummaryState } from "@/features/items/types";

export const itemsInventoryQueryKeys = {
  summary: (module: InventoryModule, params: InventorySummaryState & { deferredSearch: string }) =>
    ["items", "inventory", module, "summary", params.page, params.pageSize, params.deferredSearch] as const,
  history: (module: InventoryModule, itemId: number | null, params: InventoryHistoryState & { deferredSearch: string }) =>
    [
      "items",
      "inventory",
      module,
      "history",
      itemId,
      params.page,
      params.pageSize,
      params.deferredSearch,
      params.dateFrom,
      params.dateTo,
    ] as const,
};
