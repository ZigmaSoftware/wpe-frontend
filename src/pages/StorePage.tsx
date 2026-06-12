import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import InventoryStockTable from "@/features/items/components/InventoryStockTable";
import type { InventorySummaryRow } from "@/features/items/types";
import { storeApi } from "@/features/store/api/storeApi";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { STORE_STOCK_ROUTE, type StoreWorkspaceModuleDefinition } from "@/features/store/utils/routes";
import { getPageCount, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";
import type { StoreStockRequest, StoreTransactionRecord } from "@/lib/types";

type StorePageModule = "stock" | "requests" | "transactions";
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

type RequestReviewLine = {
  itemId: number;
  itemName: string;
  itemCode: string;
  requestedQty: string;
  providedQty: string;
  unit: string;
  reason: string;
};

type RequestReviewError = {
  providedQty?: string;
  reason?: string;
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

const isNonNegativeDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);

const shouldBlockQuantityKey = (key: string) => key === "-" || key === "+";

const getProvideQtyError = (value: string, requestedQty: string) => {
  if (!value.trim()) return "Provide Qty is required.";
  if (value.includes("-")) return "Provide Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Provide Qty must be numeric.";

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return "Provide Qty must be numeric.";
  if (parsedValue < 0) return "Provide Qty cannot be negative.";

  const parsedRequestedQty = requestedQty ? Number(requestedQty) : Number.NaN;
  if (Number.isFinite(parsedRequestedQty) && parsedValue > parsedRequestedQty) {
    return "Provide Qty cannot exceed Requested Qty.";
  }

  return undefined;
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

const getRequestResponseLabel = (row: StoreStockRequest) => {
  const responder = row.approved_by_username?.trim();
  const respondedAt = row.approved_at ? formatDateTime(row.approved_at) : "";

  if (responder && respondedAt) {
    return { responder, respondedAt };
  }

  if (responder) {
    return { responder, respondedAt: "-" };
  }

  if (respondedAt) {
    return { responder: "-", respondedAt };
  }

  return { responder: "-", respondedAt: "-" };
};

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

const STORE_MODULE_META: Record<StorePageModule, Pick<StoreWorkspaceModuleDefinition, "label" | "description">> = {
  stock: {
    label: "Store Stock",
    description: "Monitor current store stock balances, inwards, outwards, and item-level movement access.",
  },
  requests: {
    label: "Request Approval's",
    description: "Review department requests, approval decisions, issued quantities, and request reasons.",
  },
  transactions: {
    label: "Store Transactions",
    description: "Audit stock movement transactions by type, department, warehouse, and reference history.",
  },
};

type StorePageProps = {
  module?: StorePageModule;
};

const StorePage = ({ module = "stock" }: StorePageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [stockSearch, setStockSearch] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState<StorePageSizeValue>("10");

  const [requestSearch, setRequestSearch] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [respondedRequestPage, setRespondedRequestPage] = useState(1);
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
  const [requestReviewTarget, setRequestReviewTarget] = useState<StoreStockRequest | null>(null);
  const [requestReviewItems, setRequestReviewItems] = useState<RequestReviewLine[]>([]);
  const [requestReviewErrors, setRequestReviewErrors] = useState<Record<number, RequestReviewError>>({});

  const deferredStockSearch = useDeferredValue(stockSearch.trim());
  const deferredRequestSearch = useDeferredValue(requestSearch.trim());
  const deferredTransactionSearch = useDeferredValue(transactionSearch.trim());

  const departmentsQuery = useQuery({
    queryKey: ["store", "departments"],
    queryFn: storeApi.listDepartments,
    enabled: module !== "stock",
    staleTime: 5 * 60 * 1000,
  });

  const stockQuery = useQuery({
    queryKey: ["store", "stock-summary", deferredStockSearch],
    queryFn: () => storeApi.listStockSummary({ search: deferredStockSearch }),
    enabled: module === "stock",
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
    enabled: module === "requests",
    placeholderData: (previousData) => previousData,
  });

  const requestLookupQuery = useQuery({
    queryKey: ["store", "request-lookup"],
    queryFn: () => storeApi.listRequests({}),
    enabled: module === "transactions",
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
    enabled: module === "transactions",
    placeholderData: (previousData) => previousData,
  });

  const showAllRequestStatuses = () => {
    setRequestDraftFilters((current) => (current.status === "all" ? current : { ...current, status: "all" }));
    setRequestFilters((current) => (current.status === "all" ? current : { ...current, status: "all" }));
    setRequestPage(1);
    setRespondedRequestPage(1);
  };

  const openRequestReviewDialog = (row: StoreStockRequest) => {
    const reviewRows = row.items?.length
      ? row.items
      : row.item
        ? [
            {
              id: row.id,
              item: row.item,
              item_code: readText(row.item_code),
              item_name: readText(row.item_name),
              unit: readText(row.unit),
              requested_qty: row.quantity,
            },
          ]
        : [];

    setRequestReviewTarget(row);
    setRequestReviewItems(
      reviewRows.map((item) => ({
        itemId: item.item,
        itemName: item.item_name,
        itemCode: item.item_code,
        requestedQty: item.requested_qty,
        providedQty: item.requested_qty,
        unit: item.unit,
        reason: "",
      })),
    );
    setRequestReviewErrors({});
  };

  const closeRequestReviewDialog = () => {
    setRequestReviewTarget(null);
    setRequestReviewItems([]);
    setRequestReviewErrors({});
  };

  const requestReviewMutation = useMutation({
    mutationFn: async (payload: { requestId: number; items: Array<{ item: number; provided_qty: string; remarks: string }> }) => {
      const response = await coreApi.post(`/api/store/approve-request/${payload.requestId}/`, {
        items: payload.items,
      });
      return response.data;
    },
    onSuccess: () => {
      closeRequestReviewDialog();
      showAllRequestStatuses();
      toast.success("Store request reviewed.");
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to save store request review.")),
  });

  const requestDepartmentMap = (requestLookupQuery.data ?? []).reduce<Record<string, string>>((map, row) => {
    if (row.request_no) {
      map[row.request_no] = row.department;
    }

    return map;
  }, {});

  const isRequestReviewReady =
    requestReviewItems.length > 0 &&
    requestReviewItems.every((item) => {
      const qtyError = getProvideQtyError(item.providedQty, item.requestedQty);
      if (qtyError) {
        return false;
      }

      const providedQty = Number(item.providedQty);
      const requestedQty = Number(item.requestedQty);
      const quantityChanged = Number.isFinite(providedQty) && Number.isFinite(requestedQty) && providedQty !== requestedQty;
      if (quantityChanged && !item.reason.trim()) {
        return false;
      }

      return true;
    });

  const submitRequestReview = () => {
    if (!requestReviewTarget) {
      return;
    }

    const nextErrors: Record<number, RequestReviewError> = {};
    let hasErrors = false;

    requestReviewItems.forEach((item, index) => {
      const providedQtyError = getProvideQtyError(item.providedQty, item.requestedQty);
      const providedQty = Number(item.providedQty);
      const requestedQty = Number(item.requestedQty);
      const quantityChanged = Number.isFinite(providedQty) && Number.isFinite(requestedQty) && providedQty !== requestedQty;
      const reasonError = quantityChanged && !item.reason.trim() ? "Reason is required when Provide Qty is different from Requested Qty." : undefined;

      if (providedQtyError || reasonError) {
        nextErrors[index] = {
          providedQty: providedQtyError,
          reason: reasonError,
        };
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setRequestReviewErrors(nextErrors);
      return;
    }

    requestReviewMutation.mutate({
      requestId: requestReviewTarget.id,
      items: requestReviewItems.map((item) => ({
        item: item.itemId,
        provided_qty: item.providedQty,
        remarks: item.reason.trim(),
      })),
    });
  };

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
  const pendingRequestRows = requestRows.filter((row) => row.status === "PENDING");
  const respondedRequestRows = requestRows.filter((row) => row.status !== "PENDING");

  const paginatedRequestRows = paginateRows(pendingRequestRows, requestPage, requestPageSize);
  const paginatedRespondedRequestRows = paginateRows(respondedRequestRows, respondedRequestPage, requestPageSize);
  const paginatedTransactionRows = paginateRows(transactionRows, transactionPage, transactionPageSize);

  useEffect(() => {
    const totalPages = getPageCount(stockPageSize, stockRows.length);
    if (stockPage > totalPages) {
      setStockPage(totalPages);
    }
  }, [stockPage, stockPageSize, stockRows.length]);

  useEffect(() => {
    const totalPages = getPageCount(requestPageSize, pendingRequestRows.length);
    if (requestPage > totalPages) {
      setRequestPage(totalPages);
    }
  }, [pendingRequestRows.length, requestPage, requestPageSize]);

  useEffect(() => {
    const totalPages = getPageCount(requestPageSize, respondedRequestRows.length);
    if (respondedRequestPage > totalPages) {
      setRespondedRequestPage(totalPages);
    }
  }, [requestPageSize, respondedRequestPage, respondedRequestRows.length]);

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
        { label: "Responded By", value: (row) => row.approved_by_username || "-" },
        { label: "Response Date", value: (row) => (row.approved_at ? formatDateTime(row.approved_at) : "-") },
      ];

      exportTableData({
        title: "Request Approval's",
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
        onRowClick={(row) => navigate(`${STORE_STOCK_ROUTE}/${row.item_id}`, { state: { row } })}
      />
    );
  };

  const renderRequestTable = () => {
    if (requestsQuery.isLoading) {
      return <LoadingState label="Loading request approvals..." />;
    }

    if (requestsQuery.isError) {
      return <ErrorState description={getApiErrorMessage(requestsQuery.error, "Unable to load request approvals.")} />;
    }

    if (!requestRows.length) {
      return (
        <EmptyState
          title="No request approvals"
          description="No department requests matched the selected date range, status, or department filters."
        />
      );
    }

    return (
      <div className="space-y-6">
        {pendingRequestRows.length ? (
          <div className="space-y-3">
            <div className="px-1 text-sm font-semibold text-card-foreground">Pending Requests</div>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequestRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {(requestPage - 1) * getPageSizeNumber(requestPageSize, pendingRequestRows.length) + index + 1}
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
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => openRequestReviewDialog(row)}
                              disabled={requestReviewMutation.isPending}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Open
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <StoreTablePagination
                page={requestPage}
                pageSize={getPageSizeNumber(requestPageSize, pendingRequestRows.length)}
                total={pendingRequestRows.length}
                onPageChange={setRequestPage}
              />
            </div>
          </div>
        ) : null}

        {respondedRequestRows.length ? (
          <div className="space-y-3">
            <div className="px-1 text-sm font-semibold text-card-foreground">Responded Requests</div>
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
                      <TableHead className="hidden xl:table-cell">Responded By and Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRespondedRequestRows.map((row, index) => {
                      const responseDetails = getRequestResponseLabel(row);

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {(respondedRequestPage - 1) * getPageSizeNumber(requestPageSize, respondedRequestRows.length) + index + 1}
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
                          <TableCell className="hidden xl:table-cell">
                            <div className="space-y-0.5">
                              <div>{responseDetails.responder}</div>
                              <div className="text-xs text-muted-foreground">{responseDetails.respondedAt}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(row.status))}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <StoreTablePagination
                page={respondedRequestPage}
                pageSize={getPageSizeNumber(requestPageSize, respondedRequestRows.length)}
                total={respondedRequestRows.length}
                onPageChange={setRespondedRequestPage}
              />
            </div>
          </div>
        ) : null}
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
        title={STORE_MODULE_META[module].label}
        description={STORE_MODULE_META[module].description}
      />
      {module === "stock" ? (
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
      ) : null}

      {module === "requests" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={requestSearch}
            onSearchChange={(value) => {
              setRequestSearch(value);
              setRequestPage(1);
              setRespondedRequestPage(1);
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
                        setRespondedRequestPage(1);
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
              setRespondedRequestPage(1);
            }}
            onExport={handleRequestExport}
            summaryText={`${pendingRequestRows.length} pending and ${respondedRequestRows.length} responded requests in the current result set`}
            isFetching={requestsQuery.isFetching || requestReviewMutation.isPending}
          />
          {renderRequestTable()}
        </div>
      ) : null}

      {module === "transactions" ? (
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
      ) : null}

      <Dialog
        open={Boolean(requestReviewTarget)}
        onOpenChange={(open) => {
          if (!open) {
            closeRequestReviewDialog();
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Request Review</DialogTitle>
            <DialogDescription>
              Review each requested item for <span className="font-semibold">{requestReviewTarget?.request_no ?? "-"}</span>.
              Full approval keeps the requested quantity. Reduce any line to reject or partially approve it.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Request No</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.request_no ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.department ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Requested By</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.requested_by_username ?? "-"}</div>
              </div>
            </div>

            {requestReviewItems.map((item, index) => {
              const requestedQtyNumber = Number(item.requestedQty);
              const providedQtyNumber = Number(item.providedQty);
              const reasonRequired =
                item.providedQty.trim() &&
                Number.isFinite(providedQtyNumber) &&
                Number.isFinite(requestedQtyNumber) &&
                providedQtyNumber !== requestedQtyNumber;

              return (
                <div key={`${item.itemId}-${index}`} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Item Name</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{item.itemName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.itemCode}
                        {item.unit ? ` | ${item.unit}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Requested Qty</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {formatDecimal(item.requestedQty)}{item.unit ? ` ${item.unit}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`request-provided-${index}`}>
                        Provide Qty <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`request-provided-${index}`}
                        inputMode="decimal"
                        value={item.providedQty}
                        onKeyDown={(event) => {
                          if (shouldBlockQuantityKey(event.key)) {
                            event.preventDefault();
                          }
                        }}
                        onPaste={(event) => {
                          const pastedValue = event.clipboardData.getData("text");
                          const pastedError = getProvideQtyError(pastedValue, item.requestedQty);
                          if (pastedError) {
                            event.preventDefault();
                            setRequestReviewErrors((current) => ({
                              ...current,
                              [index]: {
                                ...current[index],
                                providedQty: pastedError,
                              },
                            }));
                          }
                        }}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          const nextError = getProvideQtyError(nextValue, item.requestedQty);

                          setRequestReviewItems((current) =>
                            current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, providedQty: nextValue } : entry)),
                          );
                          setRequestReviewErrors((current) => {
                            const nextErrors = { ...current, [index]: { ...current[index], providedQty: nextError } };
                            if (
                              nextValue.trim() &&
                              Number.isFinite(Number(nextValue)) &&
                              Number.isFinite(Number(item.requestedQty)) &&
                              Number(nextValue) === Number(item.requestedQty)
                            ) {
                              nextErrors[index] = { providedQty: nextError };
                            } else if (nextValue.trim() && !nextError && !current[index]?.reason?.trim()) {
                              nextErrors[index] = {
                                providedQty: nextError,
                                reason: "Reason is required when Provide Qty is different from Requested Qty.",
                              };
                            } else if (!nextValue.trim()) {
                              nextErrors[index] = { providedQty: nextError };
                            }
                            return nextErrors;
                          });
                        }}
                        placeholder="Enter provide quantity"
                        className={requestReviewErrors[index]?.providedQty ? "border-destructive" : ""}
                      />
                      {requestReviewErrors[index]?.providedQty ? (
                        <p className="text-xs text-destructive">{requestReviewErrors[index]?.providedQty}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`request-reason-${index}`}>
                        Reason{reasonRequired ? <span className="text-destructive"> *</span> : null}
                      </Label>
                      <Textarea
                        id={`request-reason-${index}`}
                        rows={3}
                        value={item.reason}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setRequestReviewItems((current) =>
                            current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, reason: nextValue } : entry)),
                          );
                          setRequestReviewErrors((current) => ({ ...current, [index]: { ...current[index], reason: undefined } }));
                        }}
                        placeholder="Enter reason when provide qty is different from requested qty"
                        className={requestReviewErrors[index]?.reason ? "border-destructive" : ""}
                      />
                      {requestReviewErrors[index]?.reason ? <p className="text-xs text-destructive">{requestReviewErrors[index]?.reason}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRequestReviewDialog} disabled={requestReviewMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitRequestReview} disabled={requestReviewMutation.isPending || !isRequestReviewReady}>
              {requestReviewMutation.isPending ? "Saving..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePage;
