import { coreApi } from "@/lib/api";
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
  PaginatedResponse,
  ProductTypeCategoryRecord,
  ProductTypeCategoryWritePayload,
  ProductTypeSubtypeLookupItem,
  ProductTypeSubtypeRecord,
  ProductTypeSubtypeWritePayload,
  ProductTypeTreeCategoryRecord,
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

const toParams = ({ page, pageSize, search, ordering, ...rest }: TableParams) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...rest,
});

async function listMaster<TRecord extends MasterRecord>(path: string, params: TableParams) {
  const res = await coreApi.get<PaginatedResponse<TRecord>>(path, { params: toParams(params) });
  const data = res.data;
  return {
    items: Array.isArray(data) ? data : data.results ?? [],
    total: Array.isArray(data) ? data.length : data.count ?? 0,
  };
}

async function listResource<T>(path: string, params: TableParams) {
  const res = await coreApi.get<PaginatedResponse<T>>(path, { params: toParams(params) });
  const data = res.data;
  return {
    items: Array.isArray(data) ? data : data.results ?? [],
    total: Array.isArray(data) ? data.length : data.count ?? 0,
  };
}

async function createResource<TResponse, TPayload>(path: string, payload: TPayload) {
  const res = await coreApi.post<TResponse>(path, payload);
  return res.data;
}

async function updateResource<TResponse, TPayload>(path: string, payload: TPayload) {
  const res = await coreApi.put<TResponse>(path, payload);
  return res.data;
}

async function lookupMaster(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<LookupItem[]> {
  const res = await coreApi.get<LookupItem[]>(path, { params });
  return res.data;
}

async function fetchNextCode(path: string) {
  const res = await coreApi.get<{ code: string }>(path);
  return res.data.code;
}

async function createMaster<TRecord extends MasterRecord, TPayload extends MasterWritePayload>(path: string, payload: TPayload) {
  const res = await coreApi.post<TRecord>(path, payload);
  return res.data;
}

async function updateMaster<TRecord extends MasterRecord, TPayload extends MasterWritePayload>(path: string, payload: Partial<TPayload>) {
  const res = await coreApi.put<TRecord>(path, payload);
  return res.data;
}

async function deleteMaster(path: string) {
  await coreApi.delete(path);
}

async function toggleMaster<TRecord extends MasterRecord>(path: string) {
  const res = await coreApi.patch<TRecord>(path, {});
  return res.data;
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
  lookup: () => lookupMaster(`${BASE}/${resource}/lookup/`),
  nextCode: () => fetchNextCode(`${BASE}/${resource}/next-code/`),
  create: (payload: TPayload) => createResource<TRecord, TPayload>(`${BASE}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) => updateResource<TRecord, Partial<TPayload>>(`${BASE}/${resource}/${id}/`, payload),
  delete: (id: number) => coreApi.delete(`${BASE}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => coreApi.patch<TRecord>(`${BASE}/${resource}/${id}/toggle/`, {}).then((res) => res.data),
});

const resourceEntity = <TRecord, TPayload>(resource: string) => ({
  list: (params: TableParams) => listResource<TRecord>(`${BASE}/${resource}/`, params),
  lookup: (params?: Record<string, string | number | boolean | null | undefined>) => lookupMaster(`${BASE}/${resource}/lookup/`, params),
  create: (payload: TPayload) => createResource<TRecord, TPayload>(`${BASE}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) => updateResource<TRecord, Partial<TPayload>>(`${BASE}/${resource}/${id}/`, payload),
  delete: (id: number) => coreApi.delete(`${BASE}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => coreApi.patch<TRecord>(`${BASE}/${resource}/${id}/toggle/`, {}).then((res) => res.data),
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
    ...resourceEntity<UnitMasterRecord, UnitMasterWritePayload>("units"),
  },
  itemCreations: {
    ...resourceEntity<ItemMasterRecord, ItemMasterWritePayload>("item-creations"),
    nextCode: () => fetchNextCode(`${BASE}/item-creations/next-code/`),
  },
  itemVariants: {
    ...resourceEntity<ItemMasterRecord, ItemMasterWritePayload>("item-variants"),
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

  users: {
    list: async (params: TableParams) => {
      const res = await coreApi.get<PaginatedResponse<WPEUserRecord>>(`${BASE}/users/`, { params: toParams(params) });
      const data = res.data;
      return {
        items: Array.isArray(data) ? data : data.results ?? [],
        total: Array.isArray(data) ? data.length : data.count ?? 0,
      };
    },
    create: async (payload: WPEUserWritePayload) => {
      const res = await coreApi.post<WPEUserRecord>(`${BASE}/users/`, payload);
      return res.data;
    },
    update: async (id: number, payload: Partial<WPEUserWritePayload>) => {
      const res = await coreApi.put<WPEUserRecord>(`${BASE}/users/${id}/`, payload);
      return res.data;
    },
    delete: async (id: number) => {
      await coreApi.delete(`${BASE}/users/${id}/`);
    },
    toggle: async (id: number) => {
      const res = await coreApi.patch<WPEUserRecord>(`${BASE}/users/${id}/toggle/`, {});
      return res.data;
    },
    lookup: () => lookupMaster(`${BASE}/users/lookup/`),
  },
};
