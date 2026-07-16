export const extrusionKeys = {
  all: ["extrusion"] as const,

  profileConfigs: () => [...extrusionKeys.all, "profile-configs"] as const,
  profileConfigsList: (params?: unknown) => [...extrusionKeys.profileConfigs(), "list", params] as const,

  scrapCategories: () => [...extrusionKeys.all, "scrap-categories"] as const,
  scrapCategoriesList: (params?: unknown) => [...extrusionKeys.scrapCategories(), "list", params] as const,

  scrapReasons: () => [...extrusionKeys.all, "scrap-reasons"] as const,
  scrapReasonsList: (params?: unknown) => [...extrusionKeys.scrapReasons(), "list", params] as const,

  workOrders: () => [...extrusionKeys.all, "work-orders"] as const,
  workOrdersList: (params?: unknown) => [...extrusionKeys.workOrders(), "list", params] as const,
  workOrderDetail: (id: number | string) => [...extrusionKeys.workOrders(), "detail", id] as const,

  inspections: () => [...extrusionKeys.all, "inspections"] as const,
  inspectionsList: (params?: unknown) => [...extrusionKeys.inspections(), "list", params] as const,

  packets: () => [...extrusionKeys.all, "packets"] as const,
  packetsList: (params?: unknown) => [...extrusionKeys.packets(), "list", params] as const,
  packetDetail: (id: number | string) => [...extrusionKeys.packets(), "detail", id] as const,

  stickers: () => [...extrusionKeys.all, "stickers"] as const,
  stickersList: (params?: unknown) => [...extrusionKeys.stickers(), "list", params] as const,

  shiftApprovalEligible: (filters?: unknown) => [...extrusionKeys.all, "shift-approval-eligible", filters] as const,

  scrapTransactions: () => [...extrusionKeys.all, "scrap-transactions"] as const,
  scrapTransactionsList: (params?: unknown) => [...extrusionKeys.scrapTransactions(), "list", params] as const,

  kpiDashboard: (filters?: unknown) => [...extrusionKeys.all, "kpi-dashboard", filters] as const,
};
