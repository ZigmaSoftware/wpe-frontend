import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { blendingApi } from "@/features/blending/api/blendingApi";
import { getStoreRequestStatusLabel } from "@/features/blending/utils/requestStatus";
import { BLENDING_TRANSACTIONS_ROUTE } from "@/features/blending/utils/routes";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { getPageCount, getPageSerialNumber, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { StoreStockRequest } from "@/lib/types";

type TransactionItemFilter = "all" | string;

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const getItemCategory = (item: NonNullable<StoreStockRequest["items"]>[number]) =>
  item.sub_group || item.group || item.category || "-";

const BlendingTransactionPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const numericRequestId = Number(requestId);
  const isValidRequestId = Number.isFinite(numericRequestId) && numericRequestId > 0;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StorePageSizeValue>("10");
  const [itemFilter, setItemFilter] = useState<TransactionItemFilter>("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const requestQuery = useQuery({
    enabled: isValidRequestId,
    queryKey: ["blending", "request-detail", numericRequestId],
    queryFn: () => blendingApi.getRequestDetail(numericRequestId),
  });

  const requestItems = useMemo(() => requestQuery.data?.items ?? [], [requestQuery.data]);
  const filterOptions = useMemo(
    () => Array.from(new Set(requestItems.map((item) => getItemCategory(item)).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [requestItems],
  );

  const filteredItems = requestItems.filter((item) => {
    const category = getItemCategory(item);
    if (itemFilter !== "all" && category !== itemFilter) {
      return false;
    }

    if (!deferredSearch) {
      return true;
    }

    return [item.item_code, item.item_name, category]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(deferredSearch));
  });

  const paginatedItems = paginateRows(filteredItems, page, pageSize);

  useEffect(() => {
    const totalPages = getPageCount(pageSize, filteredItems.length);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredItems.length, page, pageSize]);

  const handleExport = (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<(typeof requestItems)[number]>[] = [
        { label: "Request ID", value: () => readText(requestQuery.data?.request_no) },
        { label: "Item Code", value: (row) => readText(row.item_code) },
        { label: "Item Name", value: (row) => readText(row.item_name) },
        { label: "Requested Qty", value: (row) => formatDecimal(row.requested_qty) },
        { label: "Available Qty", value: (row) => formatDecimal(row.available_qty) },
        { label: "Unit", value: (row) => readText(row.unit) },
        { label: "Category", value: (row) => getItemCategory(row) },
      ];

      exportTableData({
        title: `Blending Transaction - ${readText(requestQuery.data?.request_no)}`,
        filename: `blending-transaction-${numericRequestId}`,
        rows: filteredItems,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export the transaction detail table."));
    }
  };

  if (!isValidRequestId) {
    return <ErrorState description="Invalid blending transaction. Open this page from the transactions table." />;
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={requestQuery.data?.request_no ? `Blending Transaction ${requestQuery.data.request_no}` : "Blending Transaction"}
        description="Review the products issued through this store request transaction."
        actions={
          <Button asChild variant="outline">
            <Link to={BLENDING_TRANSACTIONS_ROUTE}>Back to Blending Transactions</Link>
          </Button>
        }
      />

      {requestQuery.isLoading ? <LoadingState label="Loading blending transaction..." /> : null}
      {requestQuery.isError ? <ErrorState description={getApiErrorMessage(requestQuery.error, "Unable to load blending transaction.")} /> : null}

      {!requestQuery.isLoading && !requestQuery.isError && requestQuery.data ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 rounded-xl border border-border bg-slate-50/60 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Request ID</div>
              <div className="mt-1 font-semibold text-foreground">{readText(requestQuery.data.request_no)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Requested Date</div>
              <div className="mt-1 font-semibold text-foreground">{formatDateTime(requestQuery.data.requested_at)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Approved Date</div>
              <div className="mt-1 font-semibold text-foreground">{requestQuery.data.approved_at ? formatDateTime(requestQuery.data.approved_at) : "-"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
              <div className="mt-1 font-semibold text-foreground">{getStoreRequestStatusLabel(requestQuery.data.status)}</div>
            </div>
          </div>

          <StoreTableToolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            filterContent={
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Filter</div>
                  <Select
                    value={itemFilter}
                    onValueChange={(value) => {
                      setItemFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filterOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            pageSize={pageSize}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            onExport={handleExport}
            summaryText={`${filteredItems.length} products in this transaction`}
            isFetching={requestQuery.isFetching}
          />

          {filteredItems.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="max-h-[calc(100vh-24rem)] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead className="text-right">Requested Qty</TableHead>
                      <TableHead className="text-right">Available Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {getPageSerialNumber(page, pageSize, filteredItems.length, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{readText(requestQuery.data.request_no)}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs text-card-foreground">{readText(item.item_code)}</div>
                            <div className="text-sm text-muted-foreground">{readText(item.item_name)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatDecimal(item.requested_qty)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(item.available_qty)}</TableCell>
                        <TableCell>{readText(item.unit)}</TableCell>
                        <TableCell>{getItemCategory(item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <StoreTablePagination
                page={page}
                pageSize={getPageSizeNumber(pageSize, filteredItems.length)}
                total={filteredItems.length}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptyState title="No products found" description="No products matched the current search or filter for this transaction." />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default BlendingTransactionPage;
