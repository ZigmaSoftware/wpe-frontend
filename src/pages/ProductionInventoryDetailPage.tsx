import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  productionInventoryApi,
  type ProductionStage,
  type WorkCenterLookupItem,
  workCentreLookupApi,
} from "@/features/items/api/productionInventoryApi";
import {
  buildStageRows,
  filterProductionInventoryBatchRows,
  formatInventoryWeight,
  getProductionInventoryStatusBadgeClasses,
  groupProductionInventoryBatchRows,
  PRODUCTION_INVENTORY_TABS,
} from "@/features/items/utils/productionInventory";
import { PRODUCTION_INVENTORY_ROUTE } from "@/features/items/utils/routes";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { getPageSerialNumber, getPageSizeNumber, paginateRows } from "@/features/store/utils/table";

type DetailState = {
  page: number;
  pageSize: StorePageSizeValue;
  search: string;
  workCenter: string;
};

const isProductionStage = (value: string): value is ProductionStage =>
  PRODUCTION_INVENTORY_TABS.some((tab) => tab.stage !== "ALL" && tab.stage === value);

const ProductionInventoryDetailPage = () => {
  const { stage: rawStage, productionId: rawProductionId } = useParams<{
    stage?: string;
    productionId?: string;
  }>();

  const stage = rawStage && isProductionStage(rawStage) ? rawStage : null;
  const productionId = decodeURIComponent(rawProductionId ?? "").trim();
  const [state, setState] = useState<DetailState>({
    page: 1,
    pageSize: "20",
    search: "",
    workCenter: "",
  });
  const deferredSearch = useDeferredValue(state.search);

  const stageDefinition = stage
    ? PRODUCTION_INVENTORY_TABS.find((tab) => tab.stage === stage) ?? null
    : null;

  const workCenterQuery = useQuery({
    queryKey: ["production-masters", "work-centres", "lookup"],
    queryFn: () => workCentreLookupApi.list(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const stageRowsQuery = useQuery({
    queryKey: ["production-inventory", "detail", stage],
    queryFn: () => productionInventoryApi.listAllByStage(stage as ProductionStage, { includeHistory: true }),
    enabled: Boolean(stage),
    retry: false,
  });

  const granulationWorkCenterBridgeQuery = useQuery({
    queryKey: ["production-inventory", "detail", "GRANULATION_WORK_CENTER", "bridge"],
    queryFn: () => productionInventoryApi.listAllByStage("GRANULATION_WORK_CENTER", { includeHistory: true }),
    enabled: stage === "GRANULATION_STORE",
    retry: false,
    staleTime: 30 * 1000,
  });

  const stageRows = useMemo(
    () =>
      stage
        ? buildStageRows(
            stage,
            stageRowsQuery.data ?? [],
            granulationWorkCenterBridgeQuery.data ?? [],
            stageRowsQuery.data ?? [],
          )
        : [],
    [granulationWorkCenterBridgeQuery.data, stage, stageRowsQuery.data],
  );

  const productionRows = useMemo(
    () => stageRows.filter((row) => (row.production_id || "").trim() === productionId),
    [productionId, stageRows],
  );

  const batchRows = useMemo(
    () => (stage ? groupProductionInventoryBatchRows(stage, productionRows) : []),
    [productionRows, stage],
  );

  const filteredBatchRows = useMemo(
    () => filterProductionInventoryBatchRows(batchRows, deferredSearch, state.workCenter),
    [batchRows, deferredSearch, state.workCenter],
  );

  const pagedBatchRows = useMemo(
    () => paginateRows(filteredBatchRows, state.page, state.pageSize),
    [filteredBatchRows, state.page, state.pageSize],
  );

  const totalRows = filteredBatchRows.length;
  const pageSizeNumber = getPageSizeNumber(state.pageSize, totalRows);
  const workCenterOptions: WorkCenterLookupItem[] = workCenterQuery.data ?? [];

  if (!stageDefinition || !productionId) {
    return <Navigate to={PRODUCTION_INVENTORY_ROUTE} replace />;
  }

  const handleExport = async (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<(typeof filteredBatchRows)[number]>[] = [
        { label: "S.No", value: (_, index) => index + 1 },
        { label: "Batch ID", value: (row) => row.batchId },
        { label: "Weight", value: (row) => formatInventoryWeight(row.weight) },
        { label: "Status", value: (row) => (row.status === "COMPLETED" ? "Completed" : "In Progress") },
      ];

      exportTableData({
        title: `${productionId} - ${stageDefinition.label}`,
        filename: `production-inventory-${stageDefinition.stage.toLowerCase()}-${productionId}`,
        rows: filteredBatchRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export production inventory detail."));
    }
  };

  const filterContent = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Work Center
      </span>
      <Select
        value={state.workCenter || "__all__"}
        onValueChange={(value) =>
          setState((current) => ({
            ...current,
            workCenter: value === "__all__" ? "" : value,
            page: 1,
          }))
        }
      >
        <SelectTrigger className="h-8 w-full text-sm sm:w-[220px]">
          <SelectValue placeholder="All work centers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All work centers</SelectItem>
          {workCenterOptions.map((workCenter) => (
            <SelectItem key={workCenter.id} value={workCenter.name}>
              {workCenter.code ? `${workCenter.code} — ${workCenter.name}` : workCenter.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const isLoading =
    stageRowsQuery.isLoading ||
    (stage === "GRANULATION_STORE" && granulationWorkCenterBridgeQuery.isLoading);
  const isError =
    stageRowsQuery.isError ||
    (stage === "GRANULATION_STORE" && granulationWorkCenterBridgeQuery.isError);
  const combinedError =
    stageRowsQuery.error ?? granulationWorkCenterBridgeQuery.error ?? workCenterQuery.error;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="w-fit">
        <Link to={PRODUCTION_INVENTORY_ROUTE}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <PageHeader
        title={`PRD ${productionId} - ${stageDefinition.label}`}
        description="Review the batch-level inventory rows under this production order and stage."
      />

      {isError ? (
        <ErrorState description={getApiErrorMessage(combinedError, "Unable to load production inventory detail.")} />
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={state.search}
            onSearchChange={(value) => setState((current) => ({ ...current, search: value, page: 1 }))}
            filterContent={filterContent}
            pageSize={state.pageSize}
            onPageSizeChange={(value) => setState((current) => ({ ...current, pageSize: value, page: 1 }))}
            pageSizeOptions={["10", "20", "50", "100", "all"]}
            onExport={(format) => {
              void handleExport(format);
            }}
            summaryText={totalRows > 0 ? `${totalRows} batch rows` : "No batch rows found"}
            isFetching={stageRowsQuery.isFetching || granulationWorkCenterBridgeQuery.isFetching || isLoading}
          />

          {isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading batch details...</div>
          ) : pagedBatchRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="max-h-[calc(100vh-26rem)] overflow-auto">
                <Table className="min-w-[720px]">
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      <TableHead className="w-12 text-right">S.No</TableHead>
                      <TableHead>Batch ID</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedBatchRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-right text-muted-foreground">
                          {getPageSerialNumber(state.page, state.pageSize, totalRows, index)}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{row.batchId}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatInventoryWeight(row.weight)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getProductionInventoryStatusBadgeClasses(row.status)}`}
                          >
                            {row.status === "COMPLETED" ? "Completed" : "In Progress"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <StoreTablePagination
                page={state.page}
                pageSize={pageSizeNumber}
                total={totalRows}
                onPageChange={(page) => setState((current) => ({ ...current, page }))}
              />
            </div>
          ) : (
            <EmptyState
              title={`No batches for PRD ${productionId}`}
              description={`No batch rows were found for ${stageDefinition.label} under production ${productionId}.`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionInventoryDetailPage;
