import { coreApi } from "@/lib/api";
import {
  createResource,
  deleteResource,
  fetchLookup,
  fetchNextCode,
  listResource,
  resourceEntity,
  toParams,
  toggleResource,
  updateResource,
} from "@/lib/api/resourceHelpers";
import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  DepartmentMasterRecord,
  DepartmentMasterWritePayload,
  DesignationMasterRecord,
  DesignationMasterWritePayload,
  ItemMasterRecord,
  ItemMasterWritePayload,
  LocationMasterRecord,
  LocationMasterWritePayload,
  LookupItem,
  MasterRecord,
  MasterWritePayload,
  ProductTypeCategoryRecord,
  ProductTypeCategoryWritePayload,
  ProductTypeSubtypeLookupItem,
  ProductTypeSubtypeRecord,
  ProductTypeSubtypeWritePayload,
  ProductTypeTreeCategoryRecord,
  ScrapTypeMasterRecord,
  ScrapTypeMasterWritePayload,
  TableParams,
  UnitMasterRecord,
  UnitMasterWritePayload,
  WarehouseMasterRecord,
  WarehouseMasterWritePayload,
  WPEUserRecord,
  WPEUserWritePayload,
  RoleMasterRecord,
  RoleMasterWritePayload,
  StoreMasterRecord,
} from "@/features/wpe-masters/types";

const BASE = "/api/wpe-masters";
const listMaster = listResource;

async function lookupMaster(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<LookupItem[]> {
  return fetchLookup<LookupItem>(path, params);
}

async function createMaster<TRecord extends MasterRecord, TPayload extends MasterWritePayload>(
  path: string,
  payload: TPayload,
) {
  return createResource<TRecord, TPayload>(path, payload);
}

async function updateMaster<TRecord extends MasterRecord, TPayload extends MasterWritePayload>(
  path: string,
  payload: Partial<TPayload>,
) {
  return updateResource<TRecord, Partial<TPayload>>(path, payload);
}

async function deleteMaster(path: string) {
  await deleteResource(path);
}

async function toggleMaster<TRecord extends MasterRecord>(path: string) {
  return toggleResource<TRecord>(path);
}

const master = <TRecord extends MasterRecord = MasterRecord, TPayload extends MasterWritePayload = MasterWritePayload>(resource: string) => ({
  list: (params: TableParams) => listMaster<TRecord>(`${BASE}/${resource}/`, params),
  lookup: (params?: Record<string, string | number | boolean | null | undefined>) => lookupMaster(`${BASE}/${resource}/lookup/`, params),
  create: (payload: TPayload) => createMaster<TRecord, TPayload>(`${BASE}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) => updateMaster<TRecord, TPayload>(`${BASE}/${resource}/${id}/`, payload),
  delete: (id: number) => deleteMaster(`${BASE}/${resource}/${id}/`),
  toggle: (id: number) => toggleMaster<TRecord>(`${BASE}/${resource}/${id}/toggle/`),
});

const codeMaster = <TRecord extends CodeMasterRecord, TPayload extends CodeMasterWritePayload>(resource: string) => ({
  list: (params: TableParams) => listResource<TRecord>(`${BASE}/${resource}/`, params),
  lookup: (params?: Record<string, string | number | boolean | null | undefined>) => lookupMaster(`${BASE}/${resource}/lookup/`, params),
  nextCode: () => fetchNextCode(`${BASE}/${resource}/next-code/`),
  create: (payload: TPayload) => createResource<TRecord, TPayload>(`${BASE}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) => updateResource<TRecord, Partial<TPayload>>(`${BASE}/${resource}/${id}/`, payload),
  delete: (id: number) => deleteResource(`${BASE}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => toggleResource<TRecord>(`${BASE}/${resource}/${id}/toggle/`),
});

export const wpeMastersApi = {
  locations: master<LocationMasterRecord, LocationMasterWritePayload>("locations"),
  branches: master("branches"),
  priceBooks: master("price-books"),
  warehouses: codeMaster<WarehouseMasterRecord, WarehouseMasterWritePayload>("warehouses"),
  stores: codeMaster<StoreMasterRecord, CodeMasterWritePayload>("stores"),
  departments: codeMaster<DepartmentMasterRecord, DepartmentMasterWritePayload>("departments"),
  designations: codeMaster<DesignationMasterRecord, DesignationMasterWritePayload>("designations"),
  roles: codeMaster<RoleMasterRecord, RoleMasterWritePayload>("roles"),
  units: {
    ...resourceEntity<UnitMasterRecord, UnitMasterWritePayload>(BASE, "units"),
  },
  itemCreations: {
    ...resourceEntity<ItemMasterRecord, ItemMasterWritePayload>(BASE, "item-creations"),
    nextCode: () => fetchNextCode(`${BASE}/item-creations/next-code/`),
  },
  itemVariants: {
    ...resourceEntity<ItemMasterRecord, ItemMasterWritePayload>(BASE, "item-variants"),
    nextCode: () => fetchNextCode(`${BASE}/item-creations/next-code/`),
  },
  productTypeCategories: {
    list: (params: TableParams) => listResource<ProductTypeCategoryRecord>(`${BASE}/product-type-categories/`, params),
    lookup: () => lookupMaster(`${BASE}/product-type-categories/lookup/`),
    tree: (params: TableParams = {}) => coreApi
      .get<ProductTypeTreeCategoryRecord[]>(`${BASE}/product-type-categories/tree/`, { params: toParams(params) })
      .then((res) => res.data),
    nextCode: () => fetchNextCode(`${BASE}/product-type-categories/next-code/`),
    create: (payload: ProductTypeCategoryWritePayload) => coreApi
      .post<ProductTypeCategoryRecord>(`${BASE}/product-type-categories/`, payload)
      .then((res) => res.data),
    update: (id: number, payload: Partial<ProductTypeCategoryWritePayload>) => coreApi
      .put<ProductTypeCategoryRecord>(`${BASE}/product-type-categories/${id}/`, payload)
      .then((res) => res.data),
    delete: (id: number) => coreApi.delete(`${BASE}/product-type-categories/${id}/`).then(() => undefined),
    toggle: (id: number) => coreApi.patch<ProductTypeCategoryRecord>(`${BASE}/product-type-categories/${id}/toggle/`, {}).then((res) => res.data),
  },
  productTypeSubtypes: {
    list: (params: TableParams) => listResource<ProductTypeSubtypeRecord>(`${BASE}/product-type-subtypes/`, params),
    lookup: (params?: { category?: number | null; category_id?: number | null; search?: string }) =>
      lookupMaster(`${BASE}/product-type-subtypes/lookup/`, params ?? undefined) as Promise<ProductTypeSubtypeLookupItem[]>,
    nextCode: () => fetchNextCode(`${BASE}/product-type-subtypes/next-code/`),
    create: (payload: ProductTypeSubtypeWritePayload) => coreApi
      .post<ProductTypeSubtypeRecord>(`${BASE}/product-type-subtypes/`, payload)
      .then((res) => res.data),
    update: (id: number, payload: Partial<ProductTypeSubtypeWritePayload>) => coreApi
      .put<ProductTypeSubtypeRecord>(`${BASE}/product-type-subtypes/${id}/`, payload)
      .then((res) => res.data),
    delete: (id: number) => coreApi.delete(`${BASE}/product-type-subtypes/${id}/`).then(() => undefined),
    toggle: (id: number) => coreApi.patch<ProductTypeSubtypeRecord>(`${BASE}/product-type-subtypes/${id}/toggle/`, {}).then((res) => res.data),
  },
  productionTypes: master("production-types"),
  saleTypes: master("sale-types"),
  purchaseTypes: master("purchase-types"),
  scrapTypes: master<ScrapTypeMasterRecord, ScrapTypeMasterWritePayload>("scrap-types"),

  users: {
    ...resourceEntity<WPEUserRecord, WPEUserWritePayload>(BASE, "users"),
    lookup: () => lookupMaster(`${BASE}/users/lookup/`),
  },
};
