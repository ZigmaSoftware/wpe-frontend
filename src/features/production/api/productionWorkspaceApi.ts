import { coreApi } from "@/lib/api";
import { normalizeListResponse } from "@/lib/api-helpers";
import { normalizePaginatedResult } from "@/lib/api/pagination";
import type { ApiPaginatedResult, ApiSuccessEnvelope, ProductionOrder, ProductionStageRecord } from "@/lib/types";

export type ProductionStageValue = "AD" | "BL" | "GL" | "PR";

export type ProductionStageListParams = {
  stage: ProductionStageValue;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export const productionWorkspaceApi = {
  listOrders: async () => {
    const response = await coreApi.get<unknown>("/api/production/production/");
    return normalizeListResponse<ProductionOrder>(response.data);
  },
  listStageRecords: async ({
    stage,
    search,
    status,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  }: ProductionStageListParams) => {
    const response = await coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<ProductionStageRecord>>>(
      "/api/production/stage-records/",
      {
        params: {
          stage,
          search: search?.trim() || undefined,
          status: status && status !== "all" ? status : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: pageSize,
        },
      },
    );
    return normalizePaginatedResult<ProductionStageRecord>(response.data);
  },
};
