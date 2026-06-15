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
{ key: "GRANULATION_WIP", label: "Granulation WIP", stage: "GRANULATION_WIP" },
  { key: "GRANULATION_WORK_CENTER", label: "Granulation Work Center", stage: "GRANULATION_WORK_CENTER" },
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
        { label: "Batch Code", value: (row) => row.batch_code },
        { label: "Item Code", value: (row) => row.item_code },
        { label: "Item Name", value: (row) => row.item_name },
        { label: "Inward Qty", value: (row) => row.inward_qty },
        { label: "Outward Qty", value: (row) => row.outward_qty },
        { label: "Balance Qty", value: (row) => row.balance_qty },
        { label: "UOM", value: (row) => row.uom },
        { label: "From Stage", value: (row) => row.from_stage },
        { label: "To Stage", value: (row) => row.to_stage },
        { label: "Reference No", value: (row) => row.reference_no ?? "" },
        { label: "Scan Code / Sticker Code", value: (row) => row.scan_code ?? "" },
        { label: "Work Center", value: (row) => row.work_center ?? "" },
        { label: "Line", value: (row) => row.line ?? "" },
        { label: "Status", value: (row) => row.status },
        { label: "Created By", value: (row) => row.created_by },
        { label: "Created Date & Time", value: (row) => formatDateTime(row.created_at) },
      ];
      const rows = await productionInventoryApi.listAllByStage(stage, {
        search: stageStates[activeTab]?.search,
        workCenter: stageStates[activeTab]?.workCenter || undefined,
      });
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
    const rows = query.data?.items ?? [];
    const total = query.data?.total ?? 0;

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

    if (query.isLoading && activeTab === tab.key) {
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

    if (query.isError && activeTab === tab.key) {
      return (
        <ErrorState description={getApiErrorMessage(query.error, `Unable to load ${tab.label} data.`)} />
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
                    <TableHead>Batch Code</TableHead>
                    <TableHead className="text-right">Inward Qty</TableHead>
                    <TableHead className="text-right">Outward Qty</TableHead>
                    <TableHead className="hidden md:table-cell">Item Code</TableHead>
                    <TableHead className="hidden md:table-cell">Item Name</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Balance Qty</TableHead>
                    <TableHead className="hidden lg:table-cell">UOM</TableHead>
                    <TableHead className="hidden xl:table-cell">From Stage</TableHead>
                    <TableHead className="hidden xl:table-cell">To Stage</TableHead>
                    <TableHead className="hidden xl:table-cell">Reference No</TableHead>
                    <TableHead className="hidden xl:table-cell">Work Center</TableHead>
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
                        <div className="font-mono text-sm font-medium">{row.batch_code}</div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground md:hidden">
                          <div>{row.item_code} — {row.item_name}</div>
                          <div>Balance: {formatDecimal(row.balance_qty)} {row.uom}</div>
                          <div>Status: {row.status}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatDecimal(row.inward_qty)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatDecimal(row.outward_qty)}</TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">{row.item_code}</TableCell>
                      <TableCell className="hidden md:table-cell">{row.item_name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{formatDecimal(row.balance_qty)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{row.uom}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{row.from_stage}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{row.to_stage}</TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-xs">{row.reference_no ?? "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{row.work_center ?? "—"}</TableCell>
                      {showLine && (
                        <TableCell className="hidden xl:table-cell text-xs">{row.line ?? "—"}</TableCell>
                      )}
                      <TableCell className="hidden xl:table-cell">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{row.status}</span>
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
