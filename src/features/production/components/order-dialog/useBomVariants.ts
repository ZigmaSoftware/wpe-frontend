import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { normalizeListResponse } from "@/lib/api-helpers";
import type { BOMVariant } from "@/lib/types";

type UseBomVariantsOptions = {
  enabled?: boolean;
};

export const useBomVariants = (productItemId: number | null, options: UseBomVariantsOptions = {}) =>
  useQuery({
    queryKey: ["production-material-bom-variants", productItemId],
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await coreApi.get<unknown>("/api/production/bom-variants/");
      const variants = normalizeListResponse<BOMVariant>(response.data);

      return variants.sort((left, right) => {
        const leftPriority = productItemId && left.product_item === productItemId ? 0 : 1;
        const rightPriority = productItemId && right.product_item === productItemId ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return left.variant_code.localeCompare(right.variant_code);
      });
    },
    staleTime: 5 * 60 * 1000,
  });
