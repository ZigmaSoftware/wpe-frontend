import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryStockTable from "@/features/items/components/InventoryStockTable";
import type { InventorySummaryRow } from "@/features/items/types";
import { storeApi } from "@/features/store/api/storeApi";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { getPageCount, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";
import type { StoreStockRequest, StoreTransactionRecord } from "@/lib/types";

type StoreTabValue = "stock" | "requests" | "transactions";
type RequestStatusFilter = "pending" | "all" | "approved" | "rejected";
type TransactionTypeFilter = "all" | "inwards" | "outwards";

type RequestFilterState = {
  fromDate: string;
  toDate: string;
  status: RequestStatusFilter;
  department: string;
};

type TransactionFilterState = {
  fromDate: string;
  toDate: string;
  type: TransactionTypeFilter;
  department: string;
};

const createDefaultDateRange = () => {
  return {
    fromDate: "",
    toDate: "",
  };
};

const createDefaultRequestFilters = (): RequestFilterState => ({
  ...createDefaultDateRange(),
  status: "pending",
  department: "all",
});

const createDefaultTransactionFilters = (): TransactionFilterState => ({
  ...createDefaultDateRange(),
  type: "all",
  department: "all",
});

const toRequestStatusParam = (status: RequestStatusFilter) => {
  if (status === "all") {
    return "all";
  }

  return status.toUpperCase();
};

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};

const getRequestItemNames = (row: StoreStockRequest) =>
  row.items?.length ? row.items.map((item) => item.item_name).join(", ") : readText(row.item_name);

const getRequestItemCodes = (row: StoreStockRequest) =>
  row.items?.length ? row.items.map((item) => item.item_code).join(", ") : readText(row.item_code);

const getRequestQuantity = (row: StoreStockRequest) => {
  const quantity = row.total_requested_qty ?? row.quantity;
  const unit = row.unit || row.items?.[0]?.unit || "";

  return `${formatDecimal(quantity)}${unit ? ` ${unit}` : ""}`;
};

const getRequestApprovedQuantity = (row: StoreStockRequest) => formatDecimal(row.total_approved_qty ?? null);

const getRequestIssuedQuantity = (row: StoreStockRequest) => formatDecimal(row.total_issued_qty ?? null);

const getTransactionDirection = (row: StoreTransactionRecord) => {
  const inwardQty = Number(row.inward_qty ?? 0);
  return inwardQty > 0 ? "Inwards" : "Outwards";
};

const getTransactionReferenceKey = (referenceId: string | null | undefined) => {
  const value = String(referenceId ?? "").trim();
  if (!value) {
    return "";
  }

  return value.includes(":") ? value.split(":", 1)[0] : value;
};

const getTransactionDepartment = (row: StoreTransactionRecord, requestDepartmentMap: Record<string, string>) => {
  const metadataDepartment = row.metadata?.department;
  if (typeof metadataDepartment === "string" && metadataDepartment.trim()) {
    return metadataDepartment.trim();
  }

  const requestKey = getTransactionReferenceKey(row.reference_id);
  return requestDepartmentMap[requestKey] || "-";
};

const matchesTransactionType = (row: StoreTransactionRecord, filter: TransactionTypeFilter) => {
  if (filter === "all") {
    return true;
  }

  return getTransactionDirection(row).toLowerCase() === filter;
};

const formatTransactionType = (type: string) =>
  type
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const statusBadgeClassName = (status: StoreStockRequest["status"]) => {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
};

const StorePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StoreTabValue>("stock");

  const [stockSearch, setStockSearch] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState<StorePageSizeValue>("10");

  const [requestSearch, setRequestSearch] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState<StorePageSizeValue>("10");
  const [requestDraftFilters, setRequestDraftFilters] = useState<RequestFilterState>(createDefaultRequestFilters);
  const [requestFilters, setRequestFilters] = useState<RequestFilterState>(createDefaultRequestFilters);
  const [isRequestFilterPending, startRequestFilterTransition] = useTransition();

  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState<StorePageSizeValue>("10");
  const [transactionDraftFilters, setTransactionDraftFilters] = useState<TransactionFilterState>(createDefaultTransactionFilters);
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilterState>(createDefaultTransactionFilters);
  const [isTransactionFilterPending, startTransactionFilterTransition] = useTransition();

  const deferredStockSearch = useDeferredValue(stockSearch.trim());
  const deferredRequestSearch = useDeferredValue(requestSearch.trim());
  const deferredTransactionSearch = useDeferredValue(transactionSearch.trim());

  const departmentsQuery = useQuery({
    queryKey: ["store", "departments"],
    queryFn: storeApi.listDepartments,
    staleTime: 5 * 60 * 1000,
  });

  const stockQuery = useQuery({
    queryKey: ["store", "stock-summary", deferredStockSearch],
    queryFn: () => storeApi.listStockSummary({ search: deferredStockSearch }),
    placeholderData: (previousData) => previousData,
  });

  const requestsQuery = useQuery({
    queryKey: ["store", "requests", requestFilters, deferredRequestSearch],
    queryFn: () =>
      storeApi.listRequests({
        search: deferredRequestSearch,
        status: toRequestStatusParam(requestFilters.status),
        dateFrom: requestFilters.fromDate,
        dateTo: requestFilters.toDate,
        department: requestFilters.department,
      }),
    placeholderData: (previousData) => previousData,
  });

  const requestLookupQuery = useQuery({
    queryKey: ["store", "request-lookup"],
    queryFn: () => storeApi.listRequests({}),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const transactionsQuery = useQuery({
    queryKey: ["store", "transactions", transactionFilters.fromDate, transactionFilters.toDate, deferredTransactionSearch],
    queryFn: () =>
      storeApi.listTransactions({
        search: deferredTransactionSearch,
        dateFrom: transactionFilters.fromDate,
        dateTo: transactionFilters.toDate,
      }),
    placeholderData: (previousData) => previousData,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await coreApi.post(`/api/store/approve-request/${requestId}/`, {});
      return response.data;
    },
    onSuccess: () => {
      toast.success("Store request approved.");
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to approve store request.")),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await coreApi.post(`/api/store/reject-request/${requestId}/`, {});
      return response.data;
    },
    onSuccess: () => {
      toast.success("Store request rejected.");
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to reject store request.")),
  });

  const requestDepartmentMap = (requestLookupQuery.data ?? []).reduce<Record<string, string>>((map, row) => {
    if (row.request_no) {
      map[row.request_no] = row.department;
    }

    return map;
  }, {});

  const filteredTransactions = (transactionsQuery.data ?? []).filter((row) => {
    if (!matchesTransactionType(row, transactionFilters.type)) {
      return false;
    }

    if (transactionFilters.department === "all") {
      return true;
    }

    return getTransactionDepartment(row, requestDepartmentMap) === transactionFilters.department;
  });

  const stockRows = stockQuery.data ?? [];
  const requestRows = requestsQuery.data ?? [];
  const transactionRows = filteredTransactions;

  const paginatedRequestRows = paginateRows(requestRows, requestPage, requestPageSize);
  const paginatedTransactionRows = paginateRows(transactionRows, transactionPage, transactionPageSize);

  useEffect(() => {
    const totalPages = getPageCount(stockPageSize, stockRows.length);
    if (stockPage > totalPages) {
      setStockPage(totalPages);
    }
  }, [stockPage, stockPageSize, stockRows.length]);

  useEffect(() => {
    const totalPages = getPageCount(requestPageSize, requestRows.length);
    if (requestPage > totalPages) {
      setRequestPage(totalPages);
    }
  }, [requestPage, requestPageSize, requestRows.length]);

  useEffect(() => {
    const totalPages = getPageCount(transactionPageSize, transactionRows.length);
    if (transactionPage > totalPages) {
      setTransactionPage(totalPages);
    }
  }, [transactionPage, transactionPageSize, transactionRows.length]);

  const handleStockExport = (format: StoreExportFormat) => {
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
        title: "Store Stock",
        filename: "store-stock",
        rows: stockRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export the stock table."));
    }
  };

  const handleRequestExport = (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<StoreStockRequest>[] = [
        { label: "Request No", value: (row) => readText(row.request_no) },
        { label: "Requested Date", value: (row) => formatDateTime(row.requested_at) },
        { label: "Department", value: (row) => row.department },
        { label: "Requested By", value: (row) => row.requested_by_username },
        { label: "Requested For", value: (row) => row.requested_for_name || "-" },
        { label: "Status", value: (row) => row.status },
        { label: "Item Codes", value: (row) => getRequestItemCodes(row) },
        { label: "Items", value: (row) => getRequestItemNames(row) },
        { label: "Requested Qty", value: (row) => getRequestQuantity(row) },
        { label: "Approved Qty", value: (row) => getRequestApprovedQuantity(row) },
        { label: "Issued Qty", value: (row) => getRequestIssuedQuantity(row) },
        { label: "Reason", value: (row) => row.request_reason || "-" },
        { label: "Approved By", value: (row) => row.approved_by_username || "-" },
      ];

      exportTableData({
        title: "Store Requests",
        filename: "store-requests",
        rows: requestRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export the request table."));
    }
  };

  const handleTransactionExport = (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<StoreTransactionRecord>[] = [
        { label: "Transaction Date", value: (row) => formatDate(row.transaction_date) },
        { label: "Created At", value: (row) => formatDateTime(row.created_at) },
        { label: "Transaction No", value: (row) => readText(row.transaction_no) },
        { label: "Direction", value: (row) => getTransactionDirection(row) },
        { label: "Type", value: (row) => formatTransactionType(row.transaction_type) },
        { label: "Department", value: (row) => getTransactionDepartment(row, requestDepartmentMap) },
        { label: "Item Code", value: (row) => row.item_code },
        { label: "Item Name", value: (row) => row.item_name },
        { label: "Quantity", value: (row) => formatDecimal(row.quantity) },
        { label: "Unit", value: (row) => row.unit },
        { label: "Warehouse", value: (row) => readText(row.warehouse_name) },
        { label: "Reference", value: (row) => readText(row.reference_id) },
      ];

      exportTableData({
        title: "Stock Transactions",
        filename: "stock-transactions",
        rows: transactionRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export the transaction table."));
    }
  };

  const renderStockTable = () => {
    if (stockQuery.isLoading) {
      return <LoadingState label="Loading store stock..." />;
    }

    if (stockQuery.isError) {
      return <ErrorState description={getApiErrorMessage(stockQuery.error, "Unable to load store stock.")} />;
    }

    if (!stockRows.length) {
      return (
        <EmptyState
          title="No store stock rows"
          description="No store inventory rows matched the current search."
        />
      );
    }

    return (
      <InventoryStockTable
        rows={stockRows}
        page={stockPage}
        pageSize={stockPageSize}
        onPageChange={setStockPage}
        onRowClick={(row) => navigate(`/app/store/stock/${row.item_id}`, { state: { row } })}
      />
    );
  };

  const renderRequestTable = () => {
    if (requestsQuery.isLoading) {
      return <LoadingState label="Loading store requests..." />;
    }

    if (requestsQuery.isError) {
      return <ErrorState description={getApiErrorMessage(requestsQuery.error, "Unable to load store requests.")} />;
    }

    if (!requestRows.length) {
      return (
        <EmptyState
          title="No store requests"
          description="No department requests matched the selected date range, status, or department filters."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="max-h-[calc(100vh-21rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="hover:bg-card">
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="hidden lg:table-cell">Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Approved By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequestRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {(requestPage - 1) * getPageSizeNumber(requestPageSize, requestRows.length) + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-card-foreground">{readText(row.request_no)}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(row.requested_at)}</div>
                      <div className="text-xs text-muted-foreground">{row.requested_for_name || "General request"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{row.department}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {row.items?.length ? (
                        row.items.map((item) => (
                          <div key={item.id} className="space-y-0.5">
                            <div className="font-medium text-card-foreground">{item.item_name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{item.item_code}</div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-medium text-card-foreground">{readText(row.item_name)}</div>
                          <div className="font-mono text-xs text-muted-foreground">{readText(row.item_code)}</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{getRequestQuantity(row)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-0.5">
                      <div>{row.requested_by_username}</div>
                      <div className="text-xs text-muted-foreground" title={row.request_reason || "-"}>
                        {row.request_reason || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(row.status))}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{row.approved_by_username || "-"}</TableCell>
                  <TableCell className="text-right">
                    {row.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => approveRequestMutation.mutate(row.id)}
                          disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                        >
                          <Check className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => rejectRequestMutation.mutate(row.id)}
                          disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <StoreTablePagination
          page={requestPage}
          pageSize={getPageSizeNumber(requestPageSize, requestRows.length)}
          total={requestRows.length}
          onPageChange={setRequestPage}
        />
      </div>
    );
  };

  const renderTransactionTable = () => {
    if (transactionsQuery.isLoading || requestLookupQuery.isLoading) {
      return <LoadingState label="Loading stock transactions..." />;
    }

    if (transactionsQuery.isError) {
      return <ErrorState description={getApiErrorMessage(transactionsQuery.error, "Unable to load stock transactions.")} />;
    }

    if (requestLookupQuery.isError) {
      return <ErrorState description={getApiErrorMessage(requestLookupQuery.error, "Unable to resolve transaction departments.")} />;
    }

    if (!transactionRows.length) {
      return (
        <EmptyState
          title="No stock transactions"
          description="No stock movements matched the selected date range, type, department, or search filters."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="max-h-[calc(100vh-21rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="hover:bg-card">
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden lg:table-cell">Transaction No</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="hidden md:table-cell">Unit</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactionRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {(transactionPage - 1) * getPageSizeNumber(transactionPageSize, transactionRows.length) + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{formatDate(row.transaction_date)}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">{readText(row.transaction_no)}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-card-foreground">{row.item_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.item_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{getTransactionDirection(row)}</div>
                      <div className="text-xs text-muted-foreground">{formatTransactionType(row.transaction_type)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTransactionDepartment(row, requestDepartmentMap)}</TableCell>
                  <TableCell className="text-right font-medium">{formatDecimal(row.quantity)}</TableCell>
                  <TableCell className="hidden md:table-cell">{row.unit}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{readText(row.reference_id)}</div>
                      <div className="text-xs text-muted-foreground">{readText(row.warehouse_name)}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <StoreTablePagination
          page={transactionPage}
          pageSize={getPageSizeNumber(transactionPageSize, transactionRows.length)}
          total={transactionRows.length}
          onPageChange={setTransactionPage}
        />
      </div>
    );
  };

  const departmentOptions = departmentsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Store Operations"
        description="Monitor current store stock, approve department requests, and audit stock movements from one compact workspace."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StoreTabValue)} className="space-y-3">
        <TabsList className="h-auto flex-wrap bg-slate-100/90 p-1">
          <TabsTrigger value="stock" className="gap-2">
            <span>Store Stock</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{stockRows.length}</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <span>Store Request</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{requestRows.length}</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <span>Stock Transactions</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{transactionRows.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-0">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <StoreTableToolbar
              searchValue={stockSearch}
              onSearchChange={(value) => {
                setStockSearch(value);
                setStockPage(1);
              }}
              pageSize={stockPageSize}
              onPageSizeChange={(value) => {
                setStockPageSize(value);
                setStockPage(1);
              }}
              onExport={handleStockExport}
              summaryText={`${stockRows.length} stock rows available`}
              isFetching={stockQuery.isFetching}
            />
            {renderStockTable()}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-0">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <StoreTableToolbar
              searchValue={requestSearch}
              onSearchChange={(value) => {
                setRequestSearch(value);
                setRequestPage(1);
              }}
              filterContent={
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_220px_auto]">
                  <div className="space-y-1">
                    <label htmlFor="store-request-from-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      From Date
                    </label>
                    <Input
                      id="store-request-from-date"
                      type="date"
                      value={requestDraftFilters.fromDate}
                      onChange={(event) => setRequestDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="store-request-to-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      To Date
                    </label>
                    <Input
                      id="store-request-to-date"
                      type="date"
                      value={requestDraftFilters.toDate}
                      onChange={(event) => setRequestDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                    <Select
                      value={requestDraftFilters.status}
                      onValueChange={(value) => setRequestDraftFilters((current) => ({ ...current, status: value as RequestStatusFilter }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                    <Select
                      value={requestDraftFilters.department}
                      onValueChange={(value) => setRequestDraftFilters((current) => ({ ...current, department: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {departmentOptions.map((department) => (
                          <SelectItem key={department.id} value={department.name}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="h-9 w-full"
                      onClick={() =>
                        startRequestFilterTransition(() => {
                          setRequestFilters(requestDraftFilters);
                          setRequestPage(1);
                        })
                      }
                      disabled={isRequestFilterPending}
                    >
                      Go
                    </Button>
                  </div>
                </div>
              }
              pageSize={requestPageSize}
              onPageSizeChange={(value) => {
                setRequestPageSize(value);
                setRequestPage(1);
              }}
              onExport={handleRequestExport}
              summaryText={`${requestRows.length} requests in the current queue`}
              isFetching={requestsQuery.isFetching || approveRequestMutation.isPending || rejectRequestMutation.isPending}
            />
            {renderRequestTable()}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-0">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <StoreTableToolbar
              searchValue={transactionSearch}
              onSearchChange={(value) => {
                setTransactionSearch(value);
                setTransactionPage(1);
              }}
              filterContent={
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_220px_auto]">
                  <div className="space-y-1">
                    <label htmlFor="store-transaction-from-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      From Date
                    </label>
                    <Input
                      id="store-transaction-from-date"
                      type="date"
                      value={transactionDraftFilters.fromDate}
                      onChange={(event) => setTransactionDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="store-transaction-to-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      To Date
                    </label>
                    <Input
                      id="store-transaction-to-date"
                      type="date"
                      value={transactionDraftFilters.toDate}
                      onChange={(event) => setTransactionDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Type</div>
                    <Select
                      value={transactionDraftFilters.type}
                      onValueChange={(value) => setTransactionDraftFilters((current) => ({ ...current, type: value as TransactionTypeFilter }))}
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
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                    <Select
                      value={transactionDraftFilters.department}
                      onValueChange={(value) => setTransactionDraftFilters((current) => ({ ...current, department: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {departmentOptions.map((department) => (
                          <SelectItem key={department.id} value={department.name}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="h-9 w-full"
                      onClick={() =>
                        startTransactionFilterTransition(() => {
                          setTransactionFilters(transactionDraftFilters);
                          setTransactionPage(1);
                        })
                      }
                      disabled={isTransactionFilterPending}
                    >
                      Go
                    </Button>
                  </div>
                </div>
              }
              pageSize={transactionPageSize}
              onPageSizeChange={(value) => {
                setTransactionPageSize(value);
                setTransactionPage(1);
              }}
              onExport={handleTransactionExport}
              summaryText={`${transactionRows.length} transactions in the current result set`}
              isFetching={transactionsQuery.isFetching || requestLookupQuery.isFetching}
            />
            {renderTransactionTable()}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default StorePage;
