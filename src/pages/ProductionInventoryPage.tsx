import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import {
  productionInventoryApi,
  type ProductionInventoryRow,
  type ProductionInventorySummaryRow,
  type ProductionInventoryTabStage,
  type ProductionStage,
} from "@/features/items/api/productionInventoryApi";
import {
  formatInventoryDateTime,
  formatInventoryWeightWithUnit,
  getInventoryText,
  parseInventoryQuantity,
  PRODUCTION_INVENTORY_TABS,
  type ProductionInventoryTabKey,
} from "@/features/items/utils/productionInventory";
import {
  getProductionInventoryDetailRoute,
} from "@/features/items/utils/routes";
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

type AllColumnDefinition = {
  key: string;
  label: string;
  className?: string;
  value: (row: ProductionInventoryRow, index: number) => string;
};

type SummaryColumnDefinition = {
  key: string;
  label: string;
  className?: string;
  value: (row: ProductionInventorySummaryRow, index: number) => string;
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

const ALL_COLUMNS: AllColumnDefinition[] = [
  { key: "serial", label: "S.No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
  { key: "production_id", label: "PRD ID", value: (row) => getInventoryText(row.production_id) },
  { key: "batch_no", label: "BATCH NO", value: (row) => getInventoryText(row.batch_no || row.batch_code) },
  { key: "production_type", label: "Prdn. Type", value: (row) => getInventoryText(row.production_type) },
  { key: "item_code", label: "Item ID", value: (row) => getInventoryText(row.item_code) },
  { key: "item_name", label: "Item Name", value: (row) => getInventoryText(row.item_name) },
  {
    key: "captured_weight",
    label: "Captured Weight",
    className: "text-right",
    value: (row) => formatWeightValue(row.captured_weight, row.uom),
  },
  { key: "binlot", label: "Binlot", value: (row) => getInventoryText(row.binlot) },
  { key: "baglot", label: "Baglot", value: (row) => getInventoryText(row.baglot) },
  { key: "scancode", label: "Scancode", value: (row) => getInventoryText(row.scancode) },
  { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
];

const SUMMARY_COLUMNS: SummaryColumnDefinition[] = [
  { key: "serial", label: "S.No", className: "w-14 text-right", value: (_row, index) => String(index + 1) },
  { key: "production_id", label: "PRD ID", value: (row) => getInventoryText(row.production_id) },
  { key: "batch_count", label: "No. of BATCH", className: "text-right", value: (row) => String(row.batch_count ?? 0) },
  { key: "recipe", label: "Recipe", value: (row) => getInventoryText(row.recipe) },
  { key: "production_type", label: "Prdn. Type", value: (row) => getInventoryText(row.production_type) },
  { key: "total_weight", label: "Total WT", className: "text-right", value: (row) => formatWeightValue(row.total_weight, row.uom) },
  {
    key: "planned_weight",
    label: "Planned WT",
    className: "text-right",
    value: (row) => formatWeightValue(row.planned_weight, row.uom),
  },
  { key: "created_by", label: "Created By", value: (row) => getInventoryText(row.created_by) },
  { key: "created_at", label: "Created Date & Time", value: (row) => formatInventoryDateTime(row.created_at) },
];

const isStoreSummaryStage = (stage: ProductionInventoryTabStage): stage is ProductionStage => stage !== "ALL";

const ProductionInventoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProductionInventoryTabKey>(PRODUCTION_INVENTORY_TABS[0].key);
  const [tabStates, setTabStates] = useState<Record<string, TabState>>(() =>
    Object.fromEntries(PRODUCTION_INVENTORY_TABS.map((tab) => [tab.key, createTabState()])),
  );

  const activeTabDefinition =
    PRODUCTION_INVENTORY_TABS.find((tab) => tab.key === activeTab) ?? PRODUCTION_INVENTORY_TABS[0];
  const activeStage = activeTabDefinition.stage;
  const isAllTab = activeStage === "ALL";
  const activeState = tabStates[activeTab] ?? createTabState();
  const deferredSearch = useDeferredValue(activeState.search);
  const resolvedPageSize = activeState.pageSize === "all" ? 200 : Number(activeState.pageSize);

  const updateActiveState = (updater: (state: TabState) => TabState) =>
    setTabStates((current) => ({
      ...current,
      [activeTab]: updater(current[activeTab] ?? createTabState()),
    }));

  const allRowsQuery = useQuery({
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
      productionInventoryApi.listByStage("ALL", {
        page: activeState.page,
        pageSize: resolvedPageSize,
        search: deferredSearch,
        fromDate: activeState.fromDate,
        toDate: activeState.toDate,
        includeHistory: true,
      }),
    enabled: isAllTab,
    retry: false,
  });

  const summaryRowsQuery = useQuery({
    queryKey: [
      "production-inventory",
      "summary",
      activeStage,
      activeState.page,
      resolvedPageSize,
      deferredSearch,
      activeState.fromDate,
      activeState.toDate,
    ],
    queryFn: () =>
      productionInventoryApi.listSummaryByStage(activeStage as ProductionStage, {
        page: activeState.page,
        pageSize: resolvedPageSize,
        search: deferredSearch,
        fromDate: activeState.fromDate,
        toDate: activeState.toDate,
        includeHistory: true,
      }),
    enabled: isStoreSummaryStage(activeStage),
    retry: false,
  });

  const activeQuery = isAllTab ? allRowsQuery : summaryRowsQuery;
  const allRows = allRowsQuery.data?.items ?? [];
  const summaryRows = summaryRowsQuery.data?.items ?? [];
  const totalRows = activeQuery.data?.total ?? 0;
  const totals = activeQuery.data?.totals ?? {
    total_inward_weight: "0.000",
    total_current_weight: "0.000",
    total_outward_weight: "0.000",
    planned_weight: "0.000",
  };
  const pageSizeNumber = getPageSizeNumber(activeState.pageSize, totalRows);
  const totalsUom = isAllTab ? allRows[0]?.uom ?? "kgs" : summaryRows[0]?.uom ?? "kgs";

  const totalsContent = (
    <div className="border-t border-border bg-slate-50/40 px-4 py-3">
      <div className={`grid gap-2 text-sm ${isAllTab ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
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
        {isAllTab ? (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Planned Weight</div>
            <div className="mt-1 font-semibold text-slate-900">{formatWeightValue(totals.planned_weight, totalsUom)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const handleExport = async (format: StoreExportFormat) => {
    try {
      if (isAllTab) {
        const exportRows = await productionInventoryApi.listAllByStage("ALL", {
          search: deferredSearch,
          fromDate: activeState.fromDate,
          toDate: activeState.toDate,
          includeHistory: true,
        });
        const exportColumns: StoreExportColumn<ProductionInventoryRow>[] = ALL_COLUMNS.map((column) => ({
          label: column.label,
          value: (row, index) => column.value(row, index),
        }));

        exportTableData({
          title: activeTabDefinition.label,
          filename: "production-inventory-all-detail",
          rows: exportRows,
          columns: exportColumns,
          format,
        });
        return;
      }

      const exportRows = await productionInventoryApi.listAllSummariesByStage(activeStage as ProductionStage, {
        search: deferredSearch,
        fromDate: activeState.fromDate,
        toDate: activeState.toDate,
        includeHistory: true,
      });
      const exportColumns: StoreExportColumn<ProductionInventorySummaryRow>[] = SUMMARY_COLUMNS.map((column) => ({
        label: column.label,
        value: (row, index) => column.value(row, index),
      }));

      exportTableData({
        title: activeTabDefinition.label,
        filename: `production-inventory-${String(activeStage).toLowerCase()}-summary`,
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

  const renderAllRows = () => (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="max-h-[calc(100vh-28rem)] overflow-auto">
        <Table className="min-w-[1320px]">
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-card">
              {ALL_COLUMNS.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRows.map((row, index) => (
              <TableRow key={`${row.stage}-${row.id}`} className="hover:bg-slate-50/80">
                {ALL_COLUMNS.map((column) => (
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
  );

  const renderSummaryRows = () => (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="max-h-[calc(100vh-28rem)] overflow-auto">
        <Table className="min-w-[1120px]">
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-card">
              {SUMMARY_COLUMNS.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryRows.map((row, index) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-slate-50/80"
                onClick={() => navigate(getProductionInventoryDetailRoute(activeStage, row.production_id))}
              >
                {SUMMARY_COLUMNS.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`${column.className ?? ""} ${column.key === "production_id" ? "font-mono text-xs font-medium" : ""}`.trim()}
                  >
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

      {activeQuery.isError ? (
        <ErrorState description={getApiErrorMessage(activeQuery.error, `Unable to load ${activeTabDefinition.label} data.`)} />
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
            summaryText={
              totalRows > 0
                ? isAllTab
                  ? `${totalRows} inventory row${totalRows === 1 ? "" : "s"}`
                  : `${totalRows} production order${totalRows === 1 ? "" : "s"}`
                : isAllTab
                  ? "No inventory rows found"
                  : "No production orders found"
            }
            isFetching={activeQuery.isFetching}
          />

          {activeQuery.isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading {activeTabDefinition.label}...</div>
          ) : isAllTab ? (
            allRows.length ? (
              renderAllRows()
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
            )
          ) : summaryRows.length ? (
            renderSummaryRows()
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="px-4 py-6">
                <EmptyState
                  title={`No ${activeTabDefinition.label} records`}
                  description={`No production inventory summary rows were found for ${activeTabDefinition.label}.`}
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
