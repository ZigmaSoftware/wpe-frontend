import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiSuccessEnvelope } from "@/lib/types";

export type ProductionLineConnectionRecord = {
  id: number;
  source_inventory_transaction: number;
  source_production_order: number | null;
  source_production_id: string | null;
  production_order: number | null;
  production_id: string | null;
  production_line: number;
  production_line_code: string | null;
  production_line_name: string;
  machine: number | null;
  machine_code: string | null;
  machine_name: string;
  item: number | null;
  item_code: string;
  item_name: string;
  baglot: string;
  scancode: string;
  reference_no: string;
  weight: string;
  status: "ON" | "OFF";
  connected_at: string;
  disconnected_at: string | null;
  duration: string;
  duration_seconds: number | null;
};

export type ProductionLineOccupancy = {
  production_line_id: number;
  line_name: string;
  machine_name: string;
  baglot: string;
  scancode: string;
};

export type ProductionLineConnectLookupResult = {
  inventory_transaction_id: number;
  source_production_order_id: number | null;
  source_production_id: string;
  source_batch_id: number | null;
  source_batch_no: string;
  reference_no: string;
  baglot: string;
  scancode: string;
  available_weight: string;
  connected_weight: string;
  uom: string;
  item: {
    id: number | null;
    item_code: string;
    item_name: string;
  };
  status: "ON" | "AVAILABLE";
  current_connection: ProductionLineConnectionRecord | null;
  history: ProductionLineConnectionRecord[];
  occupied_lines: ProductionLineOccupancy[];
};

export type ProductionLineConnectPayload = {
  scan_code: string;
  production_line_id: number;
  production_order_id?: number | null;
};

type ProductionLineConnectMutationResult = {
  connection: ProductionLineConnectionRecord;
};

export const productionLineConnectApi = {
  lookup: async (scanCode: string): Promise<ProductionLineConnectLookupResult> => {
    const response = await coreApi.get<ApiSuccessEnvelope<ProductionLineConnectLookupResult>>(
      "/api/production/line-connections/lookup/",
      { params: { scan: scanCode } },
    );
    return unwrapSuccessEnvelope(response.data);
  },

  connect: async (payload: ProductionLineConnectPayload): Promise<ProductionLineConnectMutationResult> => {
    const response = await coreApi.post<ApiSuccessEnvelope<ProductionLineConnectMutationResult>>(
      "/api/production/line-connections/connect/",
      payload,
    );
    return unwrapSuccessEnvelope(response.data);
  },

  disconnect: async (connectionId: number): Promise<ProductionLineConnectMutationResult> => {
    const response = await coreApi.post<ApiSuccessEnvelope<ProductionLineConnectMutationResult>>(
      `/api/production/line-connections/${connectionId}/disconnect/`,
      {},
    );
    return unwrapSuccessEnvelope(response.data);
  },
};
