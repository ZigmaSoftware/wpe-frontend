import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowUpRight } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { itemsInventoryQueryKeys } from "@/features/items/api/queryKeys";
import InventoryHistorySheet from "@/features/items/components/InventoryHistorySheet";
import { BLENDING_INVENTORY_ROUTE } from "@/features/items/utils/routes";
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
const getToolbarPageSizeValue = (pageSize: number): StorePageSizeValue =>
  pageSize === 10 || pageSize === 20 || pageSize === 50 || pageSize === 100 ? String(pageSize) as StorePageSizeValue : "20";
const paginateRows = <T,>(rows: T[], page: number, pageSize: StorePageSizeValue) => {
  if (pageSize === "all") return rows;
  const pageLength = Number(pageSize);
  const start = (page - 1) * pageLength;
  return rows.slice(start, start + pageLength);
};

type ItemsPageProps = {
  module?: InventoryModule;
};

const ItemsPage = ({ module = "store" }: ItemsPageProps) => {
  const navigate = useNavigate();
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
    enabled: module === "store",
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
    enabled: module === "blending" || module === "store",
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (
      module === "store" &&
      isAccessDeniedError(storeSummaryQuery.error) &&
      blendingSummaryQuery.isFetched &&
      !blendingSummaryQuery.isError
    ) {
      navigate(BLENDING_INVENTORY_ROUTE, { replace: true });
    }
  }, [blendingSummaryQuery.isError, blendingSummaryQuery.isFetched, module, navigate, storeSummaryQuery.error]);

  const historyQuery = useQuery({
    enabled: Boolean(historyTarget),
    queryKey: itemsInventoryQueryKeys.history(historyTarget?.module ?? module, historyTarget?.row.item_id ?? null, {
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
      const rows = await itemsInventoryApi.listAllSummary("blending", {
        search: deferredBlendingSearch,
      });

      exportTableData({
        title: "Blending Inventory",
        filename: "items-blending-inventory",
        rows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export blending inventory."));
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
    const rows = query.data?.items ?? [];
    const total = query.data?.total ?? 0;

    if (query.isLoading) {
      return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={state.search}
            onSearchChange={(value) =>
              updateSummaryState("blending", (current) => ({
                ...current,
                search: value,
                page: 1,
              }))
            }
            pageSize={getToolbarPageSizeValue(state.pageSize)}
            onPageSizeChange={(value) =>
              updateSummaryState("blending", (current) => ({
                ...current,
                pageSize: value === "all" ? 100 : Number(value),
                page: 1,
              }))
            }
            pageSizeOptions={["10", "20", "50", "100"]}
            onExport={(format) => {
              void handleBlendingExport(format);
            }}
            summaryText="Loading blending inventory..."
            isFetching
          />
          <div className="py-8 text-sm text-muted-foreground">Loading blending inventory...</div>
        </div>
      );
    }

    if (query.isError) {
      return (
        <ErrorState description={accessDenied ? config.accessDescription : getApiErrorMessage(query.error, "Unable to load blending inventory.")} />
      );
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={state.search}
          onSearchChange={(value) =>
            updateSummaryState("blending", (current) => ({
              ...current,
              search: value,
              page: 1,
            }))
          }
          pageSize={getToolbarPageSizeValue(state.pageSize)}
          onPageSizeChange={(value) =>
            updateSummaryState("blending", (current) => ({
              ...current,
              pageSize: value === "all" ? 100 : Number(value),
              page: 1,
            }))
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onExport={(format) => {
            void handleBlendingExport(format);
          }}
          summaryText={`${total} blending rows available`}
          isFetching={query.isFetching}
        />

        {rows.length ? (
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
                  {rows.map((row) => (
                    <TableRow
                      key={`${row.item_id}-${row.item_code}`}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => openHistory("blending", row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openHistory("blending", row);
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
              onPageChange={(page) =>
                updateSummaryState("blending", (current) => ({
                  ...current,
                  page,
                }))
              }
            />
          </div>
        ) : (
          <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
        )}
      </div>
    );
  };

  const activeConfig = INVENTORY_MODULES[module];
  const isStoreModule = module === "store";

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeConfig.label}
        description={
          isStoreModule
            ? "Monitor store inventory balances, search stock rows, export the current stock view, and drill into store stock movement."
            : "Monitor blending inventory balances, search stock rows, export the current stock view, and inspect inventory movement history."
        }
      />
      {isStoreModule ? renderStoreInventory() : renderBlendingTab()}

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
