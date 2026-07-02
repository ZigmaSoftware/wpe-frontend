import {
  BellRing,
  Boxes,
  Factory,
  FilePlus2,
  PackagePlus,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRoundPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import type { InventoryPage, InventorySummaryRow } from "@/features/items/types";
import {
  BLENDING_STOCK_ROUTE,
} from "@/features/blending/utils/routes";
import { productionWorkspaceApi, type ProductionStageValue } from "@/features/production/api/productionWorkspaceApi";
import { GRN_PROCESS_CREATE_ROUTE, GRN_PROCESS_ROUTE } from "@/features/grn/utils/routes";
import { REQUESTS_HEAD_APPROVAL_ROUTE, REQUESTS_STORE_REQUEST_ROUTE } from "@/features/requests/utils/routes";
import { RECIPE_BOM_MASTERS_ROUTE } from "@/features/recipe-bom-masters/utils/routes";
import { storeApi, type StoreDashboardSummary } from "@/features/store/api/storeApi";
import { PRODUCTION_NEW_ORDER_ROUTE } from "@/features/production/utils/routes";
import { STORE_RELEASE_STOCK_ROUTE, STORE_REQUEST_ROUTE, STORE_STOCK_ROUTE } from "@/features/store/utils/routes";
import { WPE_PRODUCT_TYPES_ROUTE } from "@/features/wpe-masters/constants";
import { coreApi, grnApi } from "@/lib/api";
import { formatDateTime, formatDecimal, normalizeGrnResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type {
  ApiPaginatedResult,
  ApiSuccessEnvelope,
  GrnListResponse,
  ProductionStageRecord,
  QcrItemLine,
  QcrRecord,
  StoreStockRequest,
} from "@/lib/types";
import type {
  DashboardActivityItem,
  DashboardBarDatum,
  DashboardDonutDatum,
  DashboardFooterStat,
  DashboardKpiCardData,
  DashboardOverview,
  DashboardPeriod,
  DashboardQuickAction,
  DashboardSparkPoint,
} from "@/components/dashboard/types";

type CountEnvelope<T> = ApiSuccessEnvelope<ApiPaginatedResult<T>> | ApiPaginatedResult<T>;

type DashboardRequestCounts = {
  openBlendingRequests: number;
  headApprovals: number;
  requestApprovals: number;
  releaseStock: number;
  activeRequests: number;
};

type ProductionDashboardData = {
  byStage: Record<ProductionStageValue, ProductionStageRecord[]>;
};

type CompletedGrnStatus = "Approved" | "Partial Rejected" | "Rejected";

type DashboardOverviewSources = {
  period: DashboardPeriod;
  storeDashboard?: StoreDashboardSummary | null;
  storeInventory?: InventoryPage<InventorySummaryRow> | null;
  blendingInventory?: InventoryPage<InventorySummaryRow> | null;
  grnActive?: GrnListResponse | null;
  grnPending?: GrnListResponse | null;
  qcrActive?: QcrRecord[] | null;
  qcrCompleted?: QcrRecord[] | null;
  production?: ProductionDashboardData | null;
  requestCounts?: DashboardRequestCounts | null;
  requestActivity?: StoreStockRequest[] | null;
  hasRouteAccess: (to: string) => boolean;
};

const KPI_TONES: Record<DashboardKpiCardData["tone"], { line: string; fill: string; accent: string }> = {
  orange: { line: "#f97316", fill: "rgba(249, 115, 22, 0.12)", accent: "#fff3eb" },
  blue: { line: "#2563eb", fill: "rgba(37, 99, 235, 0.12)", accent: "#eff6ff" },
  green: { line: "#16a34a", fill: "rgba(22, 163, 74, 0.12)", accent: "#edfdf1" },
  purple: { line: "#7c3aed", fill: "rgba(124, 58, 237, 0.12)", accent: "#f4edff" },
  amber: { line: "#ea580c", fill: "rgba(234, 88, 12, 0.12)", accent: "#fff5eb" },
};

const PRODUCTION_COLORS = ["#58c472", "#3b82f6", "#f59e0b", "#8b5cf6", "#c3cedc"] as const;
const GRN_COLORS = ["#58c472", "#3b82f6", "#f59e0b", "#ef4444"] as const;
const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "this-month": "This Month",
  "this-week": "This Week",
  today: "Today",
};

const REQUEST_ACTIVITY_FALLBACK: DashboardActivityItem[] = [
  {
    id: "fallback-grn",
    title: "GRN - WPE - 0012 moved to QCR",
    meta: "By Imran · 10 minutes ago",
    status: "GRN",
    tone: "info",
    icon: ReceiptText,
    sortTime: 4,
  },
  {
    id: "fallback-production",
    title: "Production Batch AD01 completed",
    meta: "By Imran · 45 minutes ago",
    status: "Production",
    tone: "success",
    icon: Factory,
    sortTime: 3,
  },
  {
    id: "fallback-request",
    title: "Store Request SR-0007 approved by Head",
    meta: "By Vijay K. · 1 hour ago",
    status: "Request",
    tone: "warning",
    icon: BellRing,
    sortTime: 2,
  },
  {
    id: "fallback-stock",
    title: "Stock received in Additive Work Center",
    meta: "By Systems · 2 hours ago",
    status: "Inventory",
    tone: "purple",
    icon: Boxes,
    sortTime: 1,
  },
];

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toTimestamp = (value?: string | null) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatRelativeMeta = (timestamp?: string | null, actor?: string | null, fallbackActor = "System") => {
  const time = toTimestamp(timestamp);
  const actorLabel = actor?.trim() || fallbackActor;

  if (!time) {
    return `By ${actorLabel}`;
  }

  try {
    return `By ${actorLabel} · ${formatDistanceToNow(time, { addSuffix: true })}`;
  } catch {
    return `By ${actorLabel} · ${formatDateTime(timestamp)}`;
  }
};

const createSparkline = (value: number, direction: DashboardKpiCardData["trendDirection"], tone: DashboardKpiCardData["tone"]) => {
  const base = Math.max(value, 1);
  const modifiers =
    direction === "down"
      ? [1.08, 1.04, 1.03, 0.98, 1.01, 0.95, 0.97, 0.93]
      : [0.76, 0.82, 0.87, 0.85, 0.93, 0.98, 0.96, 1.02];

  return modifiers.map((modifier, index) => ({
    label: `${tone}-${index}`,
    value: Number((base * modifier).toFixed(2)),
  })) satisfies DashboardSparkPoint[];
};

const normalizeCountEnvelope = <T,>(payload: CountEnvelope<T>) => {
  const unwrapped = unwrapSuccessEnvelope(payload);
  return Number(unwrapped.count ?? 0);
};

const fetchCount = async <T,>(url: string, params?: Record<string, string | number | undefined>) => {
  const response = await coreApi.get<CountEnvelope<T>>(url, {
    params: {
      page: 1,
      page_size: 1,
      ...params,
    },
  });
  return normalizeCountEnvelope(response.data);
};

const fetchRequestActivity = async () => {
  const response = await coreApi.get<CountEnvelope<StoreStockRequest>>("/api/blending/store-requests/", {
    params: {
      page: 1,
      page_size: 4,
    },
  });

  const payload = unwrapSuccessEnvelope(response.data);
  return payload.results ?? [];
};

const collectAllStageRecords = async (stage: ProductionStageValue) => {
  const pageSize = 200;
  let page = 1;
  const items: ProductionStageRecord[] = [];

  while (page <= 100) {
    const result = await productionWorkspaceApi.listStageRecords({
      stage,
      page,
      pageSize,
    });

    items.push(...result.results);

    if (!result.next || items.length >= result.count) {
      break;
    }

    page += 1;
  }

  return items;
};

const readQcrItems = (record: QcrRecord) => {
  const qcrItems = Array.isArray(record.qcr_items) && record.qcr_items.length > 0 ? record.qcr_items : [];
  const inlineItems = Array.isArray(record.items) && record.items.length > 0 ? record.items : [];
  return (qcrItems.length > 0 ? qcrItems : inlineItems) as QcrItemLine[];
};

const sumQcrItemValues = (record: QcrRecord, keys: Array<keyof QcrItemLine>) => {
  const items = readQcrItems(record);
  const total = items.reduce((sum, item) => {
    const firstValue = keys.map((key) => toNumber(item[key] as string | number | null | undefined)).find((value) => value > 0);
    return sum + (firstValue ?? 0);
  }, 0);
  return total;
};

const getCompletedGrnStatus = (record: QcrRecord): CompletedGrnStatus => {
  const rawStatus = typeof record.status === "string" ? record.status.trim().toLowerCase() : "";
  const sourceStatus =
    typeof record.source_grn_data?.process_status === "string"
      ? String(record.source_grn_data.process_status).trim().toLowerCase()
      : "";
  const status = rawStatus || sourceStatus;

  if (status.includes("partial")) {
    return "Partial Rejected";
  }

  if (status.includes("reject")) {
    return status === "rejected" ? "Rejected" : "Partial Rejected";
  }

  return "Approved";
};

const getQcrSupplier = (record: QcrRecord) => {
  const sourceSupplier = record.source_grn_data?.supplier_details;
  if (sourceSupplier && typeof sourceSupplier === "object") {
    const tradeName = (sourceSupplier as { trade_name?: unknown }).trade_name;
    if (typeof tradeName === "string" && tradeName.trim()) {
      return tradeName.trim();
    }
  }

  const tradeName = record.source_grn_data?.trade_name;
  return typeof tradeName === "string" && tradeName.trim() ? tradeName.trim() : "Unknown supplier";
};

const getQcrGrnDate = (record: QcrRecord) => {
  const sourceGrnDate = record.source_grn_data?.grn_date;
  if (typeof sourceGrnDate === "string" && sourceGrnDate.trim()) {
    return sourceGrnDate;
  }

  const snapshotGrnDate = record.snapshot?.grn_date;
  return typeof snapshotGrnDate === "string" && snapshotGrnDate.trim() ? snapshotGrnDate : null;
};

const getQcrRequestedDate = (record: QcrRecord) => {
  const sourceRequirement = record.source_grn_data?.document_requirement_details;
  if (sourceRequirement && typeof sourceRequirement === "object") {
    const reqDate = (sourceRequirement as { req_date?: unknown }).req_date;
    if (typeof reqDate === "string" && reqDate.trim()) {
      return reqDate;
    }
  }

  const snapshotRequirement = record.snapshot?.document_requirement_details;
  if (snapshotRequirement && typeof snapshotRequirement === "object") {
    const reqDate = (snapshotRequirement as { req_date?: unknown }).req_date;
    if (typeof reqDate === "string" && reqDate.trim()) {
      return reqDate;
    }
  }

  return null;
};

const percentValue = (value: number, total: number) => (total > 0 ? Number(((value / total) * 100).toFixed(0)) : 0);

const formatStat = (value: number, suffix = "") => {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${formatDecimal(value, 1)}${suffix}`;
};

const createProductionBreakdown = (production?: ProductionDashboardData | null) => {
  if (!production) {
    return {
      totalBatches: 0,
      completionRate: 0,
      breakdown: [
        { label: "AD - Weightage", value: 0, color: PRODUCTION_COLORS[0], percent: 0 },
        { label: "BL - Blending", value: 0, color: PRODUCTION_COLORS[1], percent: 0 },
        { label: "GL - Granulation", value: 0, color: PRODUCTION_COLORS[2], percent: 0 },
        { label: "PR - Production", value: 0, color: PRODUCTION_COLORS[3], percent: 0 },
        { label: "Completed", value: 0, color: PRODUCTION_COLORS[4], percent: 0 },
      ] satisfies DashboardDonutDatum[],
      unavailable: true,
    };
  }

  const adCount = production.byStage.AD.length;
  const blCount = production.byStage.BL.length;
  const glCount = production.byStage.GL.length;
  const completedCount = production.byStage.PR.filter(
    (row) =>
      row.workflow_status === "COMPLETED" ||
      ["PLAN_COMPLETED", "COMPLETED", "CLOSED"].includes(String(row.status).toUpperCase()),
  ).length;
  const prCount = Math.max(production.byStage.PR.length - completedCount, 0);
  const totalBatches = adCount + blCount + glCount + prCount + completedCount;
  const breakdownBase = [
    { label: "AD - Weightage", value: adCount, color: PRODUCTION_COLORS[0] },
    { label: "BL - Blending", value: blCount, color: PRODUCTION_COLORS[1] },
    { label: "GL - Granulation", value: glCount, color: PRODUCTION_COLORS[2] },
    { label: "PR - Production", value: prCount, color: PRODUCTION_COLORS[3] },
    { label: "Completed", value: completedCount, color: PRODUCTION_COLORS[4] },
  ];

  return {
    totalBatches,
    completionRate: totalBatches > 0 ? Math.round((completedCount / totalBatches) * 100) : 0,
    breakdown: breakdownBase.map((item) => ({
      ...item,
      percent: percentValue(item.value, totalBatches),
    })),
    unavailable: false,
  };
};

const createGrnBreakdown = ({
  grnActive,
  grnPending,
  qcrActive,
  qcrCompleted,
}: Pick<DashboardOverviewSources, "grnActive" | "grnPending" | "qcrActive" | "qcrCompleted">) => {
  const pendingCount = grnPending?.data.length ?? 0;
  const qcrCount = qcrActive?.length ?? 0;
  const completedApproved = (qcrCompleted ?? []).filter((record) => getCompletedGrnStatus(record) === "Approved").length;
  const completedRejected = (qcrCompleted ?? []).filter((record) => getCompletedGrnStatus(record) !== "Approved").length;
  const total = completedApproved + qcrCount + pendingCount + completedRejected;

  const qtyReceived = [...(qcrActive ?? []), ...(qcrCompleted ?? [])].reduce(
    (sum, record) => sum + sumQcrItemValues(record, ["accepted_qty", "received_qty", "sent_qty"]),
    0,
  );

  const supplierSet = new Set<string>();
  (grnActive?.data ?? []).forEach((record) => {
    const supplier = record.supplier_details.trade_name || record.trade_name || "";
    if (supplier.trim()) {
      supplierSet.add(supplier.trim());
    }
  });
  (grnPending?.data ?? []).forEach((record) => {
    const supplier = record.supplier_details.trade_name || record.trade_name || "";
    if (supplier.trim()) {
      supplierSet.add(supplier.trim());
    }
  });
  [...(qcrActive ?? []), ...(qcrCompleted ?? [])].forEach((record) => {
    const supplier = getQcrSupplier(record);
    if (supplier.trim()) {
      supplierSet.add(supplier.trim());
    }
  });

  const comparableRecords = [
    ...(grnActive?.data ?? []).map((record) => ({
      grnDate: record.grn_date,
      reqDate: record.document_requirement_details.req_date ?? null,
    })),
    ...(grnPending?.data ?? []).map((record) => ({
      grnDate: record.grn_date,
      reqDate: record.document_requirement_details.req_date ?? null,
    })),
    ...(qcrActive ?? []).map((record) => ({
      grnDate: getQcrGrnDate(record),
      reqDate: getQcrRequestedDate(record),
    })),
    ...(qcrCompleted ?? []).map((record) => ({
      grnDate: getQcrGrnDate(record),
      reqDate: getQcrRequestedDate(record),
    })),
  ].filter((entry) => entry.grnDate && entry.reqDate);

  const onTimeCount = comparableRecords.filter((entry) => {
    const grnDate = new Date(entry.grnDate as string).getTime();
    const reqDate = new Date(entry.reqDate as string).getTime();
    return Number.isFinite(grnDate) && Number.isFinite(reqDate) && grnDate <= reqDate;
  }).length;

  return {
    totalGrns: total,
    totalQtyReceived: formatStat(qtyReceived, " Kgs"),
    suppliers: String(supplierSet.size),
    onTimeRate: comparableRecords.length ? `${Math.round((onTimeCount / comparableRecords.length) * 100)}%` : "--",
    breakdown: [
      { label: "Completed", value: completedApproved, color: GRN_COLORS[0], percent: percentValue(completedApproved, total) },
      { label: "QCR", value: qcrCount, color: GRN_COLORS[1], percent: percentValue(qcrCount, total) },
      { label: "Pending", value: pendingCount, color: GRN_COLORS[2], percent: percentValue(pendingCount, total) },
      { label: "Rejected", value: completedRejected, color: GRN_COLORS[3], percent: percentValue(completedRejected, total) },
    ] satisfies DashboardDonutDatum[],
    unavailable: !grnPending && !qcrActive && !qcrCompleted,
  };
};

const createStockSummary = ({
  storeDashboard,
  storeInventory,
}: Pick<DashboardOverviewSources, "storeDashboard" | "storeInventory">) => {
  const rows = [...(storeInventory?.items ?? [])]
    .sort((left, right) => toNumber(right.current_stock) - toNumber(left.current_stock))
    .slice(0, 8);

  return {
    bars: rows.map((row) => ({
      label: row.item_name,
      shortLabel: row.item_name.length > 14 ? `${row.item_name.slice(0, 12)}…` : row.item_name,
      value: Number(toNumber(row.current_stock).toFixed(1)),
    })) satisfies DashboardBarDatum[],
    totalStock: `${formatDecimal(rows.reduce((sum, row) => sum + toNumber(row.current_stock), 0), 1)} Kgs`,
    stores: String(storeDashboard?.warehouses ?? 0),
    lowStockAlerts: String(rows.filter((row) => toNumber(row.current_stock) <= 0).length),
    unavailable: !storeInventory,
  };
};

const buildDashboardQuickActions = (hasRouteAccess: (to: string) => boolean) => {
  const actions = [
    { id: "new-grn", label: "New GRN", to: GRN_PROCESS_CREATE_ROUTE, icon: FilePlus2, tone: "green" },
    { id: "new-production", label: "New Production", to: PRODUCTION_NEW_ORDER_ROUTE, icon: Factory, tone: "orange" },
    { id: "store-request", label: "Store Request", to: REQUESTS_STORE_REQUEST_ROUTE, icon: ReceiptText, tone: "blue" },
    { id: "add-contact", label: "Add Contact", to: "/app/contacts/new", icon: UserRoundPlus, tone: "purple" },
    { id: "add-item", label: "Add Item", to: WPE_PRODUCT_TYPES_ROUTE, icon: PackagePlus, tone: "orange" },
    { id: "bom-variants", label: "BOM Variants", to: `${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`, icon: Boxes, tone: "green" },
    { id: "gate-entry", label: "Gate Entry", to: `${GRN_PROCESS_ROUTE}?tab=active`, icon: Truck, tone: "purple" },
    { id: "qcr-queue", label: "QCR Queue", to: `${GRN_PROCESS_ROUTE}?tab=moved-to-qcr`, icon: ShieldCheck, tone: "blue" },
  ] satisfies Array<DashboardQuickAction>;

  return actions.filter((action) => hasRouteAccess(action.to));
};

const buildRecentActivity = ({
  grnPending,
  qcrActive,
  qcrCompleted,
  production,
  requestActivity,
}: Pick<DashboardOverviewSources, "grnPending" | "qcrActive" | "qcrCompleted" | "production" | "requestActivity">) => {
  const items: DashboardActivityItem[] = [];

  for (const record of qcrActive ?? []) {
    items.push({
      id: `qcr-active-${record.id}`,
      title: `GRN - ${record.grn_reference_no} moved to QCR`,
      meta: formatRelativeMeta(record.moved_to_qcr_at, record.moved_to_qcr_by, "System"),
      status: "GRN",
      tone: "info",
      icon: ReceiptText,
      href: `${GRN_PROCESS_ROUTE}?tab=moved-to-qcr`,
      sortTime: toTimestamp(record.moved_to_qcr_at || record.updated_at),
    });
  }

  for (const record of qcrCompleted ?? []) {
    items.push({
      id: `qcr-completed-${record.id}`,
      title:
        getCompletedGrnStatus(record) === "Approved"
          ? `GRN ${record.generated_grn_no || record.grn_reference_no} completed`
          : `GRN ${record.generated_grn_no || record.grn_reference_no} marked rejected`,
      meta: formatRelativeMeta(record.qcr_completed_at || record.updated_at, record.qcr_completed_by || record.moved_to_qcr_by, "System"),
      status: getCompletedGrnStatus(record) === "Approved" ? "Completed" : "Rejected",
      tone: getCompletedGrnStatus(record) === "Approved" ? "success" : "danger",
      icon: ShieldCheck,
      href: `${GRN_PROCESS_ROUTE}?tab=next-grn`,
      sortTime: toTimestamp(record.qcr_completed_at || record.updated_at),
    });
  }

  for (const record of grnPending?.data ?? []) {
    items.push({
      id: `grn-pending-${record.id}`,
      title: `Gate Entry ${record.grn_no} moved to GRN Pending`,
      meta: formatRelativeMeta(record.updated_at, record.moved_to_qcr_by || record.supplier_details.person_name, "System"),
      status: "Pending",
      tone: "warning",
      icon: Truck,
      href: `${GRN_PROCESS_ROUTE}?tab=grn-pending`,
      sortTime: toTimestamp(record.updated_at),
    });
  }

  for (const stage of ["PR", "GL", "BL", "AD"] as ProductionStageValue[]) {
    for (const record of production?.byStage[stage] ?? []) {
      const completed =
        record.workflow_status === "COMPLETED" ||
        ["PLAN_COMPLETED", "COMPLETED", "CLOSED"].includes(String(record.status).toUpperCase());
      items.push({
        id: `production-${stage}-${record.id}`,
        title: completed
          ? `Production Batch ${record.display_batch_no || record.production_id} completed`
          : `${stage} Batch ${record.display_batch_no || record.production_id} in progress`,
        meta: formatRelativeMeta(record.end_date_time || record.start_date_time || record.production_date, record.production_id, "Production"),
        status: "Production",
        tone: completed ? "success" : "purple",
        icon: Factory,
        href: PRODUCTION_NEW_ORDER_ROUTE,
        sortTime: toTimestamp(record.end_date_time || record.start_date_time || record.production_date),
      });
    }
  }

  for (const request of requestActivity ?? []) {
    const displayId = request.request_no || `SR-${request.id}`;
    const statusLabel =
      request.status === "PENDING_HEAD_APPROVAL"
        ? "created"
        : request.status === "PENDING_REQUEST_PROCESS"
          ? "approved by Head"
          : request.status === "PENDING_STOCK_RELEASE"
            ? "moved for stock release"
            : "updated";
    const actor =
      request.head_action_by_username ||
      request.approved_by_username ||
      request.released_by_username ||
      request.requested_by_username;

    items.push({
      id: `request-${request.id}`,
      title: `Store Request ${displayId} ${statusLabel}`,
      meta: formatRelativeMeta(
        request.released_at || request.processed_at || request.approved_at || request.requested_at,
        actor,
        "System",
      ),
      status: "Request",
      tone: "warning",
      icon: BellRing,
      href: REQUESTS_STORE_REQUEST_ROUTE,
      sortTime: toTimestamp(request.released_at || request.processed_at || request.approved_at || request.requested_at),
    });
  }

  return items.length
    ? items.sort((left, right) => right.sortTime - left.sortTime).slice(0, 4)
    : REQUEST_ACTIVITY_FALLBACK;
};

export const fetchDashboardRequestCounts = async () => {
  const [
    pendingHeadCount,
    pendingProcessCount,
    pendingReleaseCount,
    headApprovalCount,
    requestApprovals,
    releaseStock,
  ] = await Promise.all([
    fetchCount<StoreStockRequest>("/api/blending/store-requests/", { status: "PENDING_HEAD_APPROVAL" }),
    fetchCount<StoreStockRequest>("/api/blending/store-requests/", { status: "PENDING_REQUEST_PROCESS" }),
    fetchCount<StoreStockRequest>("/api/blending/store-requests/", { status: "PENDING_STOCK_RELEASE" }),
    fetchCount<StoreStockRequest>("/api/blending/head-approvals/"),
    fetchCount<StoreStockRequest>("/api/store/requests/", { queue: "request_process" }),
    fetchCount<StoreStockRequest>("/api/store/requests/", { queue: "release_stock" }),
  ]);

  return {
    openBlendingRequests: pendingHeadCount + pendingProcessCount + pendingReleaseCount,
    headApprovals: headApprovalCount,
    requestApprovals,
    releaseStock,
    activeRequests: pendingHeadCount + requestApprovals + releaseStock,
  } satisfies DashboardRequestCounts;
};

export const fetchDashboardRequestActivity = fetchRequestActivity;

export const fetchProductionDashboard = async () => {
  const [ad, bl, gl, pr] = await Promise.all([
    collectAllStageRecords("AD"),
    collectAllStageRecords("BL"),
    collectAllStageRecords("GL"),
    collectAllStageRecords("PR"),
  ]);

  return {
    byStage: {
      AD: ad,
      BL: bl,
      GL: gl,
      PR: pr,
    },
  } satisfies ProductionDashboardData;
};

export const buildDashboardOverview = ({
  period,
  storeDashboard,
  storeInventory,
  blendingInventory,
  grnActive,
  grnPending,
  qcrActive,
  qcrCompleted,
  production,
  requestCounts,
  requestActivity,
  hasRouteAccess,
}: DashboardOverviewSources): DashboardOverview => {
  const productionSummary = createProductionBreakdown(production);
  const stockSummary = createStockSummary({ storeDashboard, storeInventory });
  const grnOverview = createGrnBreakdown({ grnActive, grnPending, qcrActive, qcrCompleted });

  const kpis: DashboardKpiCardData[] = [
    {
      id: "store-stock-rows",
      label: "Store Stock Rows",
      value: storeInventory?.total ?? null,
      trendLabel: "+2 this week",
      trendDirection: "up",
      sparkline: createSparkline(storeInventory?.total ?? 0, "up", "orange"),
      icon: Boxes,
      href: hasRouteAccess(STORE_STOCK_ROUTE) ? STORE_STOCK_ROUTE : undefined,
      tone: "orange",
      unavailable: !storeInventory,
    },
    {
      id: "blending-stock-rows",
      label: "Blending Stock Rows",
      value: blendingInventory?.total ?? null,
      trendLabel: "+1 this week",
      trendDirection: "up",
      sparkline: createSparkline(blendingInventory?.total ?? 0, "up", "blue"),
      icon: Factory,
      href: hasRouteAccess(BLENDING_STOCK_ROUTE) ? BLENDING_STOCK_ROUTE : undefined,
      tone: "blue",
      unavailable: !blendingInventory,
    },
    {
      id: "gate-entry-pending",
      label: "Gate Entry (Pending)",
      value: grnPending?.data.length ?? null,
      trendLabel: "+2 this week",
      trendDirection: "up",
      sparkline: createSparkline(grnPending?.data.length ?? 0, "up", "green"),
      icon: Truck,
      href: hasRouteAccess(`${GRN_PROCESS_ROUTE}?tab=grn-pending`) ? `${GRN_PROCESS_ROUTE}?tab=grn-pending` : undefined,
      tone: "green",
      unavailable: !grnPending,
    },
    {
      id: "qcr-queue",
      label: "QCR Queue",
      value: qcrActive?.length ?? null,
      trendLabel: "+1 this week",
      trendDirection: "up",
      sparkline: createSparkline(qcrActive?.length ?? 0, "up", "purple"),
      icon: ShieldCheck,
      href: hasRouteAccess(`${GRN_PROCESS_ROUTE}?tab=moved-to-qcr`) ? `${GRN_PROCESS_ROUTE}?tab=moved-to-qcr` : undefined,
      tone: "purple",
      unavailable: !qcrActive,
    },
    {
      id: "active-requests",
      label: "Active Requests",
      value: requestCounts?.activeRequests ?? null,
      trendLabel: "-1 this week",
      trendDirection: "down",
      sparkline: createSparkline(requestCounts?.activeRequests ?? 0, "down", "amber"),
      icon: BellRing,
      href: hasRouteAccess(REQUESTS_STORE_REQUEST_ROUTE) ? REQUESTS_STORE_REQUEST_ROUTE : undefined,
      tone: "amber",
      unavailable: !requestCounts,
    },
  ];

  return {
    period,
    kpis,
    production: {
      totalBatches: productionSummary.totalBatches,
      completionRate: productionSummary.completionRate,
      trendLabel: "vs last month +8%",
      trendDirection: "up",
      breakdown: productionSummary.breakdown,
      unavailable: productionSummary.unavailable,
    },
    stockSummary,
    grnOverview,
    recentActivity: buildRecentActivity({
      grnPending,
      qcrActive,
      qcrCompleted,
      production,
      requestActivity,
    }),
    pendingApprovals: [
      {
        id: "store-requests",
        label: "Store Requests",
        count: requestCounts?.openBlendingRequests ?? null,
        to: REQUESTS_STORE_REQUEST_ROUTE,
        unavailable: !requestCounts,
      },
      {
        id: "head-approvals",
        label: "Head Approvals",
        count: requestCounts?.headApprovals ?? null,
        to: REQUESTS_HEAD_APPROVAL_ROUTE,
        unavailable: !requestCounts,
      },
      {
        id: "request-approvals",
        label: "Request Approvals",
        count: requestCounts?.requestApprovals ?? null,
        to: STORE_REQUEST_ROUTE,
        unavailable: !requestCounts,
      },
      {
        id: "release-stock",
        label: "Release Stock",
        count: requestCounts?.releaseStock ?? null,
        to: STORE_RELEASE_STOCK_ROUTE,
        unavailable: !requestCounts,
      },
    ],
    quickActions: buildDashboardQuickActions(hasRouteAccess),
  };
};

export const fetchDashboardStoreSnapshot = async () => {
  const [storeDashboard, storeInventory, blendingInventory] = await Promise.all([
    storeApi.getDashboard(),
    itemsInventoryApi.listSummary("store", { page: 1, pageSize: 8 }),
    itemsInventoryApi.listSummary("blending", { page: 1, pageSize: 8 }),
  ]);

  return { storeDashboard, storeInventory, blendingInventory };
};

export const fetchGrnActiveRecords = async () => {
  const response = await grnApi.get<GrnListResponse>("/api/grn/");
  return normalizeGrnResponse(response.data);
};

export const fetchGrnPendingRecords = async () => {
  const response = await grnApi.get<GrnListResponse>("/api/grn/pending/");
  return normalizeGrnResponse(response.data);
};

export const fetchQcrActiveRecords = async () => {
  const response = await grnApi.get<QcrRecord[]>("/api/qcr/");
  return response.data;
};

export const fetchQcrCompletedRecords = async () => {
  const response = await grnApi.get<QcrRecord[]>("/api/qcr/completed/");
  return response.data;
};

export const getDashboardPeriodLabel = (period: DashboardPeriod) => PERIOD_LABELS[period];
export const getKpiToneStyles = (tone: DashboardKpiCardData["tone"]) => KPI_TONES[tone];
export const getFooterToneClassName = (tone: DashboardFooterStat["tone"] = "default") => {
  switch (tone) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-600";
    case "danger":
      return "text-rose-600";
    case "info":
      return "text-blue-600";
    default:
      return "text-slate-900";
  }
};
