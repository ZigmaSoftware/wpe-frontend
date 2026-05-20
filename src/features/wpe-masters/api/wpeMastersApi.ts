import { coreApi } from "@/lib/api";
import { normalizeListResponse, normalizePaginatedResponse, toQueryParams, unwrapMutationPayload } from "@/lib/api-helpers";
import type {
  LookupItem,
  MasterRecord,
  MasterWritePayload,
  PaginatedResponse,
  PermissionRow,
  TableParams,
  UserScreenPermRow,
  WPEUserRecord,
  WPEUserWritePayload,
} from "@/features/wpe-masters/types";

const BASE = "/api/wpe-masters";

async function listMaster(path: string, params: TableParams) {
  const res = await coreApi.get<PaginatedResponse<MasterRecord>>(path, { params: toQueryParams(params) });
  const data = normalizePaginatedResponse<MasterRecord>(res.data);
  return {
    items: data.items,
    total: data.total,
  };
}

async function lookupMaster(path: string): Promise<LookupItem[]> {
  const res = await coreApi.get<LookupItem[]>(path);
  return normalizeListResponse<LookupItem>(res.data);
}

async function createMaster(path: string, payload: MasterWritePayload) {
  const res = await coreApi.post<MasterRecord>(path, payload);
  return unwrapMutationPayload(res.data);
}

async function updateMaster(path: string, payload: Partial<MasterWritePayload>) {
  const res = await coreApi.put<MasterRecord>(path, payload);
  return unwrapMutationPayload(res.data);
}

async function deleteMaster(path: string) {
  await coreApi.delete(path);
}

async function toggleMaster(path: string) {
  const res = await coreApi.patch<MasterRecord>(path, {});
  return unwrapMutationPayload(res.data);
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
  productionTypes: master("production-types"),
  saleTypes: master("sale-types"),
  purchaseTypes: master("purchase-types"),
  roles: master("roles"),
  departments: master("departments"),

  users: {
    list: async (params: TableParams) => {
      const res = await coreApi.get<PaginatedResponse<WPEUserRecord>>(`${BASE}/users/`, { params: toQueryParams(params) });
      const data = normalizePaginatedResponse<WPEUserRecord>(res.data);
      return {
        items: data.items,
        total: data.total,
      };
    },
    create: async (payload: WPEUserWritePayload) => {
      const res = await coreApi.post<WPEUserRecord>(`${BASE}/users/`, payload);
      return unwrapMutationPayload(res.data);
    },
    update: async (id: number, payload: Partial<WPEUserWritePayload>) => {
      const res = await coreApi.put<WPEUserRecord>(`${BASE}/users/${id}/`, payload);
      return unwrapMutationPayload(res.data);
    },
    delete: async (id: number) => {
      await coreApi.delete(`${BASE}/users/${id}/`);
    },
    toggle: async (id: number) => {
      const res = await coreApi.patch<WPEUserRecord>(`${BASE}/users/${id}/toggle/`, {});
      return unwrapMutationPayload(res.data);
    },
  },

  rolePermissions: {
    listScreens: async (): Promise<{ id: number; name: string; code: string; order_no: number }[]> => {
      const res = await coreApi.get<{ id: number; name: string; code: string; order_no: number }[]>(
        `${BASE}/role-permissions/screens/`,
      );
      return normalizeListResponse(res.data);
    },
    getMatrix: async (mainScreenId: number): Promise<PermissionRow[]> => {
      const res = await coreApi.get<PermissionRow[]>(`${BASE}/role-permissions/matrix/`, {
        params: { main_screen_id: mainScreenId },
      });
      return normalizeListResponse<PermissionRow>(res.data);
    },
    bulkSave: async (mainScreenId: number, permissions: PermissionRow[]): Promise<void> => {
      await coreApi.post(`${BASE}/role-permissions/bulk-save/`, {
        main_screen_id: mainScreenId,
        permissions,
      });
    },
  },

  userScreenPermissions: {
    listScreens: async (): Promise<{ id: number; name: string; code: string; order_no: number }[]> => {
      const res = await coreApi.get<{ id: number; name: string; code: string; order_no: number }[]>(
        `${BASE}/user-screen-permissions/screens/`,
      );
      return normalizeListResponse(res.data);
    },
    getMatrix: async (mainScreenId: number): Promise<UserScreenPermRow[]> => {
      const res = await coreApi.get<UserScreenPermRow[]>(`${BASE}/user-screen-permissions/matrix/`, {
        params: { main_screen_id: mainScreenId },
      });
      return normalizeListResponse<UserScreenPermRow>(res.data);
    },
    bulkSave: async (mainScreenId: number, permissions: UserScreenPermRow[]): Promise<void> => {
      await coreApi.post(`${BASE}/user-screen-permissions/bulk-save/`, {
        main_screen_id: mainScreenId,
        permissions,
      });
    },
  },
};
