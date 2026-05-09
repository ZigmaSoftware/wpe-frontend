export const adminMasterKeys = {
  entity: (name: string, page: number, pageSize: number, search: string, ordering: string, filters: string) =>
    ["admin-master", name, page, pageSize, search, ordering, filters] as const,
  detail: (name: string, id: number | string) => ["admin-master", name, "detail", id] as const,
  lookup: (name: string, parent?: string | number | null) => ["admin-master", "lookup", name, parent] as const,
  permissionsMenu: (userId?: number | string | null) => ["admin-master", "menu", userId] as const,
  permissionsResolved: (subject?: string) => ["admin-master", "resolved", subject] as const,
};
