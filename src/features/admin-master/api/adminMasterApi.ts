import { coreApi } from "@/lib/api";
import type {
  AdminMenuMain,
  AdminTableParams,
  DataTableResponse,
  LookupOption,
  MainScreenRecord,
  PaginatedResponse,
  PaginatedResult,
  PermissionAssignmentEntry,
  ResolvedPermissionResponse,
  ScreenSectionRecord,
  StaffRecord,
  UserAccountRecord,
  UserAccountWritePayload,
  UserPermissionRecord,
  UserScreenRecord,
  UserTypeRecord,
} from "@/features/admin-master/types";

const toParams = ({ page, pageSize, search, ordering, filters }: AdminTableParams) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...(filters ?? {}),
});

const normalizeList = <T>(payload: PaginatedResponse<T> | DataTableResponse<T> | T[]): PaginatedResult<T> => {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, filtered: payload.length };
  }
  if ("results" in payload) {
    return {
      items: payload.results,
      total: payload.count,
      filtered: payload.count,
    };
  }
  return {
    items: payload.data ?? [],
    total: Number(payload.recordsTotal ?? payload.data?.length ?? 0),
    filtered: Number(payload.recordsFiltered ?? payload.data?.length ?? 0),
  };
};

const unwrap = <T>(payload: { data: T } | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const listEntity = async <T>(path: string, params: AdminTableParams) => {
  const response = await coreApi.get<PaginatedResponse<T> | DataTableResponse<T> | T[]>(path, {
    params: toParams(params),
  });
  return normalizeList(response.data);
};

const createEntity = async <T>(path: string, payload: unknown) => {
  const response = await coreApi.post<{ data: T } | T>(path, payload);
  return unwrap(response.data);
};

const updateEntity = async <T>(path: string, payload: unknown) => {
  const response = await coreApi.put<{ data: T } | T>(path, payload);
  return unwrap(response.data);
};

const deleteEntity = async (path: string) => {
  await coreApi.delete(path);
};

const toggleEntity = async (path: string) => {
  const response = await coreApi.patch(path, {});
  return response.data;
};

export const adminMasterApi = {
  fetchPermissionMenu: async (userId?: number | null) => {
    const response = await coreApi.get<AdminMenuMain[]>("/api/users/user-permissions/menu/", {
      params: { user_id: userId ?? undefined },
    });
    return response.data;
  },
  fetchResolvedPermissions: async (params?: { userTypeId?: number | null; userId?: number | null }) => {
    const response = await coreApi.get<ResolvedPermissionResponse>("/api/users/user-permissions/resolved/", {
      params: {
        user_type: params?.userTypeId ?? undefined,
        user_id: params?.userId ?? undefined,
      },
    });
    return response.data;
  },

  listMainScreens: (params: AdminTableParams) => listEntity<MainScreenRecord>("/api/users/main-screens/", params),
  createMainScreen: (payload: Partial<MainScreenRecord>) => createEntity<MainScreenRecord>("/api/users/main-screens/", payload),
  updateMainScreen: (id: number, payload: Partial<MainScreenRecord>) => updateEntity<MainScreenRecord>(`/api/users/main-screens/${id}/`, payload),
  deleteMainScreen: (id: number) => deleteEntity(`/api/users/main-screens/${id}/`),
  toggleMainScreen: (id: number) => toggleEntity(`/api/users/main-screens/${id}/toggle-status/`),
  listMainScreenLookup: async () => {
    const response = await coreApi.get<LookupOption[]>("/api/users/main-screens/list/");
    return response.data;
  },

  listScreenSections: (params: AdminTableParams) => listEntity<ScreenSectionRecord>("/api/users/screen-sections/", params),
  createScreenSection: (payload: Partial<ScreenSectionRecord>) => createEntity<ScreenSectionRecord>("/api/users/screen-sections/", payload),
  updateScreenSection: (id: number, payload: Partial<ScreenSectionRecord>) => updateEntity<ScreenSectionRecord>(`/api/users/screen-sections/${id}/`, payload),
  deleteScreenSection: (id: number) => deleteEntity(`/api/users/screen-sections/${id}/`),
  toggleScreenSection: (id: number) => toggleEntity(`/api/users/screen-sections/${id}/toggle-status/`),
  lookupScreenSections: async (mainScreenId?: number | null) => {
    const response = await coreApi.get<LookupOption[]>("/api/users/screen-sections/lookup/", {
      params: { main_screen: mainScreenId ?? undefined, main_screen_id: mainScreenId ?? undefined },
    });
    return response.data;
  },

  listUserScreens: (params: AdminTableParams) => listEntity<UserScreenRecord>("/api/users/user-screens/", params),
  createUserScreen: (payload: Partial<UserScreenRecord>) => createEntity<UserScreenRecord>("/api/users/user-screens/", payload),
  updateUserScreen: (id: number, payload: Partial<UserScreenRecord>) => updateEntity<UserScreenRecord>(`/api/users/user-screens/${id}/`, payload),
  deleteUserScreen: (id: number) => deleteEntity(`/api/users/user-screens/${id}/`),
  toggleUserScreen: (id: number) => toggleEntity(`/api/users/user-screens/${id}/toggle-status/`),
  lookupUserScreens: async (params?: { mainScreenId?: number | null; screenSectionId?: number | null }) => {
    const response = await coreApi.get<LookupOption[]>("/api/users/user-screens/lookup/", {
      params: {
        main_screen: params?.mainScreenId ?? undefined,
        main_screen_id: params?.mainScreenId ?? undefined,
        screen_section: params?.screenSectionId ?? undefined,
        screen_section_id: params?.screenSectionId ?? undefined,
      },
    });
    return response.data;
  },

  listStaff: (params: AdminTableParams) => listEntity<StaffRecord>("/api/users/staff/", params),
  createStaff: (payload: Partial<StaffRecord>) => createEntity<StaffRecord>("/api/users/staff/", payload),
  updateStaff: (id: number, payload: Partial<StaffRecord>) => updateEntity<StaffRecord>(`/api/users/staff/${id}/`, payload),
  deleteStaff: (id: number) => deleteEntity(`/api/users/staff/${id}/`),
  toggleStaff: (id: number) => toggleEntity(`/api/users/staff/${id}/toggle-status/`),
  lookupStaff: async () => {
    const response = await coreApi.get<LookupOption[]>("/api/users/staff/lookup/");
    return response.data;
  },

  listUserTypes: (params: AdminTableParams) => listEntity<UserTypeRecord>("/api/users/user-types/", params),
  createUserType: (payload: Partial<UserTypeRecord>) => createEntity<UserTypeRecord>("/api/users/user-types/", payload),
  updateUserType: (id: number, payload: Partial<UserTypeRecord>) => updateEntity<UserTypeRecord>(`/api/users/user-types/${id}/`, payload),
  deleteUserType: (id: number) => deleteEntity(`/api/users/user-types/${id}/`),
  toggleUserType: (id: number) => toggleEntity(`/api/users/user-types/${id}/toggle-status/`),
  lookupUserTypes: async () => {
    const response = await coreApi.get<LookupOption[]>("/api/users/user-types/lookup/");
    return response.data;
  },

  listUserAccounts: (params: AdminTableParams) => listEntity<UserAccountRecord>("/api/users/users-creation/", params),
  createUserAccount: (payload: UserAccountWritePayload) => createEntity<UserAccountRecord>("/api/users/users-creation/", payload),
  updateUserAccount: (id: number, payload: Partial<UserAccountWritePayload>) => updateEntity<UserAccountRecord>(`/api/users/users-creation/${id}/`, payload),
  deleteUserAccount: (id: number) => deleteEntity(`/api/users/users-creation/${id}/`),
  toggleUserAccount: (id: number) => toggleEntity(`/api/users/users-creation/${id}/toggle-status/`),

  listUserPermissions: (params: AdminTableParams) => listEntity<UserPermissionRecord>("/api/users/user-permissions/", params),
  createUserPermission: (payload: Partial<UserPermissionRecord>) => createEntity<UserPermissionRecord>("/api/users/user-permissions/", payload),
  updateUserPermission: (id: number, payload: Partial<UserPermissionRecord>) => updateEntity<UserPermissionRecord>(`/api/users/user-permissions/${id}/`, payload),
  deleteUserPermission: (id: number) => deleteEntity(`/api/users/user-permissions/${id}/`),
  toggleUserPermission: (id: number) => toggleEntity(`/api/users/user-permissions/${id}/toggle-status/`),
  assignUserPermissions: async (userType: number, permissions: PermissionAssignmentEntry[]) => {
    const response = await coreApi.post("/api/users/user-permissions/assign/", {
      user_type: userType,
      permissions,
    });
    return response.data;
  },

  listCompaniesForSelect: async () => {
    const response = await coreApi.get("/api/masters/company/", {
      params: { page: 1, page_size: 200 },
    });
    const normalized = normalizeList<{ id: number; name?: string; company_name?: string; code?: string }>(response.data);
    return normalized.items.map((item) => ({
      id: item.id,
      name: item.name ?? item.company_name ?? `Company ${item.id}`,
      code: item.code ?? null,
    }));
  },
  lookupDepartments: async () => {
    return [] as LookupOption[];
  },
};
