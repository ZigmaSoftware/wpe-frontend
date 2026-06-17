import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { itemsInventoryQueryKeys } from "@/features/items/api/queryKeys";
import { productionInventoryApi, workCentreLookupApi, type ProductionInventoryRow, type ProductionStage, type WorkCenterLookupItem } from "@/features/items/api/productionInventoryApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InventoryHistorySheet from "@/features/items/components/InventoryHistorySheet";
import {
  INVENTORY_MODULES,
  type InventoryHistoryState,
  type InventoryHistoryTarget,
  type InventorySummaryRow,
  type InventorySummaryState,
} from "@/features/items/types";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";

type TabKey = "BLENDING_INVENTORY" | ProductionStage;

type TabDef = {
  key: TabKey;
  label: string;
  stage: ProductionStage | null;
};

const TABS: TabDef[] = [
  { key: "BLENDING_INVENTORY", label: "Blending Inventory", stage: null },
  { key: "ADDITIVE_WORK_CENTER", label: "Additive Work Center", stage: "ADDITIVE_WORK_CENTER" },
  { key: "BLEND_WIP", label: "Blend WIP", stage: "BLEND_WIP" },
  { key: "BLENDING_WORK_CENTER", label: "Blending Work Center", stage: "BLENDING_WORK_CENTER" },
  { key: "BLEND_STORE", label: "Blend Store", stage: "BLEND_STORE" },
  { key: "GRANULATION_WIP", label: "Granulation WIP", stage: "GRANULATION_WIP" },
  { key: "GRANULATION_WORK_CENTER", label: "Granulation Work Center", stage: "GRANULATION_WORK_CENTER" },
  { key: "GRANULATION_STORE", label: "Granulation Store", stage: "GRANULATION_STORE" },
  { key: "CONNECTION_TO_LINE", label: "Connection to Line", stage: "CONNECTION_TO_LINE" },
  { key: "LINE_WORK_CENTER", label: "Line Work Center", stage: "LINE_WORK_CENTER" },
  { key: "DISCONNECTION_FROM_LINE", label: "Disconnection from Line", stage: "DISCONNECTION_FROM_LINE" },
];

const createSummaryState = (): InventorySummaryState => ({ page: 1, pageSize: 20, search: "" });
const createHistoryState = (): InventoryHistoryState => ({ page: 1, pageSize: 10, search: "", dateFrom: "", dateTo: "" });

type TabState = { page: number; pageSize: number; search: string; workCenter: string };
const createTabState = (): TabState => ({ page: 1, pageSize: 20, search: "", workCenter: "" });

const getToolbarPageSizeValue = (pageSize: number): StorePageSizeValue =>
  pageSize === 10 || pageSize === 20 || pageSize === 50 || pageSize === 100
    ? (String(pageSize) as StorePageSizeValue)
    : "20";

const parseStageQuantity = (value?: string | null) => {
  const numeric = Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : 0;
};

const getInventoryLineageSuffix = (row: ProductionInventoryRow) => {
  const source = `${row.batch_no || row.batch_code || row.reference_no || ""}`.trim().toUpperCase();
  const match = source.match(/(-\d+)$/);
  if (match) {
    return match[1];
  }
  return source || "—";
};

const getInventoryRowKey = (row: ProductionInventoryRow) =>
  `${row.production_id?.trim() || "—"}::${getInventoryLineageSuffix(row)}`;

const getTransitionStage = (row: ProductionInventoryRow) =>
  row.to_stage?.trim() || row.destination_stage?.trim() || "";

const getDisplayedInventoryBatch = (row: ProductionInventoryRow) =>
  row.batch_no?.trim() || row.batch_code?.trim() || row.reference_no?.trim() || "—";

const isMovedFromBlendStoreToGranulationWip = (row: ProductionInventoryRow) =>
  getTransitionStage(row) === "GRANULATION_WIP" &&
  parseStageQuantity(row.outward_qty) > 0 &&
  parseStageQuantity(row.balance_qty) <= 0;

const isMovedFromGranulationWorkCenterToGranulationStore = (
  row: ProductionInventoryRow,
  granulationStoreRowKeys?: Set<string>,
) =>
  getTransitionStage(row) === "GRANULATION_STORE" &&
  (
    (parseStageQuantity(row.outward_qty) > 0 && parseStageQuantity(row.balance_qty) <= 0) ||
    granulationStoreRowKeys?.has(getInventoryRowKey(row)) === true
  );

const getDisplayedInventoryStatus = (stage: ProductionStage, row: ProductionInventoryRow) => {
  const rawStatus = row.status?.trim() || "IN_PROGRESS";
  const nextStage = getTransitionStage(row);
  const outwardQty = parseStageQuantity(row.outward_qty);

  if (stage === "BLEND_WIP" && nextStage === "BLEND_STORE" && outwardQty > 0) {
    return "COMPLETED";
  }

  if (stage === "BLEND_STORE" && isMovedFromBlendStoreToGranulationWip(row)) {
    return "COMPLETED";
  }

  if (stage === "GRANULATION_WORK_CENTER" && nextStage === "GRANULATION_STORE" && outwardQty > 0) {
    return "COMPLETED";
  }

  return rawStatus;
};

const mapBlendStoreRowToGranulationWipRow = (row: ProductionInventoryRow): ProductionInventoryRow => ({
  ...row,
  stage: "GRANULATION_WIP",
  source_stage: row.source_stage || "BLEND_STORE",
  destination_stage: "GRANULATION_WIP",
  from_stage: row.from_stage || "BLEND_STORE",
  to_stage: "GRANULATION_WIP",
  inward_qty: row.outward_qty || row.inward_qty,
  outward_qty: "0",
  balance_qty: row.outward_qty || row.balance_qty,
  status: "IN_PROGRESS",
});

const mapGranulationWorkCenterRowToGranulationStoreRow = (row: ProductionInventoryRow): ProductionInventoryRow => ({
  ...row,
  stage: "GRANULATION_STORE",
  source_stage: row.source_stage || "GRANULATION_WORK_CENTER",
  destination_stage: "GRANULATION_STORE",
  from_stage: row.from_stage || "GRANULATION_WORK_CENTER",
  to_stage: "GRANULATION_STORE",
  inward_qty: row.outward_qty || row.balance_qty || row.inward_qty,
  outward_qty: "0",
  balance_qty: row.outward_qty || row.balance_qty || row.inward_qty,
  status: "IN_PROGRESS",
});

const ProductionInventoryPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("BLENDING_INVENTORY");

  // Blending inventory tab state (uses existing API)
  const [blendingState, setBlendingState] = useState<InventorySummaryState>(createSummaryState);
  const deferredBlendingSearch = useDeferredValue(blendingState.search.trim());

  // Blending history sheet state
  const [historyState, setHistoryState] = useState<InventoryHistoryState>(createHistoryState);
  const [historyTarget, setHistoryTarget] = useState<InventoryHistoryTarget | null>(null);
  const deferredHistorySearch = useDeferredValue(historyState.search.trim());

  // Production stage tabs state (one per tab)
  const [stageStates, setStageStates] = useState<Record<string, TabState>>(() =>
    Object.fromEntries(
      TABS.filter((t) => t.stage !== null).map((t) => [t.key, createTabState()]),
    ),
  );

  const activeStage = TABS.find((t) => t.key === activeTab)?.stage ?? null;
  const deferredStageSearch = useDeferredValue((stageStates[activeTab]?.search ?? "").trim());

  const getDisplayedStageQuantity = (stage: ProductionStage | null, row: ProductionInventoryRow) => {
    if (stage === "ADDITIVE_WORK_CENTER") {
      return row.inward_qty;
    }

    if (parseStageQuantity(row.balance_qty) > 0) {
      return row.balance_qty;
    }

    if (parseStageQuantity(row.outward_qty) > 0) {
      return row.outward_qty;
    }

    return row.inward_qty || row.balance_qty;
  };

  // Blending inventory query
  const blendingQuery = useQuery({
    queryKey: itemsInventoryQueryKeys.summary("blending", {
      ...blendingState,
      deferredSearch: deferredBlendingSearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listSummary("blending", {
        page: blendingState.page,
        pageSize: blendingState.pageSize,
        search: deferredBlendingSearch,
      }),
    enabled: activeTab === "BLENDING_INVENTORY",
    retry: false,
    placeholderData: (prev) => prev,
  });

  // History query for blending tab
  const historyQuery = useQuery({
    enabled: Boolean(historyTarget),
    queryKey: itemsInventoryQueryKeys.history("blending", historyTarget?.row.item_id ?? null, {
      ...historyState,
      deferredSearch: deferredHistorySearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listHistory("blending", historyTarget!.row.item_id, {
        page: historyState.page,
        pageSize: historyState.pageSize,
        search: deferredHistorySearch,
        dateFrom: historyState.dateFrom,
        dateTo: historyState.dateTo,
      }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  // Work center lookup (for Additive Work Center and other stage tabs)
  const workCenterQuery = useQuery({
    queryKey: ["production-masters", "work-centres", "lookup"],
    queryFn: () => workCentreLookupApi.list(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const workCenterOptions: WorkCenterLookupItem[] = workCenterQuery.data ?? [];

  const activeWorkCenter = stageStates[activeTab]?.workCenter ?? "";

  // Production stage query
  const stageQuery = useQuery({
    queryKey: [
      "production-inventory",
      activeStage,
      deferredStageSearch,
      stageStates[activeTab]?.page,
      stageStates[activeTab]?.pageSize,
      activeWorkCenter,
    ],
    queryFn: () =>
      productionInventoryApi.listByStage(activeStage as ProductionStage, {
        page: stageStates[activeTab]?.page ?? 1,
        pageSize: stageStates[activeTab]?.pageSize ?? 20,
        search: deferredStageSearch,
        workCenter: activeWorkCenter || undefined,
      }),
    enabled: activeStage !== null,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const blendStoreRowsForGranulationWipQuery = useQuery({
    queryKey: ["production-inventory", "BLEND_STORE", "granulation-wip-bridge"],
    queryFn: () =>
      productionInventoryApi.listAllByStage("BLEND_STORE", {}),
    enabled: activeStage === "GRANULATION_WIP",
    retry: false,
    staleTime: 30 * 1000,
  });

  const granulationWorkCenterRowsForGranulationStoreQuery = useQuery({
    queryKey: ["production-inventory", "GRANULATION_WORK_CENTER", "granulation-store-bridge"],
    queryFn: () =>
      productionInventoryApi.listAllByStage("GRANULATION_WORK_CENTER", {}),
    enabled: activeStage === "GRANULATION_STORE" || activeStage === "GRANULATION_WORK_CENTER",
    retry: false,
    staleTime: 30 * 1000,
  });

  const granulationStoreRowsQuery = useQuery({
    queryKey: ["production-inventory", "GRANULATION_STORE", "granulation-store-status-bridge"],
    queryFn: () =>
      productionInventoryApi.listAllByStage("GRANULATION_STORE", {}),
    enabled: activeStage === "GRANULATION_STORE" || activeStage === "GRANULATION_WORK_CENTER",
    retry: false,
    staleTime: 30 * 1000,
  });

  const updateBlendingState = (updater: (s: InventorySummaryState) => InventorySummaryState) =>
    setBlendingState((s) => updater(s));

  const updateStageState = (key: string, updater: (s: TabState) => TabState) =>
    setStageStates((s) => ({ ...s, [key]: updater(s[key] ?? createTabState()) }));

  const updateHistoryState = (updater: (s: InventoryHistoryState) => InventoryHistoryState) =>
    setHistoryState((s) => updater(s));

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
  };

  const openHistory = (row: InventorySummaryRow) => {
    setHistoryTarget({ module: "blending", row });
    setHistoryState(createHistoryState());
  };

  // Blending export
  const handleBlendingExport = async (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<InventorySummaryRow>[] = [
        { label: "Item Code", value: (row) => row.item_code },
        { label: "Item Name", value: (row) => row.item_name },
        { label: "Current Stock", value: (row) => formatDecimal(row.current_stock) },
        { label: "Unit", value: (row) => row.unit },
        { label: "Total Inward", value: (row) => formatDecimal(row.total_inward) },
        { label: "Total Outward", value: (row) => formatDecimal(row.total_outward) },
        { label: "Last Updated", value: (row) => formatDateTime(row.last_updated) },
      ];
      const rows = await itemsInventoryApi.listAllSummary("blending", { search: deferredBlendingSearch });
      exportTableData({ title: "Blending Inventory", filename: "blending-inventory", rows, columns, format });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export blending inventory."));
    }
  };

  // Stage export
  const handleStageExport = async (stage: ProductionStage, label: string, format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<ProductionInventoryRow>[] = [
        { label: "S.No", value: (_, i) => i + 1 },
        { label: "Prd ID", value: (row) => row.production_id },
        { label: "Production", value: (row) => row.production },
        { label: "Batch No", value: (row) => getDisplayedInventoryBatch(row) },
        { label: "Item Code", value: (row) => row.item_code },
        { label: "Item Name", value: (row) => row.item_name },
        { label: "Weight", value: (row) => getDisplayedStageQuantity(stage, row) },
        { label: "Inward Qty", value: (row) => row.inward_qty },
        { label: "Outward Qty", value: (row) => row.outward_qty },
        { label: "UOM", value: (row) => row.uom },
        { label: "GL Batch Count", value: (row) => row.gl_batch_count },
        { label: "Scan Code / Sticker Code", value: (row) => row.scan_code ?? "" },
        { label: "Line", value: (row) => row.line ?? "" },
        { label: "Status", value: (row) => getDisplayedInventoryStatus(stage, row) },
        { label: "Created By", value: (row) => row.created_by },
        { label: "Created Date & Time", value: (row) => formatDateTime(row.created_at) },
      ];
      const apiRows = await productionInventoryApi.listAllByStage(stage, {
        search: stageStates[activeTab]?.search,
        workCenter: stageStates[activeTab]?.workCenter || undefined,
      });
      const rows =
        stage === "GRANULATION_WIP"
          ? [
              ...((blendStoreRowsForGranulationWipQuery.data ?? [])
                .filter(isMovedFromBlendStoreToGranulationWip)
                .map(mapBlendStoreRowToGranulationWipRow)),
              ...apiRows,
            ]
          : stage === "GRANULATION_STORE"
            ? [
                ...((granulationWorkCenterRowsForGranulationStoreQuery.data ?? [])
                  .filter((row) =>
                    isMovedFromGranulationWorkCenterToGranulationStore(
                      row,
                      new Set((granulationStoreRowsQuery.data ?? []).map(getInventoryRowKey)),
                    ),
                  )
                  .map(mapGranulationWorkCenterRowToGranulationStoreRow)),
                ...apiRows,
              ]
          : apiRows;
      exportTableData({ title: label, filename: `production-inventory-${stage.toLowerCase()}`, rows, columns, format });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export production inventory."));
    }
  };

  const renderBlendingTab = () => {
    const config = INVENTORY_MODULES.blending;
    const query = blendingQuery;
    const state = blendingState;
    const rows = query.data?.items ?? [];
    const total = query.data?.total ?? 0;

    if (query.isLoading) {
      return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={state.search}
            onSearchChange={(value) => updateBlendingState((s) => ({ ...s, search: value, page: 1 }))}
            pageSize={getToolbarPageSizeValue(state.pageSize)}
            onPageSizeChange={(value) =>
              updateBlendingState((s) => ({ ...s, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
            }
            pageSizeOptions={["10", "20", "50", "100"]}
            onExport={(format) => { void handleBlendingExport(format); }}
            summaryText="Loading blending inventory..."
            isFetching
          />
          <div className="py-8 text-sm text-muted-foreground">Loading blending inventory...</div>
        </div>
      );
    }

    if (query.isError) {
      return (
        <ErrorState description={getApiErrorMessage(query.error, config.accessDescription)} />
      );
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={state.search}
          onSearchChange={(value) => updateBlendingState((s) => ({ ...s, search: value, page: 1 }))}
          pageSize={getToolbarPageSizeValue(state.pageSize)}
          onPageSizeChange={(value) =>
            updateBlendingState((s) => ({ ...s, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onExport={(format) => { void handleBlendingExport(format); }}
          summaryText={`${total} blending rows available`}
          isFetching={query.isFetching}
        />
        {rows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-26rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                  <TableRow className="hover:bg-card">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Total Inward</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Total Outward</TableHead>
                    <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={`${row.item_id}-${row.item_code}`}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => openHistory(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openHistory(row);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-card-foreground">{row.item_name}</div>
                            <div className="truncate font-mono text-xs text-muted-foreground">{row.item_code}</div>
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground md:hidden">
                              <div>Unit: {row.unit}</div>
                              <div>Updated: {formatDateTime(row.last_updated)}</div>
                            </div>
                          </div>
                          <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-card-foreground">{formatDecimal(row.current_stock)}</TableCell>
                      <TableCell className="hidden md:table-cell">{row.unit}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{formatDecimal(row.total_inward)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{formatDecimal(row.total_outward)}</TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDateTime(row.last_updated)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <StoreTablePagination
              page={state.page}
              pageSize={state.pageSize}
              total={total}
              onPageChange={(page) => updateBlendingState((s) => ({ ...s, page }))}
            />
          </div>
        ) : (
          <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
        )}
      </div>
    );
  };

  const renderStageTab = (tab: TabDef) => {
    const stage = tab.stage as ProductionStage;
    const tabState = stageStates[tab.key] ?? createTabState();
    const query = stageQuery;
    const apiRows = query.data?.items ?? [];
    const movedBlendStoreRows =
      stage === "GRANULATION_WIP"
        ? (blendStoreRowsForGranulationWipQuery.data ?? [])
            .filter(isMovedFromBlendStoreToGranulationWip)
            .map(mapBlendStoreRowToGranulationWipRow)
        : [];
    const granulationStoreRowKeys = new Set((granulationStoreRowsQuery.data ?? []).map(getInventoryRowKey));
    const movedGranulationWorkCenterRows =
      stage === "GRANULATION_STORE"
        ? (granulationWorkCenterRowsForGranulationStoreQuery.data ?? [])
            .filter((row) => isMovedFromGranulationWorkCenterToGranulationStore(row, granulationStoreRowKeys))
            .map(mapGranulationWorkCenterRowToGranulationStoreRow)
        : [];
    const movedGranulationWipKeys = new Set(
      movedBlendStoreRows.map((movedRow) => getInventoryRowKey(movedRow)),
    );
    const apiGranulationStoreKeys = new Set(
      apiRows.map((row) => getInventoryRowKey(row)),
    );
    const movedGranulationStoreKeys = new Set(
      movedGranulationWorkCenterRows.map((movedRow) => getInventoryRowKey(movedRow)),
    );
    const rows =
      stage === "GRANULATION_WIP"
        ? [
            ...movedBlendStoreRows,
            ...apiRows.filter((row) => {
              const rowKey = getInventoryRowKey(row);
              return !movedGranulationWipKeys.has(rowKey);
            }),
          ]
        : stage === "GRANULATION_STORE"
          ? [
              ...movedGranulationWorkCenterRows.filter((row) => !apiGranulationStoreKeys.has(getInventoryRowKey(row))),
              ...apiRows,
            ]
        : apiRows;
    const total =
      stage === "GRANULATION_WIP" || stage === "GRANULATION_STORE"
        ? rows.length
        : query.data?.total ?? 0;

    const showLine =tab.key === "CONNECTION_TO_LINE" || tab.key === "LINE_WORK_CENTER" || tab.key === "DISCONNECTION_FROM_LINE";

    const workCenterFilterContent = (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
          Work Center
        </span>
        <Select
          value={tabState.workCenter || "__all__"}
          onValueChange={(value) =>
            updateStageState(tab.key, (s) => ({
              ...s,
              workCenter: value === "__all__" ? "" : value,
              page: 1,
            }))
          }
        >
          <SelectTrigger className="h-8 w-full sm:w-[220px] text-sm">
            <SelectValue placeholder="All work centers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All work centers</SelectItem>
            {workCenterOptions.map((wc) => (
              <SelectItem key={wc.id} value={wc.name}>
                {wc.code ? `${wc.code} — ${wc.name}` : wc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tabState.workCenter && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => updateStageState(tab.key, (s) => ({ ...s, workCenter: "", page: 1 }))}
          >
            Clear
          </button>
        )}
      </div>
    );

    if (
      (
        query.isLoading ||
        (stage === "GRANULATION_WIP" && blendStoreRowsForGranulationWipQuery.isLoading) ||
        ((stage === "GRANULATION_STORE" || stage === "GRANULATION_WORK_CENTER") &&
          (granulationWorkCenterRowsForGranulationStoreQuery.isLoading || granulationStoreRowsQuery.isLoading))
      ) &&
      activeTab === tab.key
    ) {
      return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={tabState.search}
            onSearchChange={(value) => updateStageState(tab.key, (s) => ({ ...s, search: value, page: 1 }))}
            pageSize={getToolbarPageSizeValue(tabState.pageSize)}
            onPageSizeChange={(value) =>
              updateStageState(tab.key, (s) => ({ ...s, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
            }
            pageSizeOptions={["10", "20", "50", "100"]}
            onExport={(format) => { void handleStageExport(stage, tab.label, format); }}
            filterContent={workCenterFilterContent}
            summaryText={`Loading ${tab.label}...`}
            isFetching
          />
          <div className="py-8 text-sm text-muted-foreground">Loading {tab.label}...</div>
        </div>
      );
    }

    if (
      (
        query.isError ||
        (stage === "GRANULATION_WIP" && blendStoreRowsForGranulationWipQuery.isError) ||
        ((stage === "GRANULATION_STORE" || stage === "GRANULATION_WORK_CENTER") &&
          (granulationWorkCenterRowsForGranulationStoreQuery.isError || granulationStoreRowsQuery.isError))
      ) &&
      activeTab === tab.key
    ) {
      return (
        <ErrorState
          description={getApiErrorMessage(
            query.error ??
              blendStoreRowsForGranulationWipQuery.error ??
              granulationWorkCenterRowsForGranulationStoreQuery.error ??
              granulationStoreRowsQuery.error,
            `Unable to load ${tab.label} data.`,
          )}
        />
      );
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={tabState.search}
          onSearchChange={(value) => updateStageState(tab.key, (s) => ({ ...s, search: value, page: 1 }))}
          pageSize={getToolbarPageSizeValue(tabState.pageSize)}
          onPageSizeChange={(value) =>
            updateStageState(tab.key, (s) => ({ ...s, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onExport={(format) => { void handleStageExport(stage, tab.label, format); }}
          filterContent={workCenterFilterContent}
          summaryText={total > 0 ? `${total} records` : "No records found"}
          isFetching={query.isFetching && activeTab === tab.key}
        />
        {rows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-26rem)] overflow-auto">
                <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                  <TableRow className="hover:bg-card">
                    <TableHead className="w-12 text-right">S.No</TableHead>
                    <TableHead>Prd ID / Batch</TableHead>
                    <TableHead className="hidden md:table-cell">Production</TableHead>
                    <TableHead className="hidden md:table-cell">Product</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    {tab.key === "GRANULATION_WIP" ? <TableHead className="text-right">GL Batches</TableHead> : null}
                    {showLine && <TableHead className="hidden xl:table-cell">Line</TableHead>}
                    <TableHead className="hidden xl:table-cell">Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Created By</TableHead>
                    <TableHead className="hidden xl:table-cell">Created Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id ?? index}>
                      <TableCell className="text-right text-muted-foreground">
                        {(tabState.page - 1) * tabState.pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">{row.production_id || "—"}</div>
                        <div className="text-xs text-muted-foreground">{getDisplayedInventoryBatch(row)}</div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground md:hidden">
                          <div>{row.production || row.production_type || "—"}</div>
                          <div>{row.item_code} — {row.item_name}</div>
                          <div>Weight: {formatDecimal(getDisplayedStageQuantity(tab.stage, row))} {row.uom}</div>
                          <div>Status: {getDisplayedInventoryStatus(stage, row)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{row.production || row.production_type || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="font-medium">{row.item_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{row.item_code}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatDecimal(getDisplayedStageQuantity(tab.stage, row))} {row.uom}
                      </TableCell>
                      {tab.key === "GRANULATION_WIP" ? (
                        <TableCell className="text-right font-semibold">{row.gl_batch_count}</TableCell>
                      ) : null}
                      {showLine && (
                        <TableCell className="hidden xl:table-cell text-xs">{row.line ?? "—"}</TableCell>
                      )}
                      <TableCell className="hidden xl:table-cell">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {getDisplayedInventoryStatus(stage, row)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{row.created_by}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{formatDateTime(row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <StoreTablePagination
              page={tabState.page}
              pageSize={tabState.pageSize}
              total={total}
              onPageChange={(page) => updateStageState(tab.key, (s) => ({ ...s, page }))}
            />
          </div>
        ) : (
          <EmptyState
            title={`No ${tab.label} records`}
            description={`No production inventory records found for the ${tab.label} stage.`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Inventory"
        description="Track production inventory movement across all stages — from Additive Work Center through to Disconnection from Line."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max gap-0.5 h-auto flex-wrap">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="BLENDING_INVENTORY">
          {renderBlendingTab()}
        </TabsContent>

        {TABS.filter((t) => t.stage !== null).map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {activeTab === tab.key ? renderStageTab(tab) : null}
          </TabsContent>
        ))}
      </Tabs>

      <InventoryHistorySheet
        open={Boolean(historyTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryTarget(null);
            setHistoryState(createHistoryState());
          }
        }}
        target={historyTarget}
        state={historyState}
        onStateChange={updateHistoryState}
        rows={historyQuery.data?.items ?? []}
        total={historyQuery.data?.total ?? 0}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        errorDescription={getApiErrorMessage(historyQuery.error, "Unable to load inventory history.")}
        onRetry={() => { void historyQuery.refetch(); }}
      />
    </div>
  );
};

export default ProductionInventoryPage;
