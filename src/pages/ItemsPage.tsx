import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowUpRight } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { itemsInventoryQueryKeys } from "@/features/items/api/queryKeys";
import InventoryHistorySheet from "@/features/items/components/InventoryHistorySheet";
import InventorySummaryTable from "@/features/items/components/InventorySummaryTable";
import {
  INVENTORY_MODULES,
  type InventoryHistoryState,
  type InventoryHistoryTarget,
  type InventoryModule,
  type InventorySummaryRow,
  type InventorySummaryState,
} from "@/features/items/types";
import { storeApi } from "@/features/store/api/storeApi";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";

const createSummaryState = (): InventorySummaryState => ({
  page: 1,
  pageSize: 20,
  search: "",
});

const createHistoryState = (): InventoryHistoryState => ({
  page: 1,
  pageSize: 10,
  search: "",
  dateFrom: "",
  dateTo: "",
});

const isAccessDeniedError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 403;

const getPageSizeNumber = (pageSize: StorePageSizeValue, total: number) => (pageSize === "all" ? Math.max(total, 1) : Number(pageSize));
const getPageCount = (pageSize: StorePageSizeValue, total: number) => Math.max(1, Math.ceil(total / getPageSizeNumber(pageSize, total)));
const paginateRows = <T,>(rows: T[], page: number, pageSize: StorePageSizeValue) => {
  if (pageSize === "all") return rows;
  const pageLength = Number(pageSize);
  const start = (page - 1) * pageLength;
  return rows.slice(start, start + pageLength);
};

const ItemsPage = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<InventoryModule>("store");
  const [summaryState, setSummaryState] = useState<Record<InventoryModule, InventorySummaryState>>({
    store: createSummaryState(),
    blending: createSummaryState(),
  });
  const [historyState, setHistoryState] = useState<InventoryHistoryState>(createHistoryState);
  const [historyTarget, setHistoryTarget] = useState<InventoryHistoryTarget | null>(null);
  const [storePage, setStorePage] = useState(1);
  const [storePageSize, setStorePageSize] = useState<StorePageSizeValue>("10");

  const deferredStoreSearch = useDeferredValue(summaryState.store.search.trim());
  const deferredBlendingSearch = useDeferredValue(summaryState.blending.search.trim());
  const deferredHistorySearch = useDeferredValue(historyState.search.trim());

  const storeSummaryQuery = useQuery({
    queryKey: ["items", "inventory", "store", "stock-summary", deferredStoreSearch],
    queryFn: () => storeApi.listStockSummary({ search: deferredStoreSearch }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const blendingSummaryQuery = useQuery({
    queryKey: itemsInventoryQueryKeys.summary("blending", {
      ...summaryState.blending,
      deferredSearch: deferredBlendingSearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listSummary("blending", {
        page: summaryState.blending.page,
        pageSize: summaryState.blending.pageSize,
        search: deferredBlendingSearch,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (activeModule === "store" && isAccessDeniedError(storeSummaryQuery.error) && !blendingSummaryQuery.isError) {
      setActiveModule("blending");
    }
  }, [activeModule, blendingSummaryQuery.isError, storeSummaryQuery.error]);

  const historyQuery = useQuery({
    enabled: Boolean(historyTarget),
    queryKey: itemsInventoryQueryKeys.history(historyTarget?.module ?? activeModule, historyTarget?.row.item_id ?? null, {
      ...historyState,
      deferredSearch: deferredHistorySearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listHistory(historyTarget!.module, historyTarget!.row.item_id, {
        page: historyState.page,
        pageSize: historyState.pageSize,
        search: deferredHistorySearch,
        dateFrom: historyState.dateFrom,
        dateTo: historyState.dateTo,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const summaryQueries = useMemo(
    () => ({
      store: storeSummaryQuery,
      blending: blendingSummaryQuery,
    }),
    [blendingSummaryQuery, storeSummaryQuery],
  );

  const updateSummaryState = (module: InventoryModule, updater: (current: InventorySummaryState) => InventorySummaryState) => {
    setSummaryState((current) => ({
      ...current,
      [module]: updater(current[module]),
    }));
  };

  const updateHistoryState = (updater: (current: InventoryHistoryState) => InventoryHistoryState) => {
    setHistoryState((current) => updater(current));
  };

  const openHistory = (module: InventoryModule, row: InventorySummaryRow) => {
    setHistoryTarget({ module, row });
    setHistoryState(createHistoryState());
  };

  const storeRows = storeSummaryQuery.data ?? [];
  const paginatedStoreRows = paginateRows(storeRows, storePage, storePageSize);

  useEffect(() => {
    const totalPages = getPageCount(storePageSize, storeRows.length);
    if (storePage > totalPages) setStorePage(totalPages);
  }, [storePage, storePageSize, storeRows.length]);

  const handleStoreExport = (format: StoreExportFormat) => {
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
      exportTableData({
        title: "Store Inventory",
        filename: "items-store-inventory",
        rows: storeRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export store inventory."));
    }
  };

  const renderStoreInventory = () => {
    const config = INVENTORY_MODULES.store;
    const accessDenied = isAccessDeniedError(storeSummaryQuery.error);

    if (storeSummaryQuery.isLoading) {
      return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={summaryState.store.search}
            onSearchChange={(value) => {
              updateSummaryState("store", (current) => ({ ...current, search: value }));
              setStorePage(1);
            }}
            pageSize={storePageSize}
            onPageSizeChange={(value) => {
              setStorePageSize(value);
              setStorePage(1);
            }}
            onExport={handleStoreExport}
            summaryText="Loading store inventory..."
            isFetching
          />
          <div className="py-8 text-sm text-muted-foreground">Loading store inventory...</div>
        </div>
      );
    }

    if (storeSummaryQuery.isError) {
      return (
        <ErrorState
          description={accessDenied ? config.accessDescription : getApiErrorMessage(storeSummaryQuery.error, "Unable to load store inventory.")}
        />
      );
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={summaryState.store.search}
          onSearchChange={(value) => {
            updateSummaryState("store", (current) => ({ ...current, search: value }));
            setStorePage(1);
          }}
          pageSize={storePageSize}
          onPageSizeChange={(value) => {
            setStorePageSize(value);
            setStorePage(1);
          }}
          onExport={handleStoreExport}
          summaryText={`${storeRows.length} store rows available`}
          isFetching={storeSummaryQuery.isFetching}
        />

        {storeRows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-21rem)] overflow-auto">
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
                  {paginatedStoreRows.map((row) => (
                    <TableRow
                      key={`${row.item_id}-${row.item_code}`}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => navigate(`/app/store/stock/${row.item_id}`, { state: { row } })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/app/store/stock/${row.item_id}`, { state: { row } });
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
              page={storePage}
              pageSize={getPageSizeNumber(storePageSize, storeRows.length)}
              total={storeRows.length}
              onPageChange={setStorePage}
            />
          </div>
        ) : (
          <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
        )}
      </div>
    );
  };

  const renderBlendingTab = () => {
    const config = INVENTORY_MODULES.blending;
    const query = summaryQueries.blending;
    const state = summaryState.blending;
    const accessDenied = isAccessDeniedError(query.error);

    return (
      <InventorySummaryTable
        rows={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription={
          accessDenied ? config.accessDescription : getApiErrorMessage(query.error, `Unable to load ${config.label.toLowerCase()}.`)
        }
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
        page={state.page}
        pageSize={state.pageSize}
        total={query.data?.total ?? 0}
        onPageChange={(page) =>
          updateSummaryState("blending", (current) => ({
            ...current,
            page,
          }))
        }
        onPageSizeChange={(pageSize) =>
          updateSummaryState("blending", (current) => ({
            ...current,
            pageSize,
            page: 1,
          }))
        }
        onRetry={() => {
          void query.refetch();
        }}
        onRowClick={(row) => openHistory("blending", row)}
      />
    );
  };

  const activeConfig = INVENTORY_MODULES[activeModule];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items Inventory"
        description="Inventory monitoring only. Item master management, imports, and direct movement posting have been removed from this workspace."
      />

      <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as InventoryModule)} className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <TabsList className="h-auto flex-wrap bg-slate-100/80 p-1">
            {(Object.entries(INVENTORY_MODULES) as Array<[InventoryModule, (typeof INVENTORY_MODULES)[InventoryModule]]>).map(
              ([module, config]) => (
                <TabsTrigger key={module} value={module} className="gap-2">
                  <span>{config.label}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {module === "store" ? storeRows.length : summaryQueries[module].data?.total ?? 0}
                  </span>
                </TabsTrigger>
              ),
            )}
          </TabsList>
          <div className="mt-4 text-sm text-muted-foreground">
            {activeModule === "store"
              ? "Store inventory now follows the same compact table controls and interactions as Store Stock."
              : `${summaryQueries.blending.data?.total ?? 0} monitored item rows in the ${activeConfig.label.toLowerCase()} view.`}
          </div>
        </div>

        <TabsContent value="store" className="space-y-0">
          {renderStoreInventory()}
        </TabsContent>
        <TabsContent value="blending" className="space-y-0">
          {renderBlendingTab()}
        </TabsContent>
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
        onRetry={() => {
          void historyQuery.refetch();
        }}
      />
    </div>
  );
};

export default ItemsPage;
