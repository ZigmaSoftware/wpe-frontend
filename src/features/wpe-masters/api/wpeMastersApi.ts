import { coreApi } from "@/lib/api";
import type {
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
  WPEUserRecord,
  WPEUserWritePayload,
} from "@/features/wpe-masters/types";

const BASE = "/api/wpe-masters";

const toParams = ({ page, pageSize, search, ordering, ...rest }: TableParams) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...rest,
});

async function listMaster(path: string, params: TableParams) {
  const res = await coreApi.get<PaginatedResponse<MasterRecord>>(path, { params: toParams(params) });
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

async function lookupMaster(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<LookupItem[]> {
  const res = await coreApi.get<LookupItem[]>(path, { params });
  return res.data;
}

async function createMaster(path: string, payload: MasterWritePayload) {
  const res = await coreApi.post<MasterRecord>(path, payload);
  return res.data;
}

async function updateMaster(path: string, payload: Partial<MasterWritePayload>) {
  const res = await coreApi.put<MasterRecord>(path, payload);
  return res.data;
}

async function deleteMaster(path: string) {
  await coreApi.delete(path);
}

async function toggleMaster(path: string) {
  const res = await coreApi.patch<MasterRecord>(path, {});
  return res.data;
}

const master = (resource: string) => ({
  list: (params: TableParams) => listMaster(`${BASE}/${resource}/`, params),
  lookup: () => lookupMaster(`${BASE}/${resource}/lookup/`),
  create: (payload: MasterWritePayload) => createMaster(`${BASE}/${resource}/`, payload),
  update: (id: number, payload: Partial<MasterWritePayload>) => updateMaster(`${BASE}/${resource}/${id}/`, payload),
  delete: (id: number) => deleteMaster(`${BASE}/${resource}/${id}/`),
  toggle: (id: number) => toggleMaster(`${BASE}/${resource}/${id}/toggle/`),
});

export const wpeMastersApi = {
  locations: master("locations"),
  branches: master("branches"),
  priceBooks: master("price-books"),
  warehouses: master("warehouses"),
  productTypeCategories: {
    list: (params: TableParams) => listResource<ProductTypeCategoryRecord>(`${BASE}/product-type-categories/`, params),
    lookup: () => lookupMaster(`${BASE}/product-type-categories/lookup/`),
    tree: (params: TableParams = {}) => coreApi
      .get<ProductTypeTreeCategoryRecord[]>(`${BASE}/product-type-categories/tree/`, { params: toParams(params) })
      .then((res) => res.data),
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
  roles: master("roles"),
  departments: master("departments"),

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
  },
};
