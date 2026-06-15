import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { ProductTypeSubtypeLookupItem } from "@/features/wpe-masters/types";

export const useDebouncedItemSearch = (query: string, categoryId?: number | null, enabled = true) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["production-material-subtype-search", categoryId ?? "all", debouncedQuery],
    enabled: enabled && debouncedQuery.length >= 2,
    queryFn: () =>
      wpeMastersApi.productTypeSubtypes.lookup({
        category_id: categoryId ?? undefined,
        search: debouncedQuery,
      }),
    placeholderData: [] as ProductTypeSubtypeLookupItem[],
  });
};
