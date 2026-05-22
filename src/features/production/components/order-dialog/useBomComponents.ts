import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { BOMVariant } from "@/lib/types";

export const useBomComponents = (bomVariantId: number | null) =>
  useQuery({
    queryKey: ["production-material-bom-components", bomVariantId],
    enabled: !!bomVariantId,
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/bom-variants/${bomVariantId}/`);
      return unwrapSuccessEnvelope(response.data as BOMVariant | unknown) as BOMVariant;
    },
  });
