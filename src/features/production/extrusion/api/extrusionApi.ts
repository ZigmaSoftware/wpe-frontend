import { coreApi } from "@/lib/api";
import { codeMasterResource, createResource, deleteResource, listResource, updateResource, type TableParamsLike } from "@/lib/api/resourceHelpers";
import type {
  ApiActionEnvelope,
  ExtrusionInspectionRecord,
  ExtrusionInspectionWritePayload,
  ExtrusionKpiFilters,
  ExtrusionKpiResponse,
  ExtrusionProfileConfigRecord,
  ExtrusionProfileConfigWritePayload,
  ExtrusionWorkOrderDetailRecord,
  ExtrusionWorkOrderListRecord,
  ExtrusionWorkOrderWritePayload,
  PacketCreatePayload,
  PacketRecord,
  PacketStickerRecord,
  ScrapCategoryRecord,
  ScrapCategoryWritePayload,
  ScrapReasonRecord,
  ScrapReasonWritePayload,
  ScrapTransactionCreatePayload,
  ScrapTransactionRecord,
  ShiftApprovalBulkPayload,
  ShiftApprovalFilters,
  WeightCapturePayload,
} from "@/features/production/extrusion/types";

const BASE = "/api/production/extrusion";

async function postAction<T>(path: string, payload?: unknown): Promise<ApiActionEnvelope<T>> {
  const res = await coreApi.post<ApiActionEnvelope<T>>(path, payload ?? {});
  return res.data;
}

export const extrusionApi = {
  profileConfigs: {
    list: (params: TableParamsLike) => listResource<ExtrusionProfileConfigRecord>(`${BASE}/profile-configs/`, params),
    create: (payload: ExtrusionProfileConfigWritePayload) =>
      createResource<ExtrusionProfileConfigRecord, ExtrusionProfileConfigWritePayload>(`${BASE}/profile-configs/`, payload),
    update: (id: number, payload: Partial<ExtrusionProfileConfigWritePayload>) =>
      updateResource<ExtrusionProfileConfigRecord, Partial<ExtrusionProfileConfigWritePayload>>(`${BASE}/profile-configs/${id}/`, payload),
    delete: (id: number) => deleteResource(`${BASE}/profile-configs/${id}/`),
  },

  scrapCategories: codeMasterResource<ScrapCategoryRecord, ScrapCategoryWritePayload>(BASE, "scrap-categories"),
  scrapReasons: codeMasterResource<ScrapReasonRecord, ScrapReasonWritePayload>(BASE, "scrap-reasons"),

  workOrders: {
    list: (params: TableParamsLike) => listResource<ExtrusionWorkOrderListRecord>(`${BASE}/work-orders/`, params),
    get: (id: number) => coreApi.get<ExtrusionWorkOrderDetailRecord>(`${BASE}/work-orders/${id}/`).then((r) => r.data),
    create: (payload: ExtrusionWorkOrderWritePayload) =>
      createResource<ExtrusionWorkOrderDetailRecord, ExtrusionWorkOrderWritePayload>(`${BASE}/work-orders/`, payload),
    update: (id: number, payload: Partial<ExtrusionWorkOrderWritePayload>) =>
      updateResource<ExtrusionWorkOrderDetailRecord, Partial<ExtrusionWorkOrderWritePayload>>(`${BASE}/work-orders/${id}/`, payload),
    delete: (id: number) => deleteResource(`${BASE}/work-orders/${id}/`),
    release: (id: number) => postAction<ExtrusionWorkOrderDetailRecord>(`${BASE}/work-orders/${id}/release/`),
  },

  inspections: {
    list: (params: TableParamsLike) => listResource<ExtrusionInspectionRecord>(`${BASE}/inspections/`, params),
    create: (payload: ExtrusionInspectionWritePayload) =>
      createResource<ExtrusionInspectionRecord, ExtrusionInspectionWritePayload>(`${BASE}/inspections/`, payload),
    update: (id: number, payload: Partial<ExtrusionInspectionWritePayload>) =>
      updateResource<ExtrusionInspectionRecord, Partial<ExtrusionInspectionWritePayload>>(`${BASE}/inspections/${id}/`, payload),
  },

  packets: {
    list: (params: TableParamsLike) => listResource<PacketRecord>(`${BASE}/packets/`, params),
    get: (id: number) => coreApi.get<PacketRecord>(`${BASE}/packets/${id}/`).then((r) => r.data),
    create: (payload: PacketCreatePayload) => coreApi.post<PacketRecord>(`${BASE}/packets/`, payload).then((r) => r.data),
    weigh: (id: number, payload: WeightCapturePayload) => postAction<PacketRecord>(`${BASE}/packets/${id}/weigh/`, payload),
    generateSticker: (id: number) => postAction<PacketStickerRecord>(`${BASE}/packets/${id}/generate-sticker/`),
    reverseQcApproval: (id: number, reason: string) =>
      postAction<PacketRecord>(`${BASE}/packets/${id}/reverse-qc-approval/`, { reason }),
    receiveWarehouse: (id: number, warehouse?: number | null) =>
      postAction<PacketRecord>(`${BASE}/packets/${id}/receive-warehouse/`, { warehouse: warehouse ?? null }),
  },

  stickers: {
    list: (params: TableParamsLike) => listResource<PacketStickerRecord>(`${BASE}/stickers/`, params),
    reprint: (id: number, reason: string) => postAction<PacketStickerRecord>(`${BASE}/stickers/${id}/reprint/`, { reason }),
    scan: (stickerNo: string, packetId?: number) =>
      postAction<PacketStickerRecord>(`${BASE}/stickers/scan/`, { sticker_no: stickerNo, packet: packetId }),
  },

  shiftApproval: {
    eligible: async (filters: ShiftApprovalFilters) => {
      const res = await coreApi.get<PacketRecord[]>(`${BASE}/shift-approval/`, { params: filters as Record<string, unknown> });
      return res.data;
    },
    approve: (payload: ShiftApprovalBulkPayload) => postAction<PacketRecord[]>(`${BASE}/shift-approval/`, payload),
  },

  scrapTransactions: {
    list: (params: TableParamsLike) => listResource<ScrapTransactionRecord>(`${BASE}/scrap-transactions/`, params),
    create: (payload: ScrapTransactionCreatePayload) =>
      coreApi.post<ScrapTransactionRecord>(`${BASE}/scrap-transactions/`, payload).then((r) => r.data),
    approve: (id: number) => postAction<ScrapTransactionRecord>(`${BASE}/scrap-transactions/${id}/approve/`),
    reverse: (id: number, reason: string) =>
      postAction<ScrapTransactionRecord>(`${BASE}/scrap-transactions/${id}/reverse/`, { reason }),
  },

  kpiDashboard: {
    get: async (filters: ExtrusionKpiFilters) => {
      const res = await coreApi.get<ExtrusionKpiResponse>(`${BASE}/kpi-dashboard/`, { params: filters as Record<string, unknown> });
      return res.data;
    },
  },
};
