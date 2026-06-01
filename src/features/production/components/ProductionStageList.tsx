import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  productionWorkspaceApi,
  type ProductionStageValue,
} from "@/features/production/api/productionWorkspaceApi";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import {
  getProductionManageBatchRoute,
  type ProductionWorkspaceModuleDefinition,
} from "@/features/production/utils/routes";
import { formatDate, formatDateTime } from "@/lib/api-helpers";
import type { ProductionStageRecord } from "@/lib/types";

type ProductionStageListProps = {
  stage: ProductionStageValue;
};

const STAGE_PAGE_META: Record<
  ProductionStageValue,
  Pick<ProductionWorkspaceModuleDefinition, "label" | "description"> & {
    pageDescription: string;
    emptyDescription: string;
    filename: string;
  }
> = {
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

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PLAN_COMPLETED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
  FAILED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PLAN_COMPLETED: "Completed",
  CLOSED: "Closed",
  FAILED: "Failed",
  REJECTED: "Rejected",
  DRAFT: "Draft",
};

const formatLabel = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "-";
  }

  if (STATUS_LABELS[normalized]) {
    return STATUS_LABELS[normalized];
  }

  if (/^[A-Z0-9_]+$/.test(normalized)) {
    return normalized
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  }

  return normalized;
};

const ProductionStatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      STATUS_BADGE_CLASSES[status] ?? "bg-slate-100 text-slate-700"
    }`}
  >
    {formatLabel(status)}
  </span>
);

const resolvePageSize = (value: StorePageSizeValue) => (value === "all" ? 200 : Number(value));

const getExportColumns = (
  stage: ProductionStageValue,
): StoreExportColumn<ProductionStageRecord>[] => {
  const columns: StoreExportColumn<ProductionStageRecord>[] = [
    { label: "Production Type", value: (row) => formatLabel(row.production_type) },
    { label: "Batch", value: (row) => row.batch_no || "-" },
    { label: "Production Date", value: (row) => formatDate(row.production_date) },
    { label: "Shift", value: (row) => row.shift || "-" },
    { label: "Line No", value: (row) => row.line_no || "-" },
    { label: "Start DateTime", value: (row) => formatDateTime(row.start_date_time) },
  ];

  if (stage === "PR") {
    columns.push({ label: "End DateTime", value: (row) => formatDateTime(row.end_date_time) });
  }

  columns.push(
    { label: "Plan ID", value: (row) => row.plan_id || "0" },
    { label: "Production Status", value: (row) => formatLabel(row.status) },
  );
  return columns;
};

const ProductionStageList = ({ stage }: ProductionStageListProps) => {
  const navigate = useNavigate();
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

  const rows = stageQuery.data?.results ?? [];
  const total = stageQuery.data?.count ?? 0;
  const statusOptions = STAGE_STATUS_OPTIONS[stage];

  const handleExport = (format: StoreExportFormat) => {
    exportTableData({
      title: meta.label,
      filename: meta.filename,
      rows,
      columns: getExportColumns(stage),
      format,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={meta.label} description={meta.pageDescription} />

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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Production Type</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Production Date</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Line No</TableHead>
                      <TableHead>Start DateTime</TableHead>
                      {stage === "PR" ? <TableHead>End DateTime</TableHead> : null}
                      <TableHead>Plan ID</TableHead>
                      <TableHead>Production Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={`${stage}-${row.id}`}
                        className="cursor-pointer hover:bg-slate-50/80"
                        onClick={() => navigate(getProductionManageBatchRoute(row.order_id))}
                      >
                        <TableCell className="font-medium">{formatLabel(row.production_type)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.batch_no || "-"}</TableCell>
                        <TableCell>{formatDate(row.production_date)}</TableCell>
                        <TableCell>{row.shift || "-"}</TableCell>
                        <TableCell>{row.line_no || "-"}</TableCell>
                        <TableCell>{formatDateTime(row.start_date_time)}</TableCell>
                        {stage === "PR" ? <TableCell>{formatDateTime(row.end_date_time)}</TableCell> : null}
                        <TableCell>{row.plan_id || "0"}</TableCell>
                        <TableCell>
                          <ProductionStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(getProductionManageBatchRoute(row.order_id));
                            }}
                          >
                            Manage Batch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <StoreTablePagination
                page={page}
                pageSize={resolvedPageSize}
                total={total}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState title={meta.label} description={meta.emptyDescription} />
          )
        ) : null}
      </div>
    </div>
  );
};

export default ProductionStageList;
