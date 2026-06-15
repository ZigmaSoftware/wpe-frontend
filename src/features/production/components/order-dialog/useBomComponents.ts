import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { BOMVariant } from "@/lib/types";

type UseBomComponentsOptions = {
  enabled?: boolean;
};

export const useBomComponents = (bomVariantId: number | null, options: UseBomComponentsOptions = {}) =>
  useQuery({
    queryKey: ["production-material-bom-components", bomVariantId],
    enabled: (options.enabled ?? true) && !!bomVariantId,
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/bom-variants/${bomVariantId}/`);
      return unwrapSuccessEnvelope(response.data as BOMVariant | unknown) as BOMVariant;
    },
  });
