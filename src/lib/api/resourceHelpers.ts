import { coreApi } from "@/lib/api";
import { normalizeListResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike => typeof value === "object" && value !== null;

export type LookupParams = Record<string, string | number | boolean | null | undefined>;

export type TableParamsLike = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
};

export const toParams = ({ page, pageSize, search, ordering, ...rest }: TableParamsLike = {}) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...rest,
});

const normalizePaginatedData = <T,>(payload: unknown) => {
  const normalized = unwrapSuccessEnvelope(payload);

  if (Array.isArray(normalized)) {
    return {
      items: normalized as T[],
      total: normalized.length,
    };
  }

  if (!isRecord(normalized)) {
    return {
      items: [] as T[],
      total: 0,
    };
  }

  if (Array.isArray(normalized.results)) {
    return {
      items: normalized.results as T[],
      total: typeof normalized.count === "number" ? normalized.count : normalized.results.length,
    };
  }

  if (Array.isArray(normalized.data)) {
    return {
      items: normalized.data as T[],
      total: normalized.data.length,
    };
  }

  if (isRecord(normalized.data) && Array.isArray(normalized.data.results)) {
    return {
      items: normalized.data.results as T[],
      total:
        typeof normalized.data.count === "number"
          ? normalized.data.count
          : normalized.data.results.length,
    };
  }

  return {
    items: [] as T[],
    total: 0,
  };
};

export async function listResource<T>(path: string, params: TableParamsLike = {}) {
  const res = await coreApi.get<unknown>(path, { params: toParams(params) });
  return normalizePaginatedData<T>(res.data);
}

export async function fetchLookup<T>(path: string, params?: LookupParams) {
  const res = await coreApi.get<unknown>(path, { params });
  return normalizeListResponse<T>(res.data);
}

export async function fetchNextCode(path: string) {
  const res = await coreApi.get<{ code: string }>(path);
  return res.data.code;
}

export async function createResource<TResponse, TPayload>(path: string, payload: TPayload) {
  const res = await coreApi.post<TResponse>(path, payload);
  return res.data;
}

export async function updateResource<TResponse, TPayload>(path: string, payload: TPayload) {
  const res = await coreApi.put<TResponse>(path, payload);
  return res.data;
}

export async function deleteResource(path: string) {
  await coreApi.delete(path);
}

export async function toggleResource<TResponse>(path: string) {
  const res = await coreApi.patch<TResponse>(path, {});
  return res.data;
}

export const codeMasterResource = <TRecord, TPayload>(base: string, resource: string) => ({
  list: (params: TableParamsLike) => listResource<TRecord>(`${base}/${resource}/`, params),
  lookup: (params?: LookupParams) => fetchLookup(`${base}/${resource}/lookup/`, params),
  nextCode: () => fetchNextCode(`${base}/${resource}/next-code/`),
  create: (payload: TPayload) => createResource<TRecord, TPayload>(`${base}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) =>
    updateResource<TRecord, Partial<TPayload>>(`${base}/${resource}/${id}/`, payload),
  delete: (id: number) => deleteResource(`${base}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => toggleResource<TRecord>(`${base}/${resource}/${id}/toggle/`),
});

export const resourceEntity = <TRecord, TPayload>(base: string, resource: string) => ({
  list: (params: TableParamsLike) => listResource<TRecord>(`${base}/${resource}/`, params),
  lookup: (params?: LookupParams) => fetchLookup(`${base}/${resource}/lookup/`, params),
  create: (payload: TPayload) => createResource<TRecord, TPayload>(`${base}/${resource}/`, payload),
  update: (id: number, payload: Partial<TPayload>) =>
    updateResource<TRecord, Partial<TPayload>>(`${base}/${resource}/${id}/`, payload),
  delete: (id: number) => deleteResource(`${base}/${resource}/${id}/`).then(() => undefined),
  toggle: (id: number) => toggleResource<TRecord>(`${base}/${resource}/${id}/toggle/`),
});
