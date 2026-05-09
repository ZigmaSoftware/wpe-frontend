import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const useTableSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(
    () => ({
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 10),
      search: searchParams.get("search") ?? "",
    }),
    [searchParams],
  );

  const patch = (updates: Partial<typeof state>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || Number.isNaN(value)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, { replace: true });
  };

  return {
    ...state,
    setPage: (page: number) => patch({ page }),
    setPageSize: (pageSize: number) => patch({ pageSize, page: 1 }),
    setSearch: (search: string) => patch({ search, page: 1 }),
  };
};
