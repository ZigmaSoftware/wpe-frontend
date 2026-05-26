import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { INVENTORY_MODULES, type InventoryHistoryRow, type InventoryModule, type InventorySummaryRow } from "@/features/items/types";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { getPageCount, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";

type HistoryTypeFilter = "all" | "inwards" | "outwards";

type HistoryFilterState = {
  fromDate: string;
  toDate: string;
  type: HistoryTypeFilter;
};

type InventoryStockItemPageContentProps = {
  module: InventoryModule;
  backHref: string;
  backLabel: string;
};

const createDefaultDateRange = () => ({
  fromDate: "",
  toDate: "",
});

const createDefaultFilters = (): HistoryFilterState => ({
  ...createDefaultDateRange(),
  type: "all",
});

const toDisplayType = (value: InventoryHistoryRow["transaction_type"]) => (value === "INWARD" ? "Inwards" : "Outwards");

const InventoryStockItemPageContent = ({
  module,
  backHref,
  backLabel,
}: InventoryStockItemPageContentProps) => {
  const { itemId } = useParams<{ itemId: string }>();
  const location = useLocation();
  const itemRow = (location.state as { row?: InventorySummaryRow } | null)?.row;
  const config = INVENTORY_MODULES[module];

  const numericItemId = Number(itemId);
  const isValidItemId = Number.isFinite(numericItemId) && numericItemId > 0;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StorePageSizeValue>("10");
  const [draftFilters, setDraftFilters] = useState<HistoryFilterState>(createDefaultFilters);
  const [filters, setFilters] = useState<HistoryFilterState>(createDefaultFilters);
  const [isFilterPending, startFilterTransition] = useTransition();
  const deferredSearch = useDeferredValue(search.trim());

  const historyQuery = useQuery({
    enabled: isValidItemId,
    queryKey: [module, "stock-item-history", numericItemId, filters, deferredSearch],
    queryFn: () =>
      itemsInventoryApi.listAllHistory(module, numericItemId, {
        search: deferredSearch,
        dateFrom: filters.fromDate,
        dateTo: filters.toDate,
      }),
    placeholderData: (previousData) => previousData,
  });

  const filteredRows = (historyQuery.data ?? []).filter((row) => {
    if (filters.type === "all") {
      return true;
    }
    if (filters.type === "inwards") {
      return row.transaction_type === "INWARD";
    }
    return row.transaction_type === "OUTWARD";
  });

  const paginatedRows = paginateRows(filteredRows, page, pageSize);

  useEffect(() => {
    const totalPages = getPageCount(pageSize, filteredRows.length);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredRows.length, page, pageSize]);

  const handleExport = (formatType: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<InventoryHistoryRow>[] = [
        { label: "Date & Time", value: (row) => formatDateTime(row.datetime) },
        { label: "Type", value: (row) => toDisplayType(row.transaction_type) },
        { label: "Quantity", value: (row) => formatDecimal(row.quantity) },
        { label: "Opening", value: (row) => formatDecimal(row.opening_stock) },
        { label: "Closing", value: (row) => formatDecimal(row.closing_stock) },
        { label: "Balance", value: (row) => formatDecimal(row.closing_stock) },
        { label: "Reference", value: (row) => row.reference_no || "-" },
        { label: "Module", value: (row) => row.module },
        { label: "User", value: (row) => row.created_by },
      ];

      exportTableData({
        title: `${config.label} History - ${itemRow?.item_name ?? `Item ${numericItemId}`}`,
        filename: `${module}-stock-history-${numericItemId}`,
        rows: filteredRows,
        columns,
        format: formatType,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export stock history."));
    }
  };

  if (!isValidItemId) {
    return <ErrorState description={`Invalid ${module} item. Open this page from the stock table.`} />;
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={itemRow?.item_name ? `${itemRow.item_name} History` : `${config.label} History`}
        description={
          itemRow?.item_code
            ? `Inwards and outwards for ${itemRow.item_code}.`
            : `Movement ledger for the selected ${config.label.toLowerCase()} row.`
        }
        actions={
          <Button asChild variant="outline">
            <Link to={backHref}>{backLabel}</Link>
          </Button>
        }
      />

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filterContent={
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_200px_auto]">
              <div className="space-y-1">
                <label htmlFor={`${module}-stock-history-from-date`} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  From Date
                </label>
                <Input
                  id={`${module}-stock-history-from-date`}
                  type="date"
                  value={draftFilters.fromDate}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${module}-stock-history-to-date`} className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  To Date
                </label>
                <Input
                  id={`${module}-stock-history-to-date`}
                  type="date"
                  value={draftFilters.toDate}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Type</div>
                <Select
                  value={draftFilters.type}
                  onValueChange={(value) => setDraftFilters((current) => ({ ...current, type: value as HistoryTypeFilter }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="inwards">Inwards</SelectItem>
                    <SelectItem value="outwards">Outwards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="h-9 w-full"
                  disabled={isFilterPending}
                  onClick={() =>
                    startFilterTransition(() => {
                      setFilters(draftFilters);
                      setPage(1);
                    })
                  }
                >
                  Go
                </Button>
              </div>
            </div>
          }
          pageSize={pageSize}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          onExport={handleExport}
          summaryText={`${filteredRows.length} transactions in the current result set`}
          isFetching={historyQuery.isFetching}
        />

        {historyQuery.isLoading ? <LoadingState label="Loading stock movement history..." /> : null}
        {historyQuery.isError ? <ErrorState description={getApiErrorMessage(historyQuery.error, "Unable to load stock movement history.")} /> : null}

        {!historyQuery.isLoading && !historyQuery.isError ? (
          filteredRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="max-h-[calc(100vh-22rem)] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row, index) => (
                      <TableRow key={`${row.datetime}-${row.reference_no ?? "row"}-${index}`}>
                        <TableCell className="font-medium">{formatDateTime(row.datetime)}</TableCell>
                        <TableCell>{toDisplayType(row.transaction_type)}</TableCell>
                        <TableCell className="text-right font-medium">{formatDecimal(row.quantity)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(row.opening_stock)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(row.closing_stock)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(row.closing_stock)}</TableCell>
                        <TableCell>{row.reference_no || "-"}</TableCell>
                        <TableCell>{row.module}</TableCell>
                        <TableCell>{row.created_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <StoreTablePagination
                page={page}
                pageSize={getPageSizeNumber(pageSize, filteredRows.length)}
                total={filteredRows.length}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptyState title="No stock transactions" description="No movements matched the selected search, date range, or type." />
          )
        ) : null}
      </div>
    </div>
  );
};

export default InventoryStockItemPageContent;
