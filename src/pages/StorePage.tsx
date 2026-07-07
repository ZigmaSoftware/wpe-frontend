import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, X } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryStockTable from "@/features/items/components/InventoryStockTable";
import type { InventorySummaryRow } from "@/features/items/types";
import RequestItemsPreviewDialog, { getRequestItemSummary } from "@/features/requests/components/RequestItemsPreviewDialog";
import { storeApi } from "@/features/store/api/storeApi";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import {
  STORE_CLOSED_WON_ROUTE,
  STORE_RELEASE_STOCK_ROUTE,
  STORE_REQUEST_PROCESS_ROUTE,
  STORE_REQUEST_ROUTE,
  STORE_STOCK_ROUTE,
  type StoreWorkspaceModuleDefinition,
} from "@/features/store/utils/routes";
import { getPageCount, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { StoreStockRequest, StoreTransactionRecord } from "@/lib/types";

type StorePageModule = "stock" | "request-process" | "release-stock" | "closed-won" | "transactions";
type RequestQueueModule = Extract<StorePageModule, "request-process" | "release-stock" | "closed-won">;
type TransactionTypeFilter = "all" | "inwards" | "outwards";

type RequestFilterState = {
  fromDate: string;
  toDate: string;
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
  processQty: string;
  unit: string;
  reason: string;
};

type RequestReviewError = {
  processQty?: string;
};

type ReleaseAction = "release" | "reject";

const createDefaultDateRange = () => ({
  fromDate: "",
  toDate: "",
});

const createDefaultRequestFilters = (): RequestFilterState => ({
  ...createDefaultDateRange(),
  department: "all",
});

const createDefaultTransactionFilters = (): TransactionFilterState => ({
  ...createDefaultDateRange(),
  type: "all",
  department: "all",
});

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};

const isNonNegativeDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);

const shouldBlockQuantityKey = (key: string) => key === "-" || key === "+";

const getProcessQtyError = (value: string, requestedQty: string) => {
  if (!value.trim()) return "Process Qty is required.";
  if (value.includes("-")) return "Process Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Process Qty must be numeric.";

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return "Process Qty must be numeric.";
  if (parsedValue < 0) return "Process Qty cannot be negative.";

  const parsedRequestedQty = requestedQty ? Number(requestedQty) : Number.NaN;
  if (Number.isFinite(parsedRequestedQty) && parsedValue > parsedRequestedQty) {
    return "Process Qty cannot exceed Requested Qty.";
  }

  return undefined;
};

const formatQuantityWithUnit = (quantity: string | null | undefined, unit: string | null | undefined) => {
  const formattedQuantity = formatDecimal(quantity ?? null);
  if (formattedQuantity === "-") {
    return formattedQuantity;
  }
  return `${formattedQuantity}${unit ? ` ${unit}` : ""}`;
};

const sumRequestItemQuantity = (
  items: StoreStockRequest["items"] | undefined,
  field: "requested_qty" | "approved_qty" | "issued_qty",
) => {
  if (!items?.length) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + Number(item[field] ?? 0), 0);
  return total.toFixed(3);
};

const pickRequestedSummaryQuantity = (row: StoreStockRequest) => {
  const itemTotal = sumRequestItemQuantity(row.items, "requested_qty");
  if (itemTotal !== null) {
    return itemTotal;
  }

  const totalRequestedQty = Number(row.total_requested_qty ?? Number.NaN);
  if (Number.isFinite(totalRequestedQty) && totalRequestedQty > 0) {
    return row.total_requested_qty;
  }

  const fallbackQuantity = Number(row.quantity ?? Number.NaN);
  if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
    return row.quantity;
  }

  return row.total_requested_qty ?? row.quantity;
};

const getRequestQuantity = (row: StoreStockRequest) => {
  const quantity = pickRequestedSummaryQuantity(row);
  const unit = row.unit || row.items?.[0]?.unit || "";
  return formatQuantityWithUnit(quantity, unit);
};

const getProcessedQuantityWithUnit = (row: StoreStockRequest) => {
  const quantity = sumRequestItemQuantity(row.items, "approved_qty") ?? row.total_approved_qty ?? row.quantity;
  const unit = row.unit || row.items?.[0]?.unit || "";
  return formatQuantityWithUnit(quantity, unit);
};

const getReleasedQuantityWithUnit = (row: StoreStockRequest) => {
  const quantity = sumRequestItemQuantity(row.items, "issued_qty") ?? row.total_issued_qty ?? row.quantity;
  const unit = row.unit || row.items?.[0]?.unit || "";
  return formatQuantityWithUnit(quantity, unit);
};

const getRequestItemNames = (row: StoreStockRequest) =>
  row.items?.length ? row.items.map((item) => item.item_name).join(", ") : readText(row.item_name);

const getRequestItemCodes = (row: StoreStockRequest) =>
  row.items?.length ? row.items.map((item) => item.item_code).join(", ") : readText(row.item_code);

const getProcessedQuantity = (row: StoreStockRequest) => formatDecimal(row.total_approved_qty ?? null);
const getReleasedQuantity = (row: StoreStockRequest) => formatDecimal(row.total_issued_qty ?? null);

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

const STORE_MODULE_META: Record<Exclude<StorePageModule, RequestQueueModule>, Pick<StoreWorkspaceModuleDefinition, "label" | "description">> = {
  stock: {
    label: "Store Stock",
    description: "Monitor current store stock balances, inwards, outwards, and item-level movement access.",
  },
  transactions: {
    label: "Store Transactions",
    description: "Audit stock movement transactions by type, department, warehouse, and reference history.",
  },
};

const STORE_REQUEST_APPROVAL_META: Pick<StoreWorkspaceModuleDefinition, "label" | "description"> = {
  label: "Request Approval's",
  description: "Process approved requests, release stock, and review completed handovers in one workspace.",
};

const REQUEST_QUEUE_META: Record<RequestQueueModule, Pick<StoreWorkspaceModuleDefinition, "label" | "description">> = {
  "request-process": {
    label: "Process Request",
    description: "Review head-approved requests, set process quantities, and move them to stock release.",
  },
  "release-stock": {
    label: "Release Stock",
    description: "Release processed requests, post stock movements, and complete department handover.",
  },
  "closed-won": {
    label: "Closed Won",
    description: "Review completed released requests and final release ownership.",
  },
};

const REQUEST_QUEUE_ROUTE_MAP: Record<RequestQueueModule, string> = {
  "request-process": STORE_REQUEST_ROUTE,
  "release-stock": STORE_RELEASE_STOCK_ROUTE,
  "closed-won": STORE_CLOSED_WON_ROUTE,
};

const isRequestQueueModule = (value: StorePageModule): value is RequestQueueModule =>
  value === "request-process" || value === "release-stock" || value === "closed-won";

const getRequestQueue = (module: RequestQueueModule) => {
  switch (module) {
    case "request-process":
      return "request_process" as const;
    case "release-stock":
      return "release_stock" as const;
    case "closed-won":
      return "closed_won" as const;
    default:
      return undefined;
  }
};

type StorePageProps = {
  module?: StorePageModule;
};

const StorePage = ({ module = "stock" }: StorePageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requestQueueModule = isRequestQueueModule(module) ? module : null;
  const pageMeta = requestQueueModule ? STORE_REQUEST_APPROVAL_META : STORE_MODULE_META[module];

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

  const [previewRequest, setPreviewRequest] = useState<StoreStockRequest | null>(null);
  const [requestReviewTarget, setRequestReviewTarget] = useState<StoreStockRequest | null>(null);
  const [requestReviewItems, setRequestReviewItems] = useState<RequestReviewLine[]>([]);
  const [requestReviewErrors, setRequestReviewErrors] = useState<Record<number, RequestReviewError>>({});
  const [releaseConfirmation, setReleaseConfirmation] = useState<{ request: StoreStockRequest; action: ReleaseAction } | null>(null);
  const [processRejectConfirmation, setProcessRejectConfirmation] = useState<StoreStockRequest | null>(null);
  const [processApproveConfirmation, setProcessApproveConfirmation] = useState<{ request: StoreStockRequest; items: RequestReviewLine[] } | null>(null);

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
    queryKey: ["store", "requests", module, requestFilters, deferredRequestSearch],
    queryFn: () =>
      storeApi.listRequests({
        queue: requestQueueModule ? getRequestQueue(requestQueueModule) : undefined,
        search: deferredRequestSearch,
        dateFrom: requestFilters.fromDate,
        dateTo: requestFilters.toDate,
        department: requestFilters.department,
      }),
    enabled: Boolean(requestQueueModule),
    placeholderData: (previousData) => previousData,
  });

  const requestLookupQuery = useQuery({
    queryKey: ["store", "request-lookup"],
    queryFn: () => storeApi.listRequests({ queue: "all" }),
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

  const processRequestMutation = useMutation({
    mutationFn: async (payload: { requestId: number; items: Array<{ item: number; provided_qty: string; remarks?: string }> }) =>
      storeApi.processRequest(payload.requestId, { items: payload.items }),
    onSuccess: () => {
      toast.success("Request processed.");
      closeRequestReviewDialog();
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to process the request.")),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: number) => storeApi.rejectProcessedRequest(requestId),
    onSuccess: () => {
      toast.success("Request rejected.");
      closeRequestReviewDialog();
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to reject the request.")),
  });

  const releaseRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: ReleaseAction }) =>
      action === "release" ? storeApi.releaseRequest(requestId) : storeApi.rejectReleaseRequest(requestId),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "release" ? "Request released." : "Request rejected.");
      setReleaseConfirmation(null);
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update the release request.")),
  });

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
              approved_qty: row.quantity,
              remarks: null,
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
        processQty: item.requested_qty,
        unit: item.unit,
        reason: item.remarks || "",
      })),
    );
    setRequestReviewErrors({});
  };

  const closeRequestReviewDialog = () => {
    setRequestReviewTarget(null);
    setRequestReviewItems([]);
    setRequestReviewErrors({});
  };

  const stockRows = stockQuery.data ?? [];
  const requestRows = requestsQuery.data ?? [];
  const requestDepartmentMap = (requestLookupQuery.data ?? []).reduce<Record<string, string>>((map, row) => {
    if (row.request_no) {
      map[row.request_no] = row.department;
    }
    return map;
  }, {});
  const transactionRows = (transactionsQuery.data ?? []).filter((row) => {
    if (!matchesTransactionType(row, transactionFilters.type)) {
      return false;
    }

    if (transactionFilters.department === "all") {
      return true;
    }

    return getTransactionDepartment(row, requestDepartmentMap) === transactionFilters.department;
  });

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

  const isRequestReviewReady =
    requestReviewItems.length > 0 &&
    requestReviewItems.every((item) => !getProcessQtyError(item.processQty, item.requestedQty)) &&
    requestReviewItems.some((item) => Number(item.processQty) > 0);

  const submitRequestProcess = () => {
    if (!requestReviewTarget) {
      return;
    }

    const nextErrors: Record<number, RequestReviewError> = {};
    let hasErrors = false;
    let hasPositiveQuantity = false;

    requestReviewItems.forEach((item, index) => {
      const processQtyError = getProcessQtyError(item.processQty, item.requestedQty);
      if (processQtyError) {
        nextErrors[index] = { processQty: processQtyError };
        hasErrors = true;
      }
      if (Number(item.processQty) > 0) {
        hasPositiveQuantity = true;
      }
    });

    if (!hasPositiveQuantity) {
      toast.error("At least one item must have Process Qty greater than zero.");
      return;
    }

    if (hasErrors) {
      setRequestReviewErrors(nextErrors);
      return;
    }

    processRequestMutation.mutate({
      requestId: requestReviewTarget.id,
      items: requestReviewItems.map((item) => ({
        item: item.itemId,
        provided_qty: item.processQty,
        remarks: item.reason.trim() || undefined,
      })),
    });
  };

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
        { label: "Approved By", value: (row) => row.approved_by_username || "-" },
        { label: "Requested For", value: (row) => row.requested_for_name || "-" },
        { label: "Item Codes", value: (row) => getRequestItemCodes(row) },
        { label: "Items", value: (row) => getRequestItemNames(row) },
        { label: "Requested Qty", value: (row) => getRequestQuantity(row) },
        { label: "Processed Qty", value: (row) => getProcessedQuantity(row) },
        { label: "Released Qty", value: (row) => getReleasedQuantity(row) },
        { label: "Released By", value: (row) => row.released_by_username || "-" },
      ];

      exportTableData({
        title: requestQueueModule ? REQUEST_QUEUE_META[requestQueueModule].label : STORE_REQUEST_APPROVAL_META.label,
        filename: module,
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
      return <EmptyState title="No store stock rows" description="No store inventory rows matched the current search." />;
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

  const renderRequestQueueTable = () => {
    if (!requestQueueModule) {
      return null;
    }

    if (requestsQuery.isLoading) {
      return <LoadingState label={`Loading ${REQUEST_QUEUE_META[requestQueueModule].label.toLowerCase()}...`} />;
    }

    if (requestsQuery.isError) {
      return <ErrorState description={getApiErrorMessage(requestsQuery.error, "Unable to load requests.")} />;
    }

    if (!requestRows.length) {
      return <EmptyState title={`No ${REQUEST_QUEUE_META[requestQueueModule].label.toLowerCase()}`} description="No requests matched the selected filters." />;
    }

    if (requestQueueModule === "request-process") {
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
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="hidden lg:table-cell">Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequestRows.map((row, index) => {
                  const summary = getRequestItemSummary(row);

                  return (
                    <TableRow
                      key={row.id}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => openRequestReviewDialog(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openRequestReviewDialog(row);
                        }
                      }}
                    >
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {(requestPage - 1) * getPageSizeNumber(requestPageSize, requestRows.length) + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-card-foreground">{readText(row.request_no)}</div>
                          <div className="text-xs text-muted-foreground">{formatDateTime(row.requested_at)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{row.department}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="space-y-0.5 text-left transition-colors hover:text-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewRequest(row);
                          }}
                        >
                          <div className="font-medium text-card-foreground">{summary.title}</div>
                          {summary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{summary.subtitle}</div> : null}
                          {summary.extra ? <div className="text-xs text-primary">{summary.extra}</div> : null}
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-medium">{getRequestQuantity(row)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{row.approved_by_username || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(event) => {
                            event.stopPropagation();
                            openRequestReviewDialog(row);
                          }}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    }

    if (requestQueueModule === "release-stock") {
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
                  <TableHead className="text-right">Process Qty</TableHead>
                  <TableHead className="hidden lg:table-cell">Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequestRows.map((row, index) => {
                  const summary = getRequestItemSummary(row);

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {(requestPage - 1) * getPageSizeNumber(requestPageSize, requestRows.length) + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-card-foreground">{readText(row.request_no)}</div>
                          <div className="text-xs text-muted-foreground">{formatDateTime(row.requested_at)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{row.department}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="space-y-0.5 text-left transition-colors hover:text-primary"
                          onClick={() => setPreviewRequest(row)}
                        >
                          <div className="font-medium text-card-foreground">{summary.title}</div>
                          {summary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{summary.subtitle}</div> : null}
                          {summary.extra ? <div className="text-xs text-primary">{summary.extra}</div> : null}
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-medium">{getProcessedQuantityWithUnit(row)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{row.approved_by_username || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => setReleaseConfirmation({ request: row, action: "release" })}
                            title="Release request"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setReleaseConfirmation({ request: row, action: "reject" })}
                            title="Reject request"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  <TableHead className="text-right">Released Qty</TableHead>
                  <TableHead>Released By</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {paginatedRequestRows.map((row, index) => {
                const summary = getRequestItemSummary(row);

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {(requestPage - 1) * getPageSizeNumber(requestPageSize, requestRows.length) + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-card-foreground">{readText(row.request_no)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(row.requested_at)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{row.department}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="space-y-0.5 text-left transition-colors hover:text-primary"
                        onClick={() => setPreviewRequest(row)}
                      >
                        <div className="font-medium text-card-foreground">{summary.title}</div>
                        {summary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{summary.subtitle}</div> : null}
                        {summary.extra ? <div className="text-xs text-primary">{summary.extra}</div> : null}
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-medium">{getReleasedQuantityWithUnit(row)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{row.released_by_username || "-"}</div>
                        <div className="text-xs text-muted-foreground">{row.released_at ? formatDateTime(row.released_at) : "-"}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                  <TableCell className="hidden font-mono text-xs lg:table-cell">{readText(row.transaction_no)}</TableCell>
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
      <PageHeader title={pageMeta.label} description={pageMeta.description} />

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

      {requestQueueModule ? (
        <Tabs
          value={requestQueueModule}
          onValueChange={(value) => {
            if (value === "request-process" || value === "release-stock" || value === "closed-won") {
              navigate(REQUEST_QUEUE_ROUTE_MAP[value]);
            }
          }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-xl border border-border/70 bg-muted/30 p-1">
              <TabsTrigger value="request-process">Process Request</TabsTrigger>
              <TabsTrigger value="release-stock">Release Stock</TabsTrigger>
              <TabsTrigger value="closed-won">Closed Won</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={requestQueueModule} className="mt-0">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <StoreTableToolbar
                searchValue={requestSearch}
                onSearchChange={(value) => {
                  setRequestSearch(value);
                  setRequestPage(1);
                }}
                filterContent={
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_auto]">
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
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                      <Select
                        value={requestDraftFilters.department}
                        onValueChange={(value) => setRequestDraftFilters((current) => ({ ...current, department: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All departments</SelectItem>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.id} value={String(option.name)}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="h-9 w-full"
                        disabled={isRequestFilterPending}
                        onClick={() =>
                          startRequestFilterTransition(() => {
                            setRequestFilters(requestDraftFilters);
                            setRequestPage(1);
                          })
                        }
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
                isFetching={requestsQuery.isFetching}
              />
              {renderRequestQueueTable()}
            </div>
          </TabsContent>
        </Tabs>
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
                      <SelectItem value="all">All departments</SelectItem>
                      {departmentOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.name)}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-9 w-full"
                    disabled={isTransactionFilterPending}
                    onClick={() =>
                      startTransactionFilterTransition(() => {
                        setTransactionFilters(transactionDraftFilters);
                        setTransactionPage(1);
                      })
                    }
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

      <RequestItemsPreviewDialog
        open={Boolean(previewRequest)}
        request={previewRequest}
        requestLabel="Request Approval"
        quantityField={
          requestQueueModule === "release-stock"
            ? "approved_qty"
            : requestQueueModule === "closed-won"
              ? "issued_qty"
              : "requested_qty"
        }
        quantityLabel={
          requestQueueModule === "release-stock"
            ? "Process Qty"
            : requestQueueModule === "closed-won"
              ? "Released Qty"
              : "Requested Qty"
        }
        onOpenChange={(open) => {
          if (!open) {
            setPreviewRequest(null);
          }
        }}
      />

      <Dialog
        open={Boolean(requestReviewTarget)}
        onOpenChange={(open) => {
          if (!open && !processRequestMutation.isPending && !rejectRequestMutation.isPending) {
            closeRequestReviewDialog();
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{requestReviewTarget?.request_no || "Store Request"}</DialogTitle>
            <DialogDescription>
              Review and process the requested quantities. Processed items will move to <span className="font-medium">Release Stock</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Request No</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.request_no || "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.department || "-"}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Approved By</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{requestReviewTarget?.approved_by_username || "-"}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead className="w-[280px]">Item Name</TableHead>
                    <TableHead className="w-48">Requested Qty</TableHead>
                    <TableHead className="w-56">
                      Process Qty <span className="text-destructive">*</span>
                    </TableHead>
                    <TableHead className="w-56">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestReviewItems.map((item, index) => (
                    <TableRow key={`${item.itemId}-${index}`} className="align-top">
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.itemName}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatDecimal(item.requestedQty)}{item.unit ? ` ${item.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Label htmlFor={`process-qty-${index}`} className="sr-only">
                            Process Qty
                          </Label>
                          <Input
                            id={`process-qty-${index}`}
                            inputMode="decimal"
                            value={item.processQty}
                            onKeyDown={(event) => {
                              if (shouldBlockQuantityKey(event.key)) {
                                event.preventDefault();
                              }
                            }}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              const nextError = getProcessQtyError(nextValue, item.requestedQty);

                              setRequestReviewItems((current) =>
                                current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, processQty: nextValue } : entry)),
                              );
                              setRequestReviewErrors((current) => ({
                                ...current,
                                [index]: { processQty: nextError },
                              }));
                            }}
                          />
                          {requestReviewErrors[index]?.processQty ? (
                            <p className="text-xs text-destructive">{requestReviewErrors[index]?.processQty}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.reason}
                          placeholder="Optional reason"
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setRequestReviewItems((current) =>
                              current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, reason: nextValue } : entry)),
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-24 border-orange-200 bg-white text-slate-900 hover:bg-orange-500 hover:text-white"
              onClick={() => {
                if (requestReviewTarget) {
                  setProcessRejectConfirmation(requestReviewTarget);
                  setRequestReviewTarget(null);
                }
              }}
              disabled={processRequestMutation.isPending || rejectRequestMutation.isPending}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-24 border-orange-200 bg-white text-slate-900 hover:bg-orange-500 hover:text-white"
              onClick={() => {
                if (!requestReviewTarget) return;
                const nextErrors: Record<number, RequestReviewError> = {};
                let hasErrors = false;
                let hasPositiveQuantity = false;
                requestReviewItems.forEach((item, index) => {
                  const processQtyError = getProcessQtyError(item.processQty, item.requestedQty);
                  if (processQtyError) {
                    nextErrors[index] = { processQty: processQtyError };
                    hasErrors = true;
                  }
                  if (Number(item.processQty) > 0) hasPositiveQuantity = true;
                });
                if (!hasPositiveQuantity) {
                  toast.error("At least one item must have Process Qty greater than zero.");
                  return;
                }
                if (hasErrors) {
                  setRequestReviewErrors(nextErrors);
                  return;
                }
                setProcessApproveConfirmation({ request: requestReviewTarget, items: requestReviewItems });
                setRequestReviewTarget(null);
              }}
              disabled={!isRequestReviewReady || processRequestMutation.isPending || rejectRequestMutation.isPending}
            >
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(releaseConfirmation)}
        onOpenChange={(open) => {
          if (!open && !releaseRequestMutation.isPending) {
            setReleaseConfirmation(null);
          }
        }}
        title={releaseConfirmation?.action === "release" ? "Release request" : "Reject request"}
        description={
          releaseConfirmation?.action === "release"
            ? "Are you sure you want to release this request?"
            : "Are you sure you want to reject this request?"
        }
        cancelLabel="Cancel"
        confirmLabel={releaseConfirmation?.action === "release" ? "Release" : "Reject"}
        onConfirm={() => {
          if (!releaseConfirmation) {
            return;
          }

          releaseRequestMutation.mutate({
            requestId: releaseConfirmation.request.id,
            action: releaseConfirmation.action,
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(processApproveConfirmation)}
        onOpenChange={(open) => {
          if (!open && !processRequestMutation.isPending) {
            if (processApproveConfirmation) {
              setRequestReviewTarget(processApproveConfirmation.request);
              setRequestReviewItems(processApproveConfirmation.items);
            }
            setProcessApproveConfirmation(null);
          }
        }}
        title="Process request"
        description="Are you sure you want to process this request?"
        cancelLabel="Cancel"
        confirmLabel="Process"
        onConfirm={() => {
          if (!processApproveConfirmation) return;
          processRequestMutation.mutate({
            requestId: processApproveConfirmation.request.id,
            items: processApproveConfirmation.items.map((item) => ({
              item: item.itemId,
              provided_qty: item.processQty,
              remarks: item.reason.trim() || undefined,
            })),
          });
          setProcessApproveConfirmation(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(processRejectConfirmation)}
        onOpenChange={(open) => {
          if (!open && !rejectRequestMutation.isPending) {
            setRequestReviewTarget(processRejectConfirmation);
            setProcessRejectConfirmation(null);
          }
        }}
        title="Reject request"
        description="Are you sure you want to reject this request?"
        cancelLabel="Cancel"
        confirmLabel="Reject"
        onConfirm={() => {
          if (!processRejectConfirmation) {
            return;
          }
          rejectRequestMutation.mutate(processRejectConfirmation.id);
          setProcessRejectConfirmation(null);
        }}
      />
    </div>
  );
};

export default StorePage;
