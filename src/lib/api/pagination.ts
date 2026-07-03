import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope } from "@/lib/types";

export type PaginatedEnvelope<T> = ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>;

export type PaginatedPage<T> = {
  items: T[];
  total: number;
  next: string | null;
  previous: string | null;
};

export const normalizePaginatedEnvelope = <T,>(payload: PaginatedEnvelope<T>): PaginatedPage<T> => {
  const normalized = unwrapSuccessEnvelope<ApiPaginatedResult<T>>(payload);

  return {
    items: normalized.results ?? [],
    total: normalized.count ?? 0,
    next: normalized.next ?? null,
    previous: normalized.previous ?? null,
  };
};

export const normalizePaginatedResult = <T,>(payload: PaginatedEnvelope<T>): ApiPaginatedResult<T> => {
  const normalized = normalizePaginatedEnvelope(payload);

  return {
    count: normalized.total,
    next: normalized.next,
    previous: normalized.previous,
    results: normalized.items,
  };
};

export const collectAllPages = async <T,>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedPage<T>>,
  options?: {
    pageSize?: number;
    maxPages?: number;
  },
) => {
  const pageSize = options?.pageSize ?? 200;
  const maxPages = options?.maxPages ?? 100;
  let page = 1;
  let total = 0;
  const items: T[] = [];

  while (page <= maxPages) {
    const response = await fetchPage(page, pageSize);
    items.push(...response.items);
    total = response.total;

    if (!response.next || items.length >= total) {
      break;
    }

    page += 1;
  }

  return items;
};
