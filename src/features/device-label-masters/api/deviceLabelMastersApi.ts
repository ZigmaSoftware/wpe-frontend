import { coreApi } from "@/lib/api";
import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  LookupItem,
  PaginatedResponse,
  TableParams,
} from "@/features/wpe-masters/types";
import type {
  PrinterCreationRecord,
  PrinterCreationWritePayload,
  QRLabelTemplateRecord,
  QRLabelTemplateWritePayload,
  SerialPortConfigurationRecord,
  SerialPortConfigurationWritePayload,
  WeighmentScaleRecord,
  WeighmentScaleWritePayload,
} from "@/features/device-label-masters/types";

const BASE = "/api/wpe-masters";

const toParams = ({ page, pageSize, search, ordering, ...rest }: TableParams) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...rest,
});

async function listResource<T>(path: string, params: TableParams) {
  const res = await coreApi.get<PaginatedResponse<T>>(path, { params: toParams(params) });
  const data = res.data;
  return {
    items: Array.isArray(data) ? data : data.results ?? [],
    total: Array.isArray(data) ? data.length : data.count ?? 0,
  };
}

async function fetchLookup(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  const res = await coreApi.get<LookupItem[]>(path, { params });
  return res.data;
}

async function fetchNextCode(path: string) {
  const res = await coreApi.get<{ code: string }>(path);
  return res.data.code;
}

const codeMasterResource = <TRecord extends CodeMasterRecord, TPayload extends CodeMasterWritePayload>(resource: string) => ({
  list: (params: TableParams) => listResource<TRecord>(`${BASE}/${resource}/`, params),
  lookup: (params?: Record<string, string | number | boolean | null | undefined>) =>
    fetchLookup(`${BASE}/${resource}/lookup/`, params),
  nextCode: () => fetchNextCode(`${BASE}/${resource}/next-code/`),
  create: (payload: TPayload) => coreApi.post<TRecord>(`${BASE}/${resource}/`, payload).then((res) => res.data),
  update: (id: number, payload: Partial<TPayload>) =>
    coreApi.put<TRecord>(`${BASE}/${resource}/${id}/`, payload).then((res) => res.data),
  delete: (id: number) => coreApi.delete(`${BASE}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => coreApi.patch<TRecord>(`${BASE}/${resource}/${id}/toggle/`, {}).then((res) => res.data),
});

export const deviceLabelMastersApi = {
  weighmentScaleCreations: codeMasterResource<WeighmentScaleRecord, WeighmentScaleWritePayload>("weighment-scale-creations"),
  printerCreations: codeMasterResource<PrinterCreationRecord, PrinterCreationWritePayload>("printer-creations"),
  qrLabelTemplates: codeMasterResource<QRLabelTemplateRecord, QRLabelTemplateWritePayload>("qr-label-templates"),
  serialPortConfigurations: codeMasterResource<SerialPortConfigurationRecord, SerialPortConfigurationWritePayload>("serial-port-configurations"),
};
