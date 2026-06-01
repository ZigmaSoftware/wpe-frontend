import { coreApi } from "@/lib/api";
import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  LookupItem,
  PaginatedResponse,
  TableParams,
} from "@/features/wpe-masters/types";
import type {
  BOMCreationRecord,
  BOMCreationWritePayload,
  BOMItemCreationRecord,
  BOMItemCreationWritePayload,
  RecipeDetailRecord,
  RecipeItemWritePayload,
  RecipeRecord,
  RecipeWritePayload,
} from "@/features/recipe-bom-masters/types";

const BASE = "/api/production";

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

export const recipeBomMastersApi = {
  recipes: {
    list: (params: TableParams) => listResource<RecipeRecord>(`${BASE}/recipes/`, params),
    lookup: () => fetchLookup(`${BASE}/recipes/lookup/`),
    nextCode: () => fetchNextCode(`${BASE}/recipes/next-code/`),
    approverOptions: () => fetchLookup(`${BASE}/recipes/approver-options/`),
    create: (payload: RecipeWritePayload) => coreApi.post<RecipeRecord>(`${BASE}/recipes/`, payload).then((res) => res.data),
    update: (id: number, payload: Partial<RecipeWritePayload>) =>
      coreApi.put<RecipeRecord>(`${BASE}/recipes/${id}/`, payload).then((res) => res.data),
    detail: (id: number) => coreApi.get<RecipeDetailRecord>(`${BASE}/recipes/${id}/`).then((res) => res.data),
    saveItems: (id: number, components: RecipeItemWritePayload[]) =>
      coreApi.put<RecipeDetailRecord>(`${BASE}/recipes/${id}/items/`, { components }).then((res) => res.data),
    toggle: (id: number) => coreApi.patch<RecipeRecord>(`${BASE}/recipes/${id}/toggle/`, {}).then((res) => res.data),
    delete: (id: number) => coreApi.delete(`${BASE}/recipes/${id}/`).then(() => undefined),
  },
  bomCreations: codeMasterResource<BOMCreationRecord, BOMCreationWritePayload>("bom-creations"),
  bomItemCreations: {
    list: (params: TableParams) => listResource<BOMItemCreationRecord>(`${BASE}/bom-item-creations/`, params),
    create: (payload: BOMItemCreationWritePayload) =>
      coreApi.post<BOMItemCreationRecord>(`${BASE}/bom-item-creations/`, payload).then((res) => res.data),
    update: (id: number, payload: Partial<BOMItemCreationWritePayload>) =>
      coreApi.put<BOMItemCreationRecord>(`${BASE}/bom-item-creations/${id}/`, payload).then((res) => res.data),
    delete: (id: number) => coreApi.delete(`${BASE}/bom-item-creations/${id}/`).then(() => undefined),
    toggle: (id: number) =>
      coreApi.patch<BOMItemCreationRecord>(`${BASE}/bom-item-creations/${id}/toggle/`, {}).then((res) => res.data),
  },
};
