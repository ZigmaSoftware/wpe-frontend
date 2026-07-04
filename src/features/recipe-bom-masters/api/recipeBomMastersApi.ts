import { coreApi } from "@/lib/api";
import { codeMasterResource, fetchLookup, fetchNextCode, listResource } from "@/lib/api/resourceHelpers";
import type { TableParams } from "@/features/wpe-masters/types";
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
  bomCreations: codeMasterResource<BOMCreationRecord, BOMCreationWritePayload>(BASE, "bom-creations"),
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
