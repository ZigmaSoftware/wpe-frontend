import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiPaginatedResult, ApiSuccessEnvelope } from "@/lib/types";
import type { InventoryPage } from "@/features/items/types";

export type ProductionStage =
  | "ADDITIVE_WORK_CENTER"
  | "BLEND_WIP"
  | "BLENDING_WORK_CENTER"
  | "BLEND_STORE"
  | "GRANULATION_WIP"
  | "GRANULATION_WORK_CENTER"
  | "GRANULATION_STORE"
  | "CONNECTION_TO_LINE"
  | "LINE_WORK_CENTER"
  | "DISCONNECTION_FROM_LINE";

export type ProductionInventoryTabStage = ProductionStage | "ALL";

export type WorkCenterLookupItem = {
  id: number;
  name: string;
  code?: string | null;
};

export type ProductionInventoryRow = {
  id: number;
  stage: ProductionStage;
  stage_label?: string;
  production_id: string;
  production_order_id?: number | null;
  planned_weight?: string | null;
  production_type: string;
  production: string;
  batch_no: string;
  batch_code: string;
  recipe_no?: string;
  std_batch_size?: string;
  inward_qty: string;
  outward_qty: string;
  item_code: string;
  item_name: string;
  balance_qty: string;
  captured_weight?: string;
  binlot?: string;
  baglot?: string;
  scancode?: string;
  connected_weight?: string;
  connected_at?: string | null;
  consumed_weight?: string;
  consumed_at?: string | null;
  consumed_bin_name?: string;
  consumed_scancode?: string;
  captured_stage_at?: string | null;
  captured_bin_name?: string;
  captured_bin_scancode?: string;
  captured_stage_weight?: string;
  scrap?: string;
  uom: string;
  source_stage: string;
  destination_stage: string;
  from_stage: string;
  to_stage: string;
  reference_no: string | null;
  scan_code: string | null;
  work_center: string | null;
  line: string | null;
  status: string;
  status_display?: string;
  gl_batch_count: number;
  created_by: string;
  created_at: string;
};

export type ProductionInventoryTotals = {
  total_inward_weight: string;
  total_current_weight: string;
  total_outward_weight: string;
  planned_weight: string;
};

export type ProductionInventoryListResult = InventoryPage<ProductionInventoryRow> & {
  totals: ProductionInventoryTotals;
};

export const productionInventoryApi = {
  listByStage: async (
    stage: ProductionInventoryTabStage,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      workCenter?: string;
      fromDate?: string;
      toDate?: string;
      includeHistory?: boolean;
    },
  ): Promise<ProductionInventoryListResult> => {
    const response = await coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<ProductionInventoryRow>>>(
      "/api/inventory/production-inventory/",
      {
        params: {
          stage,
          page: params.page,
          page_size: params.pageSize,
          search: params.search?.trim() || undefined,
          work_center: params.workCenter?.trim() || undefined,
          from_date: params.fromDate?.trim() || undefined,
          to_date: params.toDate?.trim() || undefined,
          include_history: params.includeHistory ? "true" : undefined,
        },
      },
    );
    const unwrapped = unwrapSuccessEnvelope(response.data) as ApiPaginatedResult<ProductionInventoryRow> & {
      totals?: ProductionInventoryTotals;
    };
    return {
      items: unwrapped.results ?? [],
      total: unwrapped.count ?? 0,
      next: unwrapped.next ?? null,
      previous: unwrapped.previous ?? null,
      totals: unwrapped.totals ?? {
        total_inward_weight: "0.000",
        total_current_weight: "0.000",
        total_outward_weight: "0.000",
        planned_weight: "0.000",
      },
    };
  },

  listAllByStage: async (
    stage: ProductionInventoryTabStage,
    params: { search?: string; workCenter?: string; fromDate?: string; toDate?: string; includeHistory?: boolean },
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
        fromDate: params.fromDate,
        toDate: params.toDate,
        includeHistory: params.includeHistory,
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
