import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const useAdminTableSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () => ({
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("page_size") ?? "10"),
      search: searchParams.get("search") ?? "",
      ordering: searchParams.get("ordering") ?? "",
    }),
    [searchParams],
  );

  const update = (key: string, value?: string | number | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    if (key !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next, { replace: true });
  };

  return {
    ...values,
    setPage: (page: number) => update("page", page),
    setPageSize: (pageSize: number) => update("page_size", pageSize),
    setSearch: (search: string) => update("search", search),
    setOrdering: (ordering: string) => update("ordering", ordering),
    searchParams,
    setParam: update,
  };
};
