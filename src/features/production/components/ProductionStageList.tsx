import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Waypoints } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  productionWorkspaceApi,
  type ProductionStageValue,
} from "@/features/production/api/productionWorkspaceApi";
import ProductionStageListResults from "@/features/production/components/ProductionStageListResults";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import {
  getProductionStageRoute,
  getProductionNewOrderRoute,
  PRODUCTION_PR_LINE_CONNECT_ROUTE,
  type ProductionWorkspaceModuleDefinition,
} from "@/features/production/utils/routes";
import {
  formatProductionListLabel,
  getProductionBatchCountLabel,
} from "@/features/production/components/productionListShared";
import { toast } from "@/components/ui/sonner";
import { coreApi } from "@/lib/api";
import { formatDate, getApiErrorMessage } from "@/lib/api-helpers";
import type { ProductionOrder, ProductionStageRecord } from "@/lib/types";

type ProductionStageListProps = {
  stage: ProductionStageValue;
  headerTitle?: string;
  headerDescription?: string;
};

const DEFAULT_AD_WORK_CENTER_NAME = "New Line Additive Work Center WIP";

const STAGE_PAGE_META: Record<
  ProductionStageValue,
  Pick<ProductionWorkspaceModuleDefinition, "label" | "description"> & {
    pageDescription: string;
    emptyDescription: string;
    filename: string;
  }
> = {
  AD: {
    label: "AD - Weightage",
    description: "Manage additive-stage production orders and their batch workflow.",
    pageDescription: "Manage additive-stage production orders and review their current workflow stage.",
    emptyDescription: "No AD - Weightage records found.",
    filename: "production-ad-weightage",
  },
  BL: {
    label: "BL - Blending",
    description: "Review blending-stage production batches and their live statuses.",
    pageDescription: "View blending-stage production batches and their current production status.",
    emptyDescription: "No BL - Blending records found.",
    filename: "production-bl-blending",
  },
  GL: {
    label: "GL - Granulation",
    description: "Review granulation-stage production batches and their live statuses.",
    pageDescription: "View granulation-stage production batches and their current production status.",
    emptyDescription: "No GL - Granulation records found.",
    filename: "production-gl-granulation",
  },
  PR: {
    label: "PR - Production",
    description: "Review final production-stage orders with running and closed records.",
    pageDescription: "View final production-stage batches and closed/running production records.",
    emptyDescription: "No PR - Production records found.",
    filename: "production-pr-production",
  },
};

const STAGE_STATUS_OPTIONS: Record<ProductionStageValue, Array<{ value: string; label: string }>> = {
  AD: [
    { value: "all", label: "All Statuses" },
    { value: "PLANNED", label: "Planned" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "PLAN_COMPLETED", label: "Completed" },
    { value: "CLOSED", label: "Closed" },
  ],
  BL: [
    { value: "all", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "FAILED", label: "Failed" },
  ],
  GL: [
    { value: "all", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "FAILED", label: "Failed" },
  ],
  PR: [
    { value: "all", label: "All Statuses" },
    { value: "PLANNED", label: "Planned" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "PLAN_COMPLETED", label: "Completed" },
    { value: "CLOSED", label: "Closed" },
  ],
};

const resolvePageSize = (value: StorePageSizeValue) => (value === "all" ? 200 : Number(value));

const getExportColumns = (
  stage: ProductionStageValue,
  orderLookup: Map<number, ProductionOrder>,
): StoreExportColumn<ProductionStageRecord>[] => {
  const getProductionName = (row: ProductionStageRecord) => {
    const matchedOrder = orderLookup.get(row.order_id);
    if (typeof matchedOrder?.production_for === "string" && matchedOrder.production_for.trim().length > 0) {
      return matchedOrder.production_for;
    }

    return formatProductionListLabel(row.production_type);
  };

  const columns: StoreExportColumn<ProductionStageRecord>[] = [
    { label: "Prd ID", value: (row) => row.production_id || "-" },
    { label: "Production Name", value: (row) => getProductionName(row) },
    { label: "No.of Batch", value: (row) => getProductionBatchCountLabel(row) },
    { label: "BOM Varient", value: () => "-" },
    { label: "Started Date", value: (row) => formatDate(row.start_date_time || row.production_date) },
    { label: "Ended Date", value: (row) => formatDate(row.end_date_time) },
  ];
  return columns;
};

const ProductionStageList = ({ stage, headerTitle, headerDescription }: ProductionStageListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meta = STAGE_PAGE_META[stage];
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StorePageSizeValue>("20");

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, dateFrom, dateTo, pageSize]);

  const resolvedPageSize = resolvePageSize(pageSize);
  const stageQuery = useQuery({
    queryKey: [
      "production-stage-records",
      stage,
      deferredSearch,
      statusFilter,
      dateFrom,
      dateTo,
      page,
      resolvedPageSize,
    ],
    queryFn: () =>
      productionWorkspaceApi.listStageRecords({
        stage,
        search: deferredSearch,
        status: statusFilter,
        dateFrom,
        dateTo,
        page,
        pageSize: resolvedPageSize,
      }),
    placeholderData: (previousData) => previousData,
  });
  const ordersLookupQuery = useQuery({
    queryKey: ["production-orders-stage-lookup"],
    queryFn: productionWorkspaceApi.listOrders,
  });

  const rows = stageQuery.data?.results ?? [];
  const total = stageQuery.data?.count ?? 0;
  const statusOptions = STAGE_STATUS_OPTIONS[stage];
  const ordersById = useMemo(
    () =>
      new Map((ordersLookupQuery.data ?? []).map((order) => [order.id, order])),
    [ordersLookupQuery.data],
  );
  const showRowActions = true;

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await coreApi.delete(`/api/production/production/${orderId}/`);
    },
    onSuccess: () => {
      toast.success("Production order deleted.");
      queryClient.invalidateQueries({ queryKey: ["production-stage-records"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders-stage-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete production order."));
    },
  });

  const getProductionName = (row: ProductionStageRecord) => {
    const matchedOrder = ordersById.get(row.order_id);
    if (typeof matchedOrder?.production_for === "string" && matchedOrder.production_for.trim().length > 0) {
      return matchedOrder.production_for;
    }

    return formatProductionListLabel(row.production_type);
  };

  const handleExport = (format: StoreExportFormat) => {
    exportTableData({
      title: headerTitle || meta.label,
      filename: meta.filename,
      rows,
      columns: getExportColumns(stage, ordersById),
      format,
    });
  };

  const handleDeleteOrder = (orderId: number, productionId: string) => {
    if (!window.confirm(`Delete production order ${productionId || orderId} ?`)) {
      return;
    }

    deleteOrderMutation.mutate(orderId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle || meta.label}
        description={headerDescription || meta.pageDescription}
        actions={
          <>
            {stage === "PR" ? (
              <Button variant="outline" onClick={() => navigate(PRODUCTION_PR_LINE_CONNECT_ROUTE)}>
                <Waypoints className="mr-2 h-4 w-4" />
                Line Connect
              </Button>
            ) : null}
            <Button
              onClick={() =>
                navigate(getProductionNewOrderRoute(), {
                  state: {
                    backTo: getProductionStageRoute(stage),
                    entryStage: stage,
                    ...(stage === "AD" ? { defaultWorkCenterName: DEFAULT_AD_WORK_CENTER_NAME } : {}),
                  },
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
                New Order
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="p-4">
          <StoreTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            filterContent={
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Date From</div>
                  <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9" />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Date To</div>
                  <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9" />
                </div>
              </div>
            }
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            onExport={handleExport}
            summaryText={`${total} ${meta.label} record${total === 1 ? "" : "s"}`}
            isFetching={stageQuery.isFetching}
          />
        </div>

        {stageQuery.isLoading ? <LoadingState label={`Loading ${meta.label} records...`} /> : null}
        {stageQuery.isError ? <ErrorState description={`Could not load ${meta.label} records.`} /> : null}

        {!stageQuery.isLoading && !stageQuery.isError ? (
          rows.length > 0 ? (
            <ProductionStageListResults
              rows={rows}
              stage={stage}
              showRowActions={showRowActions}
              page={page}
              pageSize={resolvedPageSize}
              total={total}
              onPageChange={setPage}
              onNavigate={(to) => navigate(to)}
              onDeleteOrder={handleDeleteOrder}
              isDeleting={deleteOrderMutation.isPending}
              getProductionName={getProductionName}
            />
          ) : (
            <EmptyState title={meta.label} description={meta.emptyDescription} />
          )
        ) : null}
      </div>
    </div>
  );
};

export default ProductionStageList;
