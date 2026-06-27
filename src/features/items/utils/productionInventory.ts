import type {
  ProductionInventoryRow,
  ProductionInventoryTabStage,
  ProductionStage,
} from "@/features/items/api/productionInventoryApi";
import { formatDecimal } from "@/lib/api-helpers";

export type ProductionInventoryTabKey = ProductionInventoryTabStage;

export type ProductionInventoryTabDefinition = {
  key: ProductionInventoryTabKey;
  label: string;
  stage: ProductionInventoryTabStage;
};

export type ProductionInventorySummaryRow = {
  id: string;
  productionId: string;
  productionOrderId: number | null;
  production: string;
  batchCount: number;
  totalWeight: number;
  plannedWeight: number;
  uom: string;
  createdBy: string;
  createdAt: string | null;
  rows: ProductionInventoryRow[];
};

export type ProductionInventoryBatchRow = {
  id: string;
  batchId: string;
  weight: number;
  uom: string;
  status: "IN_PROGRESS" | "COMPLETED";
  rows: ProductionInventoryRow[];
};

export const PRODUCTION_INVENTORY_TABS: ProductionInventoryTabDefinition[] = [
  { key: "ALL", label: "All", stage: "ALL" },
  { key: "ADDITIVE_WORK_CENTER", label: "Additive Work Center", stage: "ADDITIVE_WORK_CENTER" },
  { key: "BLEND_WIP", label: "Blend WIP", stage: "BLEND_WIP" },
  { key: "BLEND_STORE", label: "Blend Store", stage: "BLEND_STORE" },
  { key: "GRANULATION_WORK_CENTER", label: "Granulation Work Center", stage: "GRANULATION_WORK_CENTER" },
  { key: "GRANULATION_STORE", label: "Granulation Store", stage: "GRANULATION_STORE" },
  { key: "CONNECTION_TO_LINE", label: "Connection to Line", stage: "CONNECTION_TO_LINE" },
  { key: "LINE_WORK_CENTER", label: "Line Work Center", stage: "LINE_WORK_CENTER" },
  { key: "DISCONNECTION_FROM_LINE", label: "Disconnection from Line", stage: "DISCONNECTION_FROM_LINE" },
];

const parseQuantity = (value?: string | null) => {
  const numeric = Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : 0;
};

export const parseInventoryQuantity = parseQuantity;

const getTransitionStage = (row: ProductionInventoryRow) =>
  row.to_stage?.trim() || row.destination_stage?.trim() || "";

export const getInventoryText = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};

export const getDisplayedInventoryBatch = (row: ProductionInventoryRow) =>
  row.batch_no?.trim() || row.batch_code?.trim() || row.reference_no?.trim() || "—";

export const isProductionInventoryLineStage = (stage: ProductionStage) =>
  stage === "CONNECTION_TO_LINE" || stage === "LINE_WORK_CENTER" || stage === "DISCONNECTION_FROM_LINE";

export const getProductionInventoryStatusLabel = (row: ProductionInventoryRow) =>
  row.status_display?.trim() || row.status?.trim() || "-";

export const getDisplayedStageQuantity = (stage: ProductionStage, row: ProductionInventoryRow) => {
  void stage;
  const balanceQty = Math.max(parseQuantity(row.balance_qty), 0);
  if (balanceQty > 0) {
    return balanceQty;
  }

  const inwardQty = Math.max(parseQuantity(row.inward_qty), 0);
  const outwardQty = Math.max(parseQuantity(row.outward_qty), 0);
  const nextStage = getTransitionStage(row);

  if (inwardQty > 0 && (outwardQty > 0 || nextStage)) {
    return inwardQty;
  }

  return 0;
};

export const getDisplayedInventoryStatus = (stage: ProductionStage, row: ProductionInventoryRow) => {
  const rawStatus = row.status?.trim() || "IN_PROGRESS";
  const nextStage = getTransitionStage(row);
  const outwardQty = parseQuantity(row.outward_qty);

  if (stage === "BLEND_WIP" && nextStage === "BLEND_STORE" && outwardQty > 0) {
    return "COMPLETED";
  }

  if (stage === "GRANULATION_WORK_CENTER" && nextStage === "GRANULATION_STORE" && outwardQty > 0) {
    return "COMPLETED";
  }

  return rawStatus;
};

export const buildStageRows = (
  stage: ProductionStage,
  apiRows: ProductionInventoryRow[],
  granulationWorkCenterRows: ProductionInventoryRow[] = [],
  granulationStoreRows: ProductionInventoryRow[] = [],
) => {
  void stage;
  void granulationWorkCenterRows;
  void granulationStoreRows;
  return apiRows.filter((row) => getDisplayedStageQuantity(row.stage, row) > 0);
};

export const groupProductionInventorySummaryRows = (
  stage: ProductionStage,
  rows: ProductionInventoryRow[],
) => {
  const summaryMap = new Map<string, ProductionInventorySummaryRow>();

  for (const row of rows) {
    const productionId = row.production_id?.trim() || "—";
    const existing = summaryMap.get(productionId);
    const weight = getDisplayedStageQuantity(stage, row);
    const batchId = getDisplayedInventoryBatch(row);

    if (!existing) {
      summaryMap.set(productionId, {
        id: productionId,
        productionId,
        productionOrderId: row.production_order_id ?? null,
        production: row.production || row.production_type || "—",
        batchCount: batchId && batchId !== "—" ? 1 : 0,
        totalWeight: weight,
        plannedWeight: parseQuantity(row.planned_weight),
        uom: row.uom?.trim() || "",
        createdBy: row.created_by || "System",
        createdAt: row.created_at || null,
        rows: [row],
      });
      continue;
    }

    existing.rows.push(row);
    existing.totalWeight += weight;
    existing.plannedWeight = existing.plannedWeight || parseQuantity(row.planned_weight);
    existing.uom = existing.uom || row.uom?.trim() || "";
    if (!existing.production || existing.production === "—") {
      existing.production = row.production || row.production_type || "—";
    }
    if ((!existing.createdBy || existing.createdBy === "System") && row.created_by) {
      existing.createdBy = row.created_by;
    }
    if ((!existing.createdAt || row.created_at < existing.createdAt) && row.created_at) {
      existing.createdAt = row.created_at;
    }
  }

  return Array.from(summaryMap.values())
    .map((summary) => ({
      ...summary,
      batchCount: new Set(
        summary.rows
          .map((row) => getDisplayedInventoryBatch(row))
          .filter((batchId) => batchId && batchId !== "—"),
      ).size,
    }))
    .sort((left, right) => {
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      return rightDate - leftDate;
    });
};

export const groupProductionInventoryBatchRows = (
  stage: ProductionStage,
  rows: ProductionInventoryRow[],
) => {
  const batchMap = new Map<string, ProductionInventoryBatchRow>();

  for (const row of rows) {
    const batchId = getDisplayedInventoryBatch(row);
    const existing = batchMap.get(batchId);
    const weight = getDisplayedStageQuantity(stage, row);
    const status = getDisplayedInventoryStatus(stage, row) === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS";

    if (!existing) {
      batchMap.set(batchId, {
        id: batchId,
        batchId,
        weight,
        uom: row.uom?.trim() || "",
        status,
        rows: [row],
      });
      continue;
    }

    existing.rows.push(row);
    existing.weight += weight;
    existing.uom = existing.uom || row.uom?.trim() || "";
    if (status !== "COMPLETED") {
      existing.status = "IN_PROGRESS";
    }
  }

  return Array.from(batchMap.values());
};

export const filterProductionInventorySummaryRows = (
  rows: ProductionInventorySummaryRow[],
  search: string,
  workCenter: string,
) => {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedWorkCenter = workCenter.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesSearch =
      !normalizedSearch ||
      row.productionId.toLowerCase().includes(normalizedSearch) ||
      row.production.toLowerCase().includes(normalizedSearch) ||
      row.createdBy.toLowerCase().includes(normalizedSearch);

    const matchesWorkCenter =
      !normalizedWorkCenter ||
      row.rows.some((entry) => (entry.work_center || "").trim().toLowerCase() === normalizedWorkCenter);

    return matchesSearch && matchesWorkCenter;
  });
};

export const filterProductionInventoryBatchRows = (
  rows: ProductionInventoryBatchRow[],
  search: string,
  workCenter: string,
) => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedWorkCenter = workCenter.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.batchId.toLowerCase().includes(normalizedSearch) ||
        row.rows.some((entry) =>
          `${entry.item_code} ${entry.item_name} ${entry.production_id}`.toLowerCase().includes(normalizedSearch),
        );

      const matchesWorkCenter =
        !normalizedWorkCenter ||
        row.rows.some((entry) => (entry.work_center || "").trim().toLowerCase() === normalizedWorkCenter);

      return matchesSearch && matchesWorkCenter;
    });
};

export const getProductionInventoryStatusBadgeClasses = (status: "IN_PROGRESS" | "COMPLETED") =>
  status === "COMPLETED"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-violet-100 text-violet-700";

export const formatInventoryWeight = (value: number) => formatDecimal(value.toFixed(3));

export const formatInventoryWeightWithUnit = (value: number, uom?: string | null) => {
  const formattedWeight = formatInventoryWeight(value);
  const normalizedUnit = uom?.trim();

  return normalizedUnit ? `${formattedWeight} ${normalizedUnit}` : formattedWeight;
};

export const formatInventoryDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
