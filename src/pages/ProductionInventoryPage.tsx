import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import {
  productionInventoryApi,
  type ProductionInventoryRow,
  type ProductionInventoryTabStage,
} from "@/features/items/api/productionInventoryApi";
import {
  formatInventoryDateTime,
  formatInventoryWeightWithUnit,
  getInventoryText,
  getProductionInventoryStatusLabel,
  parseInventoryQuantity,
  PRODUCTION_INVENTORY_TABS,
  type ProductionInventoryTabKey,
} from "@/features/items/utils/productionInventory";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { getPageSerialNumber, getPageSizeNumber } from "@/features/store/utils/table";

type TabState = {
  page: number;
  pageSize: StorePageSizeValue;
  search: string;
  fromDate: string;
  toDate: string;
};

type ColumnDefinition = {
  key: string;
  label: string;
  className?: string;
  value: (row: ProductionInventoryRow, index: number) => string;
};

const createTabState = (): TabState => ({
  page: 1,
  pageSize: "20",
  search: "",
  fromDate: "",
  toDate: "",
});

const formatWeightValue = (value?: string | null, uom?: string | null) =>
  formatInventoryWeightWithUnit(parseInventoryQuantity(value), uom);

const getColumnsForStage = (stage: ProductionInventoryTabStage): ColumnDefinition[] => {
  const baseIdentityColumns: ColumnDefinition[] = [
    { key: "production_id", label: "PRD ID", value: (row) => getInventoryText(row.production_id) },
    { key: "batch_no", label: "BATCH NO", value: (row) => getInventoryText(row.batch_no || row.batch_code) },
    { key: "production_type", label: "Prdn. Type", value: (row) => getInventoryText(row.production_type) },
    { key: "item_code", label: "Item ID", value: (row) => getInventoryText(row.item_code) },
    { key: "item_name", label: "Item Name", value: (row) => getInventoryText(row.item_name) },
  ];

  if (stage === "ALL") {
    return [
      { key: "serial", label: "S.No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
      ...baseIdentityColumns,
      { key: "captured_weight", label: "Captured Weight", className: "text-right", value: (row) => formatWeightValue(row.captured_weight, row.uom) },
      { key: "binlot", label: "Binlot", value: (row) => getInventoryText(row.binlot) },
      { key: "baglot", label: "Baglot", value: (row) => getInventoryText(row.baglot) },
      { key: "scancode", label: "Scancode", value: (row) => getInventoryText(row.scancode) },
      { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
    ];
  }

  if (stage === "ADDITIVE_WORK_CENTER" || stage === "BLEND_WIP") {
    return [
      { key: "serial", label: "No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
      { key: "production_id", label: "PRD ID", value: (row) => getInventoryText(row.production_id) },
      { key: "batch_no", label: "BATCH NO", value: (row) => getInventoryText(row.batch_no || row.batch_code) },
      { key: "recipe_no", label: "Recipe No", value: (row) => getInventoryText(row.recipe_no) },
      { key: "std_batch_size", label: "STD Batch Size", className: "text-right", value: (row) => formatWeightValue(row.std_batch_size, row.uom) },
      { key: "production_type", label: "Prdn. Type", value: (row) => getInventoryText(row.production_type) },
      { key: "item_code", label: "Item ID", value: (row) => getInventoryText(row.item_code) },
      { key: "item_name", label: "Item Name", value: (row) => getInventoryText(row.item_name) },
      { key: "captured_weight", label: "Captured Weight", className: "text-right", value: (row) => formatWeightValue(row.captured_weight, row.uom) },
      { key: "scancode", label: "Scancode", value: (row) => getInventoryText(row.scancode) },
      { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
    ];
  }

  if (stage === "BLEND_STORE") {
    return [
      { key: "serial", label: "No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
      ...baseIdentityColumns,
      { key: "captured_weight", label: "Captured Weight", className: "text-right", value: (row) => formatWeightValue(row.captured_weight, row.uom) },
      { key: "binlot", label: "Binlot", value: (row) => getInventoryText(row.binlot) },
      { key: "scancode", label: "Scancode", value: (row) => getInventoryText(row.scancode) },
      { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
    ];
  }

  if (stage === "GRANULATION_WORK_CENTER") {
    return [
      { key: "serial", label: "No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
      ...baseIdentityColumns,
      { key: "consumed_at", label: "Consumed Date & Time", value: (row) => formatInventoryDateTime(row.consumed_at) },
      { key: "consumed_bin_name", label: "Con. Bin Name", value: (row) => getInventoryText(row.consumed_bin_name) },
      { key: "consumed_scancode", label: "Con. Scancode", value: (row) => getInventoryText(row.consumed_scancode) },
      { key: "consumed_weight", label: "Con. Wt", className: "text-right", value: (row) => formatWeightValue(row.consumed_weight, row.uom) },
      { key: "captured_stage_at", label: "Captured Date & Time", value: (row) => formatInventoryDateTime(row.captured_stage_at) },
      { key: "captured_bin_name", label: "Cap. Bin Name", value: (row) => getInventoryText(row.captured_bin_name) },
      { key: "captured_bin_scancode", label: "Cap. Bin Scancode", value: (row) => getInventoryText(row.captured_bin_scancode) },
      { key: "captured_stage_weight", label: "Cap. Weight", className: "text-right", value: (row) => formatWeightValue(row.captured_stage_weight, row.uom) },
      { key: "scrap", label: "Scrap", className: "text-right", value: (row) => formatWeightValue(row.scrap, row.uom) },
    ];
  }

  return [
    { key: "serial", label: "No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
    ...baseIdentityColumns,
    { key: "captured_weight", label: "Captured Weight", className: "text-right", value: (row) => formatWeightValue(row.captured_weight, row.uom) },
    { key: "baglot", label: "Baglot", value: (row) => getInventoryText(row.baglot) },
    { key: "scancode", label: "Scancode", value: (row) => getInventoryText(row.scancode) },
    { key: "status_display", label: "Status", value: (row) => getProductionInventoryStatusLabel(row) },
    { key: "connected_weight", label: "Connected Wt.", className: "text-right", value: (row) => formatWeightValue(row.connected_weight, row.uom) },
    { key: "connected_at", label: "Connected Date & Time", value: (row) => formatInventoryDateTime(row.connected_at) },
    { key: "consumed_weight", label: "Consumed Wt.", className: "text-right", value: (row) => formatWeightValue(row.consumed_weight, row.uom) },
    { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
  ];
};

const ProductionInventoryPage = () => {
  const [activeTab, setActiveTab] = useState<ProductionInventoryTabKey>(PRODUCTION_INVENTORY_TABS[0].key);
  const [tabStates, setTabStates] = useState<Record<string, TabState>>(() =>
    Object.fromEntries(PRODUCTION_INVENTORY_TABS.map((tab) => [tab.key, createTabState()])),
  );

  const activeTabDefinition =
    PRODUCTION_INVENTORY_TABS.find((tab) => tab.key === activeTab) ?? PRODUCTION_INVENTORY_TABS[0];
  const activeStage = activeTabDefinition.stage;
  const activeState = tabStates[activeTab] ?? createTabState();
  const deferredSearch = useDeferredValue(activeState.search);
  const resolvedPageSize = activeState.pageSize === "all" ? 200 : Number(activeState.pageSize);

  const stageRowsQuery = useQuery({
    queryKey: [
      "production-inventory",
      "table",
      activeStage,
      activeState.page,
      resolvedPageSize,
      deferredSearch,
      activeState.fromDate,
      activeState.toDate,
    ],
    queryFn: () =>
      productionInventoryApi.listByStage(activeStage, {
        page: activeState.page,
        pageSize: resolvedPageSize,
        search: deferredSearch,
        fromDate: activeState.fromDate,
        toDate: activeState.toDate,
        includeHistory: true,
      }),
    retry: false,
  });

  const updateActiveState = (updater: (state: TabState) => TabState) =>
    setTabStates((current) => ({
      ...current,
      [activeTab]: updater(current[activeTab] ?? createTabState()),
    }));

  const rows = stageRowsQuery.data?.items ?? [];
  const totalRows = stageRowsQuery.data?.total ?? 0;
  const totals = stageRowsQuery.data?.totals ?? {
    total_inward_weight: "0.000",
    total_current_weight: "0.000",
    total_outward_weight: "0.000",
    planned_weight: "0.000",
  };
  const pageSizeNumber = getPageSizeNumber(activeState.pageSize, totalRows);
  const columns = useMemo(() => getColumnsForStage(activeStage), [activeStage]);
  const totalsUom = rows[0]?.uom ?? "kgs";

  const totalsContent = (
    <div className="border-t border-border bg-slate-50/40 px-4 py-3">
      <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Inward WT</div>
          <div className="mt-1 font-semibold text-slate-900">{formatWeightValue(totals.total_inward_weight, totalsUom)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Current WT</div>
          <div className="mt-1 font-semibold text-slate-900">{formatWeightValue(totals.total_current_weight, totalsUom)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Outward WT</div>
          <div className="mt-1 font-semibold text-slate-900">{formatWeightValue(totals.total_outward_weight, totalsUom)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Planned Weight</div>
          <div className="mt-1 font-semibold text-slate-900">{formatWeightValue(totals.planned_weight, totalsUom)}</div>
        </div>
      </div>
    </div>
  );

  const handleExport = async (format: StoreExportFormat) => {
    try {
      const exportRows = await productionInventoryApi.listAllByStage(activeStage, {
        search: deferredSearch,
        fromDate: activeState.fromDate,
        toDate: activeState.toDate,
        includeHistory: true,
      });
      const exportColumns: StoreExportColumn<ProductionInventoryRow>[] = columns.map((column) => ({
        label: column.label,
        value: (row, index) => column.value(row, index),
      }));

      exportTableData({
        title: activeTabDefinition.label,
        filename: `production-inventory-${String(activeStage).toLowerCase()}-detail`,
        rows: exportRows,
        columns: exportColumns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export production inventory."));
    }
  };

  const filterContent = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
      <div className="space-y-1">
        <label
          htmlFor="production-inventory-from-date"
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          From Date
        </label>
        <Input
          id="production-inventory-from-date"
          type="date"
          value={activeState.fromDate}
          onChange={(event) =>
            updateActiveState((current) => ({
              ...current,
              fromDate: event.target.value,
              page: 1,
            }))
          }
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="production-inventory-to-date"
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          To Date
        </label>
        <Input
          id="production-inventory-to-date"
          type="date"
          value={activeState.toDate}
          onChange={(event) =>
            updateActiveState((current) => ({
              ...current,
              toDate: event.target.value,
              page: 1,
            }))
          }
          className="h-9"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Inventory"
        description="Track production inventory movement across all stages — from Additive Work Center through to Disconnection from Line."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProductionInventoryTabKey)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto w-max gap-0.5">
            {PRODUCTION_INVENTORY_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {stageRowsQuery.isError ? (
        <ErrorState description={getApiErrorMessage(stageRowsQuery.error, `Unable to load ${activeTabDefinition.label} data.`)} />
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={activeState.search}
            onSearchChange={(value) =>
              updateActiveState((current) => ({
                ...current,
                search: value,
                page: 1,
              }))
            }
            filterContent={filterContent}
            pageSize={activeState.pageSize}
            onPageSizeChange={(value) =>
              updateActiveState((current) => ({
                ...current,
                pageSize: value,
                page: 1,
              }))
            }
            pageSizeOptions={["10", "20", "50", "100", "all"]}
            onExport={(format) => {
              void handleExport(format);
            }}
            summaryText={totalRows > 0 ? `${totalRows} inventory row${totalRows === 1 ? "" : "s"}` : "No inventory rows found"}
            isFetching={stageRowsQuery.isFetching}
          />

          {stageRowsQuery.isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading {activeTabDefinition.label}...</div>
          ) : rows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="max-h-[calc(100vh-28rem)] overflow-auto">
                <Table className="min-w-[1320px]">
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      {columns.map((column) => (
                        <TableHead key={column.key} className={column.className}>
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.stage}-${row.id}`} className="hover:bg-slate-50/80">
                        {columns.map((column) => (
                          <TableCell key={column.key} className={column.className}>
                            {column.key === "serial"
                              ? getPageSerialNumber(activeState.page, activeState.pageSize, totalRows, index)
                              : column.value(row, index)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalsContent}

              <StoreTablePagination
                page={activeState.page}
                pageSize={pageSizeNumber}
                total={totalRows}
                onPageChange={(page) =>
                  updateActiveState((current) => ({
                    ...current,
                    page,
                  }))
                }
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="px-4 py-6">
                <EmptyState
                  title={`No ${activeTabDefinition.label} records`}
                  description={`No production inventory rows were found for ${activeTabDefinition.label}.`}
                />
              </div>
              {totalsContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionInventoryPage;
