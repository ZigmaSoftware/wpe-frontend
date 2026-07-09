import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";

const BASE = "/api/production/line-connections";

export type LineConnectionStatus = "ON" | "OFF";

export interface LineConnectionRecord {
  id: number;
  production_line: number;
  production_line_name: string | null;
  production_line_code: string | null;
  machine: number | null;
  machine_name: string | null;
  machine_code: string | null;
  scan_code: string;
  item_code: string;
  item_name: string;
  reference_no: string;
  serial_no: string;
  weight_kg: string;
  status: LineConnectionStatus;
  connected_at: string;
  disconnected_at: string | null;
  duration: string | null;
  production_order: number | null;
  production_id: string | null;
  bag: number | null;
  bag_code: string | null;
  connected_by: number | null;
  connected_by_name: string | null;
  disconnected_by: number | null;
  disconnected_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlScancodeDetails {
  scan_code: string;
  serial_no: string;
  reference_no: string;
  item_code: string;
  item_name: string;
  weight_kg: string;
  total_weight_kg: string;
  production_id: string | null;
  is_connected: boolean;
  active_connection: LineConnectionRecord | null;
}

export const lineConnectApi = {
  scanGlScancode: async (scanCode: string) => {
    const response = await coreApi.get<unknown>(`${BASE}/scan/`, { params: { scan_code: scanCode } });
    return unwrapSuccessEnvelope<GlScancodeDetails>(response.data);
  },
  listConnections: async (params: { status?: LineConnectionStatus; production_line?: number } = {}) => {
    const response = await coreApi.get<unknown>(`${BASE}/`, { params });
    return unwrapSuccessEnvelope<{ results: LineConnectionRecord[] }>(response.data);
  },
  connect: async (payload: { scan_code: string; production_line: number }) => {
    const response = await coreApi.post<unknown>(`${BASE}/connect/`, payload);
    return unwrapSuccessEnvelope<LineConnectionRecord>(response.data);
  },
  disconnect: async (id: number) => {
    const response = await coreApi.post<unknown>(`${BASE}/${id}/disconnect/`);
    return unwrapSuccessEnvelope<LineConnectionRecord>(response.data);
  },
};
