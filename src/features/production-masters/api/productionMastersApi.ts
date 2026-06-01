import { coreApi } from "@/lib/api";
import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  LookupItem,
  PaginatedResponse,
  TableParams,
} from "@/features/wpe-masters/types";
import type {
  BagCreationRecord,
  BagCreationWritePayload,
  BinCreationRecord,
  BinCreationWritePayload,
  ColorCreationRecord,
  ColorCreationWritePayload,
  MachineCreationRecord,
  MachineCreationWritePayload,
  PackingMaterialRecord,
  PackingMaterialWritePayload,
  PackingTypeRecord,
  PackingTypeWritePayload,
  ProductionLineRecord,
  ProductionLineWritePayload,
  ProfileCreationRecord,
  ProfileCreationWritePayload,
  ProfileSizeRecord,
  ProfileSizeWritePayload,
  WorkCentreCreationRecord,
  WorkCentreCreationWritePayload,
} from "@/features/production-masters/types";

const BASE = "/api/production";

function buildProfileFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (key === "image_url") continue;
    if (value instanceof File) {
      fd.append(key, value);
    } else if (value === null || value === undefined) {
      // omit — don't clear existing files
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

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

export const productionMastersApi = {
  profileCreations: {
    ...codeMasterResource<ProfileCreationRecord, ProfileCreationWritePayload>("profile-creations"),
    create: (payload: ProfileCreationWritePayload) =>
      coreApi.post<ProfileCreationRecord>(`${BASE}/profile-creations/`, buildProfileFormData(payload as unknown as Record<string, unknown>)).then((r) => r.data),
    update: (id: number, payload: Partial<ProfileCreationWritePayload>) =>
      coreApi.put<ProfileCreationRecord>(`${BASE}/profile-creations/${id}/`, buildProfileFormData(payload as unknown as Record<string, unknown>)).then((r) => r.data),
  },
  profileSizes: codeMasterResource<ProfileSizeRecord, ProfileSizeWritePayload>("profile-sizes"),
  colorCreations: codeMasterResource<ColorCreationRecord, ColorCreationWritePayload>("color-creations"),
  machineCreations: codeMasterResource<MachineCreationRecord, MachineCreationWritePayload>("machine-creations"),
  workCentreCreations: codeMasterResource<WorkCentreCreationRecord, WorkCentreCreationWritePayload>("work-centre-creations"),
  productionLines: codeMasterResource<ProductionLineRecord, ProductionLineWritePayload>("production-lines"),
  binCreations: codeMasterResource<BinCreationRecord, BinCreationWritePayload>("bin-creations"),
  bagCreations: codeMasterResource<BagCreationRecord, BagCreationWritePayload>("bag-creations"),
  packingTypes: codeMasterResource<PackingTypeRecord, PackingTypeWritePayload>("packing-types"),
  packingMaterials: codeMasterResource<PackingMaterialRecord, PackingMaterialWritePayload>("packing-materials"),
};

