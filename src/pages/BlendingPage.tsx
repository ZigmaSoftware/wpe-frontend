import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import AdditiveItemAutocomplete from "@/components/AdditiveItemAutocomplete";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { blendingApi } from "@/features/blending/api/blendingApi";
import {
  BLENDING_STOCK_ROUTE,
  BLENDING_TRANSACTIONS_ROUTE,
} from "@/features/blending/utils/routes";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import InventoryStockTable from "@/features/items/components/InventoryStockTable";
import type { InventorySummaryRow } from "@/features/items/types";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { getPageCount, getPageSerialNumber, paginateRows } from "@/features/store/utils/table";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { StoreStockRecord, StoreStockRequest } from "@/lib/types";

type BlendingPageModule = "stock" | "requests" | "transactions";
type RequestStatusFilter = "pending" | "all" | "approved";
type TransactionStatusFilter = "all" | "pending" | "approved" | "rejected";

type RequestFilterState = {
  fromDate: string;
  toDate: string;
  status: RequestStatusFilter;
};

type TransactionFilterState = {
  fromDate: string;
  toDate: string;
  status: TransactionStatusFilter;
};

const BLENDING_DEPARTMENT = "BLENDING";

const getTodayDateInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const additiveRequestLineSchema = z.object({
  item_id: z.string().min(1, "Additive item is required."),
  quantity: z
    .string()
    .min(1, "Quantity is required.")
    .refine((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric > 0;
    }, "Quantity must be greater than zero."),
});

const additiveRequestSchema = z.object({
  items: z.array(additiveRequestLineSchema).min(1, "At least one additive item is required."),
  department: z.string().min(1, "Request department is required."),
  request_date: z.string().min(1, "Request date is required."),
  require_date: z.string().optional(),
  require_time: z.string().optional(),
  requested_for_name: z.string().min(1, "Request person is required."),
  request_reason: z.string().min(1, "Request reason is required."),
});

type AdditiveRequestValues = z.infer<typeof additiveRequestSchema>;

const createAdditiveRequestDefaults = (): AdditiveRequestValues => ({
  items: [],
  department: BLENDING_DEPARTMENT,
  request_date: getTodayDateInputValue(),
  require_date: "",
  require_time: "",
  requested_for_name: "",
  request_reason: "",
});

const createDefaultRequestFilters = (): RequestFilterState => ({
  fromDate: "",
  toDate: "",
  status: "pending",
});

const createDefaultTransactionFilters = (): TransactionFilterState => ({
  fromDate: "",
  toDate: "",
  status: "all",
});

const toStatusParam = (status: RequestStatusFilter | TransactionStatusFilter) => {
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

const getItemCategory = (item: NonNullable<StoreStockRequest["items"]>[number]) =>
  item.sub_group || item.group || item.category || "-";

const getRequestItemSummary = (request: StoreStockRequest) => {
  const items = request.items ?? [];
  if (!items.length) {
    return {
      title: request.item_name || "-",
      subtitle: request.item_code || null,
      extra: null as string | null,
    };
  }

  const [firstItem, ...restItems] = items;
  return {
    title: firstItem.item_name,
    subtitle: firstItem.item_code,
    extra: restItems.length ? `+${restItems.length} more` : null,
  };
};

const getTransactionItemCodeSummary = (request: StoreStockRequest) => {
  const items = request.items ?? [];
  if (!items.length) {
    return {
      code: request.item_code || "-",
      name: request.item_name || "-",
      extra: null as string | null,
    };
  }

  const [firstItem, ...restItems] = items;
  return {
    code: firstItem.item_code || "-",
    name: firstItem.item_name || "-",
    extra: restItems.length ? `+${restItems.length} more` : null,
  };
};

const getRequestDisplayId = (request: StoreStockRequest) => request.request_no || `SR-${request.id}`;

const statusClassName = (status: StoreStockRequest["status"]) => {
  switch (status) {
    case "APPROVED":
      return "text-emerald-700";
    case "REJECTED":
      return "text-rose-700";
    case "PENDING":
      return "text-amber-700";
    default:
      return "text-slate-700";
  }
};

const getRequestItemsText = (request: StoreStockRequest) => {
  if (request.items?.length) {
    return request.items.map((item) => item.item_name).join(", ");
  }
  return readText(request.item_name);
};

const getRequestItemCodes = (request: StoreStockRequest) => {
  if (request.items?.length) {
    return request.items.map((item) => item.item_code).join(", ");
  }
  return readText(request.item_code);
};

const BLENDING_MODULE_META: Record<BlendingPageModule, { title: string; description: string }> = {
  stock: {
    title: "Blending Stock",
    description: "Monitor current blending stock balances and review stock movement by item.",
  },
  requests: {
    title: "Store Request",
    description: "Raise and manage store requests for blending material requirements.",
  },
  transactions: {
    title: "Blending Transactions",
    description: "Review approved transfer transactions and request movement history for blending.",
  },
};

type BlendingPageProps = {
  module?: BlendingPageModule;
};

const BlendingPage = ({ module = "stock" }: BlendingPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productPickerItem, setProductPickerItem] = useState<StoreStockRecord | null>(null);
  const [productPickerResetKey, setProductPickerResetKey] = useState(0);
  const [selectedAdditiveItems, setSelectedAdditiveItems] = useState<StoreStockRecord[]>([]);
  const [previewRequest, setPreviewRequest] = useState<StoreStockRequest | null>(null);

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

  const form = useForm<AdditiveRequestValues>({
    resolver: zodResolver(additiveRequestSchema),
    defaultValues: createAdditiveRequestDefaults(),
    mode: "onChange",
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  const stockQuery = useQuery({
    queryKey: ["blending", "inventory-summary", deferredStockSearch],
    queryFn: () => itemsInventoryApi.listAllSummary("blending", { search: deferredStockSearch }),
    enabled: module === "stock",
    placeholderData: (previousData) => previousData,
  });

  const requestsQuery = useQuery({
    queryKey: ["blending", "requests", requestFilters, deferredRequestSearch],
    queryFn: () =>
      blendingApi.listRequests({
        search: deferredRequestSearch,
        status: toStatusParam(requestFilters.status),
        dateFrom: requestFilters.fromDate,
        dateTo: requestFilters.toDate,
        requestType: "ADDITIVE",
        department: BLENDING_DEPARTMENT,
      }),
    enabled: module === "requests",
    placeholderData: (previousData) => previousData,
  });

  const transactionsQuery = useQuery({
    queryKey: ["blending", "transactions", transactionFilters, deferredTransactionSearch],
    queryFn: () =>
      blendingApi.listRequests({
        search: deferredTransactionSearch,
        status: toStatusParam(transactionFilters.status),
        dateFrom: transactionFilters.fromDate,
        dateTo: transactionFilters.toDate,
        requestType: "ADDITIVE",
        department: BLENDING_DEPARTMENT,
      }),
    enabled: module === "transactions",
    placeholderData: (previousData) => previousData,
  });

  const requestStockMutation = useMutation({
    mutationFn: async (payload: AdditiveRequestValues) => {
      const normalizedItems = payload.items.reduce<Array<{ item_id: number; quantity: string }>>((result, item) => {
        const itemId = Number(item.item_id);
        const existingItem = result.find((row) => row.item_id === itemId);

        if (!existingItem) {
          result.push({
            item_id: itemId,
            quantity: item.quantity,
          });
          return result;
        }

        existingItem.quantity = String(Number(existingItem.quantity) + Number(item.quantity));
        return result;
      }, []);

      const trimmedRequireDate = payload.require_date?.trim();
      const trimmedRequireTime = payload.require_time?.trim();

      return blendingApi.createStoreRequest({
        request_type: "ADDITIVE",
        department: payload.department,
        request_date: payload.request_date,
        ...(trimmedRequireDate ? { require_date: trimmedRequireDate } : {}),
        ...(trimmedRequireTime ? { require_time: trimmedRequireTime } : {}),
        requested_for_name: payload.requested_for_name,
        request_reason: payload.request_reason,
        items: normalizedItems,
      });
    },
    onSuccess: () => {
      toast.success("Store request submitted.");
      handleDialogOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["blending"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit the store request."));
    },
  });

  const stockRows = stockQuery.data ?? [];
  const requestRows = requestsQuery.data ?? [];
  const transactionRows = transactionsQuery.data ?? [];

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

  const paginatedRequestRows = paginateRows(requestRows, requestPage, requestPageSize);
  const paginatedTransactionRows = paginateRows(transactionRows, transactionPage, transactionPageSize);

  const watchedItems = form.watch("items");
  const watchedRequestedForName = form.watch("requested_for_name");
  const watchedRequestReason = form.watch("request_reason");

  const hasDuplicateSelectedItems =
    watchedItems.filter((item) => item.item_id).length !== new Set(watchedItems.map((item) => item.item_id).filter(Boolean)).size;

  const canSubmitAdditiveRequest =
    watchedItems.length > 0 &&
    watchedItems.every((item, index) => Boolean(item.item_id && item.quantity && Number(item.quantity) > 0 && selectedAdditiveItems[index])) &&
    !hasDuplicateSelectedItems &&
    Boolean(watchedRequestedForName.trim()) &&
    Boolean(watchedRequestReason.trim()) &&
    !requestStockMutation.isPending;

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      form.reset(createAdditiveRequestDefaults());
      setProductPickerItem(null);
      setProductPickerResetKey(0);
      setSelectedAdditiveItems([]);
    }
  };

  useEffect(() => {
    if (module !== "requests") {
      setDialogOpen(false);
      form.reset(createAdditiveRequestDefaults());
      setProductPickerItem(null);
      setProductPickerResetKey(0);
      setSelectedAdditiveItems([]);
      setPreviewRequest(null);
    }
  }, [form, module]);

  const handlePickerItemChange = (item: StoreStockRecord | null) => {
    if (!item) {
      setProductPickerItem(null);
      return;
    }

    const alreadySelected = watchedItems.some((row) => row.item_id === String(item.item));
    if (alreadySelected) {
      toast.error("This product is already added to the request.");
      setProductPickerItem(null);
      setProductPickerResetKey((current) => current + 1);
      return;
    }

    itemsFieldArray.append({ item_id: String(item.item), quantity: "" });
    setSelectedAdditiveItems((current) => [...current, item]);
    setProductPickerItem(null);
    setProductPickerResetKey((current) => current + 1);
    form.clearErrors("items");
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
        title: "Blending Stock",
        filename: "blending-stock",
        rows: stockRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export blending stock."));
    }
  };

  const handleRequestExport = (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<StoreStockRequest>[] = [
        { label: "Request ID", value: (row) => getRequestDisplayId(row) },
        { label: "Item", value: (row) => getRequestItemsText(row) },
        { label: "Requested By", value: (row) => row.requested_by_username },
        { label: "Requested Date", value: (row) => formatDateTime(row.requested_at) },
        { label: "Approved By", value: (row) => row.approved_by_username || "-" },
        { label: "Status", value: (row) => row.status },
        { label: "Request Department", value: (row) => row.department },
        { label: "Request Person", value: (row) => row.requested_for_name || "-" },
        { label: "Require Date", value: (row) => row.require_date || "-" },
        { label: "Require Time", value: (row) => row.require_time || "-" },
        { label: "Request Reason", value: (row) => row.request_reason || "-" },
      ];

      exportTableData({
        title: "Blending Store Requests",
        filename: "blending-store-requests",
        rows: requestRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export store requests."));
    }
  };

  const handleTransactionExport = (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<StoreStockRequest>[] = [
        { label: "Request ID", value: (row) => getRequestDisplayId(row) },
        { label: "Item Codes", value: (row) => getRequestItemCodes(row) },
        { label: "Requested Date", value: (row) => formatDateTime(row.requested_at) },
        { label: "Approved Date", value: (row) => (row.approved_at ? formatDateTime(row.approved_at) : "-") },
        { label: "Status", value: (row) => row.status },
      ];

      exportTableData({
        title: "Blending Transactions",
        filename: "blending-transactions",
        rows: transactionRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export blending transactions."));
    }
  };

  const renderStockView = () => (
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
        summaryText={`${stockRows.length} blending rows available`}
        isFetching={stockQuery.isFetching}
      />

      {stockQuery.isLoading ? <LoadingState label="Loading blending stock..." /> : null}
      {stockQuery.isError ? <ErrorState description={getApiErrorMessage(stockQuery.error, "Unable to load blending stock.")} /> : null}
      {!stockQuery.isLoading && !stockQuery.isError ? (
        stockRows.length ? (
          <InventoryStockTable
            rows={stockRows}
            page={stockPage}
            pageSize={stockPageSize}
            onPageChange={setStockPage}
            onRowClick={(row) => navigate(`${BLENDING_STOCK_ROUTE}/${row.item_id}`, { state: { row } })}
          />
        ) : (
          <EmptyState title="No blending stock rows" description="Approved store requests will start appearing here as current blending stock." />
        )
      ) : null}
    </div>
  );

  const renderRequestView = () => (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <StoreTableToolbar
        searchValue={requestSearch}
        onSearchChange={(value) => {
          setRequestSearch(value);
          setRequestPage(1);
        }}
        filterContent={
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto]">
            <div className="space-y-1">
              <label htmlFor="blending-request-from-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                From Date
              </label>
              <Input
                id="blending-request-from-date"
                type="date"
                value={requestDraftFilters.fromDate}
                onChange={(event) => setRequestDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="blending-request-to-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                To Date
              </label>
              <Input
                id="blending-request-to-date"
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

      {requestsQuery.isLoading ? <LoadingState label="Loading store requests..." /> : null}
      {requestsQuery.isError ? <ErrorState description={getApiErrorMessage(requestsQuery.error, "Unable to load store requests.")} /> : null}
      {!requestsQuery.isLoading && !requestsQuery.isError ? (
        requestRows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-21rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                  <TableRow className="hover:bg-card">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequestRows.map((request, index) => {
                    const summary = getRequestItemSummary(request);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {getPageSerialNumber(requestPage, requestPageSize, requestRows.length, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{getRequestDisplayId(request)}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="space-y-0.5 text-left transition-colors hover:text-primary"
                            onClick={() => setPreviewRequest(request)}
                          >
                            <div className="font-medium text-card-foreground">{summary.title}</div>
                            {summary.subtitle ? <div className="font-mono text-xs text-muted-foreground">{summary.subtitle}</div> : null}
                            {summary.extra ? <div className="text-xs text-primary">{summary.extra}</div> : null}
                          </button>
                        </TableCell>
                        <TableCell>{request.requested_by_username}</TableCell>
                        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                        <TableCell>{request.approved_by_username || "-"}</TableCell>
                        <TableCell className={statusClassName(request.status)}>{request.status}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <StoreTablePagination
              page={requestPage}
              pageSize={requestPageSize === "all" ? requestRows.length || 1 : Number(requestPageSize)}
              total={requestRows.length}
              onPageChange={setRequestPage}
            />
          </div>
        ) : (
          <EmptyState title="No store requests" description="No requests matched the selected search, date range, or status." />
        )
      ) : null}
    </div>
  );

  const renderTransactionView = () => (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <StoreTableToolbar
        searchValue={transactionSearch}
        onSearchChange={(value) => {
          setTransactionSearch(value);
          setTransactionPage(1);
        }}
        filterContent={
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto]">
            <div className="space-y-1">
              <label htmlFor="blending-transaction-from-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                From Date
              </label>
              <Input
                id="blending-transaction-from-date"
                type="date"
                value={transactionDraftFilters.fromDate}
                onChange={(event) => setTransactionDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="blending-transaction-to-date" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                To Date
              </label>
              <Input
                id="blending-transaction-to-date"
                type="date"
                value={transactionDraftFilters.toDate}
                onChange={(event) => setTransactionDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
              <Select
                value={transactionDraftFilters.status}
                onValueChange={(value) => setTransactionDraftFilters((current) => ({ ...current, status: value as TransactionStatusFilter }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
        isFetching={transactionsQuery.isFetching}
      />

      {transactionsQuery.isLoading ? <LoadingState label="Loading blending transactions..." /> : null}
      {transactionsQuery.isError ? <ErrorState description={getApiErrorMessage(transactionsQuery.error, "Unable to load blending transactions.")} /> : null}
      {!transactionsQuery.isLoading && !transactionsQuery.isError ? (
        transactionRows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-21rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                  <TableRow className="hover:bg-card">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactionRows.map((request, index) => {
                    const summary = getTransactionItemCodeSummary(request);
                    return (
                      <TableRow
                        key={request.id}
                        tabIndex={0}
                        role="button"
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigate(`${BLENDING_TRANSACTIONS_ROUTE}/${request.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(`${BLENDING_TRANSACTIONS_ROUTE}/${request.id}`);
                          }
                        }}
                      >
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {getPageSerialNumber(transactionPage, transactionPageSize, transactionRows.length, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{getRequestDisplayId(request)}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs text-card-foreground">{summary.code}</div>
                            <div className="text-sm text-muted-foreground">{summary.name}</div>
                            {summary.extra ? <div className="text-xs text-primary">{summary.extra}</div> : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                        <TableCell>{request.approved_at ? formatDateTime(request.approved_at) : "-"}</TableCell>
                        <TableCell className={statusClassName(request.status)}>{request.status}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <StoreTablePagination
              page={transactionPage}
              pageSize={transactionPageSize === "all" ? transactionRows.length || 1 : Number(transactionPageSize)}
              total={transactionRows.length}
              onPageChange={setTransactionPage}
            />
          </div>
        ) : (
          <EmptyState title="No blending transactions" description="No transactions matched the selected search, date range, or status." />
        )
      ) : null}
    </div>
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title={BLENDING_MODULE_META[module].title}
        description={BLENDING_MODULE_META[module].description}
        actions={module === "requests" ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Store Request
          </Button>
        ) : undefined}
      />
      {module === "stock" ? renderStockView() : null}
      {module === "requests" ? renderRequestView() : null}
      {module === "transactions" ? renderTransactionView() : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Store Request</DialogTitle>
            <DialogDescription>
              Submit a blending store request with one or more product lines for store approval.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => requestStockMutation.mutate(values))} className="space-y-4">
              <div className="space-y-3">
                <FormItem>
                  <FormLabel>Additive Items*</FormLabel>
                  <FormControl>
                    <AdditiveItemAutocomplete
                      key={productPickerResetKey}
                      selectedItem={productPickerItem}
                      onSelectedItemChange={handlePickerItemChange}
                      error={typeof form.formState.errors.items?.message === "string" ? form.formState.errors.items.message : undefined}
                    />
                  </FormControl>
                </FormItem>

                {hasDuplicateSelectedItems ? (
                  <p className="text-sm text-destructive">Duplicate products are not allowed in the same request.</p>
                ) : null}

                {itemsFieldArray.fields.length ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-36">Quantity</TableHead>
                          <TableHead className="w-12 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsFieldArray.fields.map((itemField, index) => {
                          const selectedItem = selectedAdditiveItems[index];
                          return (
                            <TableRow key={itemField.id}>
                              <TableCell>
                                <div className="font-medium">{selectedItem?.item_name || "-"}</div>
                                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                                  <span className="font-mono">{selectedItem?.item_code || "-"}</span>
                                  <span>
                                    {formatDecimal(selectedItem?.quantity || "0")} {selectedItem?.unit || ""} available
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} placeholder="0.000" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    itemsFieldArray.remove(index);
                                    setSelectedAdditiveItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                  }}
                                  aria-label={`Remove ${selectedItem?.item_name || "item"}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    Search and select products from the dropdown to add them to this request.
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Department*</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="request_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Date*</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" readOnly className="bg-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requested_for_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Person*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Blending operator or supervisor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="require_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Require Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="require_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Require Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="request_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Reason*</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Reason for store request, batch, or production need" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <FlaskConical className="h-4 w-4" />
                  Request Type: Store Request
                </div>
                <p className="mt-1">Store will approve or reject this request and the approved quantity will move into blending stock.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmitAdditiveRequest}>
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewRequest)} onOpenChange={(open) => !open && setPreviewRequest(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewRequest ? getRequestDisplayId(previewRequest) : "Store Request Items"}</DialogTitle>
            <DialogDescription>Full product list for this store request.</DialogDescription>
          </DialogHeader>

          {previewRequest ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Requested Qty</TableHead>
                    <TableHead className="text-right">Available Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewRequest.items ?? []).map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{readText(item.item_code)}</TableCell>
                      <TableCell>{readText(item.item_name)}</TableCell>
                      <TableCell className="text-right font-medium">{formatDecimal(item.requested_qty)}</TableCell>
                      <TableCell className="text-right">{formatDecimal(item.available_qty)}</TableCell>
                      <TableCell>{readText(item.unit)}</TableCell>
                      <TableCell>{getItemCategory(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingPage;
  