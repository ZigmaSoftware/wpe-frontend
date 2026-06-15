import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope } from "@/lib/types";
import type { InventoryPage } from "@/features/items/types";

export type ProductionStage =
  | "ADDITIVE_WORK_CENTER"
  | "BLEND_WIP"
  | "BLENDING_WORK_CENTER"
| "GRANULATION_WIP"
  | "GRANULATION_WORK_CENTER"
  | "CONNECTION_TO_LINE"
  | "LINE_WORK_CENTER"
  | "DISCONNECTION_FROM_LINE";

export type WorkCenterLookupItem = {
  id: number;
  name: string;
  code?: string | null;
};

export type ProductionInventoryRow = {
  id: number;
  batch_code: string;
  inward_qty: string;
  outward_qty: string;
  item_code: string;
  item_name: string;
  balance_qty: string;
  uom: string;
  from_stage: string;
  to_stage: string;
  reference_no: string | null;
  scan_code: string | null;
  work_center: string | null;
  line: string | null;
  status: string;
  created_by: string;
  created_at: string;
};

const normalizePaginatedEnvelope = <T>(
  payload: ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>,
): InventoryPage<T> => {
  const unwrapped = unwrapSuccessEnvelope(payload);
  return {
    items: unwrapped.results ?? [],
    total: unwrapped.count ?? 0,
    next: unwrapped.next ?? null,
    previous: unwrapped.previous ?? null,
  };
};

export const productionInventoryApi = {
  listByStage: async (
    stage: ProductionStage,
    params: { page: number; pageSize: number; search?: string; workCenter?: string },
  ): Promise<InventoryPage<ProductionInventoryRow>> => {
    const response = await coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<ProductionInventoryRow>>>(
      "/api/inventory/production-inventory/",
      {
        params: {
          stage,
          page: params.page,
          page_size: params.pageSize,
          search: params.search?.trim() || undefined,
          work_center: params.workCenter?.trim() || undefined,
        },
      },
    );
    return normalizePaginatedEnvelope<ProductionInventoryRow>(response.data);
  },

  listAllByStage: async (
    stage: ProductionStage,
    params: { search?: string; workCenter?: string },
  ): Promise<ProductionInventoryRow[]> => {
    const pageSize = 200;
    let page = 1;
    const items: ProductionInventoryRow[] = [];

    while (page <= 100) {
      const response = await productionInventoryApi.listByStage(stage, {
        page,
        pageSize,
        search: params.search,
        workCenter: params.workCenter,
      });
      items.push(...response.items);
      if (!response.next || items.length >= response.total) break;
      page += 1;
    }

    return items;
  },
};

export const workCentreLookupApi = {
  list: async (): Promise<WorkCenterLookupItem[]> => {
    const response = await coreApi.get<WorkCenterLookupItem[]>(
      "/api/production/work-centre-creations/lookup/",
    );
    return response.data;
  },
};
