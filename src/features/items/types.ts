export type InventoryModule = "store" | "blending";

export type InventorySummaryRow = {
  item_id: number;
  item_name: string;
  item_code: string;
  current_stock: string;
  unit: string;
  last_updated: string | null;
  total_inward: string;
  total_outward: string;
};

export type WarehouseInventoryRow = {
  grn_id: number;
  qcr_id: number;
  grn_no: string;
  supplier: string;
  po_no: string;
  items: string;
  inward_qty: string;
  outward_qty: string;
  status: string;
  reason?: string;
  warehouse_name: string;
  moved_to_qcr_at: string | null;
};

export type InventoryHistoryRow = {
  datetime: string;
  transaction_type: "INWARD" | "OUTWARD";
  quantity: string;
  opening_stock: string;
  closing_stock: string;
  reference_no: string | null;
  module: string;
  created_by: string;
};

export type InventoryPage<T> = {
  items: T[];
  total: number;
  next: string | null;
  previous: string | null;
};

export type InventorySummaryState = {
  page: number;
  pageSize: number;
  search: string;
};

export type InventoryHistoryState = {
  page: number;
  pageSize: number;
  search: string;
  dateFrom: string;
  dateTo: string;
};

export type InventoryHistoryTarget = {
  module: InventoryModule;
  row: InventorySummaryRow;
};

export const INVENTORY_MODULES: Record<
  InventoryModule,
  {
    label: string;
    summaryEndpoint: string;
    historyEndpoint: (itemId: number) => string;
    emptyTitle: string;
    emptyDescription: string;
    accessDescription: string;
  }
> = {
  store: {
    label: "Store Inventory",
    summaryEndpoint: "/api/store/inventory/summary/",
    historyEndpoint: (itemId) => `/api/store/inventory/${itemId}/history/`,
    emptyTitle: "No store inventory rows",
    emptyDescription: "No store stock rows matched the current item search.",
    accessDescription: "Only store users can monitor the store inventory ledger.",
  },
  blending: {
    label: "Blending Inventory",
    summaryEndpoint: "/api/blending/inventory/summary/",
    historyEndpoint: (itemId) => `/api/blending/inventory/${itemId}/history/`,
    emptyTitle: "No blending inventory rows",
    emptyDescription: "No blending stock rows matched the current item search.",
    accessDescription: "Only blending users can monitor the blending inventory ledger.",
  },
};
