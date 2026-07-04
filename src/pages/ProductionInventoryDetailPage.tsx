import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import {
  productionInventoryApi,
  type ProductionInventoryRow,
  type ProductionStage,
} from "@/features/items/api/productionInventoryApi";
import {
  formatInventoryWeightWithUnit,
  getInventoryText,
  parseInventoryQuantity,
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
};

const isProductionStage = (value: string): value is ProductionStage =>
  PRODUCTION_INVENTORY_TABS.some((tab) => tab.stage !== "ALL" && tab.stage === value);

const formatWeightValue = (value?: string | null, uom?: string | null) =>
  formatInventoryWeightWithUnit(parseInventoryQuantity(value), uom);

const formatDatePart = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimePart = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDisplayedBatchId = (row: ProductionInventoryRow) =>
  getInventoryText(row.batch_no || row.batch_code || row.reference_no);

const filterDetailRows = (rows: ProductionInventoryRow[], search: string) => {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) =>
    [
      row.production_id,
      row.batch_no,
      row.batch_code,
      row.reference_no,
      row.scancode,
      row.binlot,
      row.baglot,
      row.created_by,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
};

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
  });
  const deferredSearch = useDeferredValue(state.search);

  const stageDefinition = stage
    ? PRODUCTION_INVENTORY_TABS.find((tab) => tab.stage === stage) ?? null
    : null;

  const detailRowsQuery = useQuery({
    queryKey: ["production-inventory", "detail", stage, productionId],
    queryFn: () =>
      productionInventoryApi.listAllByStage(stage as ProductionStage, {
        productionId,
        includeHistory: true,
      }),
    enabled: Boolean(stage && productionId),
    retry: false,
  });

  const filteredRows = useMemo(
    () => filterDetailRows(detailRowsQuery.data ?? [], deferredSearch),
    [deferredSearch, detailRowsQuery.data],
  );
  const pagedRows = useMemo(
    () => paginateRows(filteredRows, state.page, state.pageSize),
    [filteredRows, state.page, state.pageSize],
  );
  const totalRows = filteredRows.length;
  const pageSizeNumber = getPageSizeNumber(state.pageSize, totalRows);

  if (!stageDefinition || !productionId) {
    return <Navigate to={PRODUCTION_INVENTORY_ROUTE} replace />;
  }

  const handleExport = async (format: StoreExportFormat) => {
    try {
      const columns: StoreExportColumn<ProductionInventoryRow>[] = [
        { label: "S.No", value: (_row, index) => index + 1 },
        { label: "Date", value: (row) => formatDatePart(row.created_at) },
        { label: "Time", value: (row) => formatTimePart(row.created_at) },
        { label: "BATCH ID", value: (row) => getDisplayedBatchId(row) },
        { label: "Captured WT", value: (row) => formatWeightValue(row.captured_weight, row.uom) },
        { label: "Scancode", value: (row) => getInventoryText(row.scancode) },
        { label: "Binlot", value: (row) => getInventoryText(row.binlot) },
        { label: "Baglot", value: (row) => getInventoryText(row.baglot) },
        { label: "Captured By", value: (row) => getInventoryText(row.created_by) },
      ];

      exportTableData({
        title: `${stageDefinition.label} - ${productionId}`,
        filename: `production-inventory-${stageDefinition.stage.toLowerCase()}-${productionId}-detail`,
        rows: filteredRows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export production inventory detail."));
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="w-fit">
        <Link to={PRODUCTION_INVENTORY_ROUTE}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <PageHeader
        title={`${stageDefinition.label} - ${productionId}`}
        description="Review the batch-level transaction rows captured under the selected production order."
      />

      {detailRowsQuery.isError ? (
        <ErrorState description={getApiErrorMessage(detailRowsQuery.error, "Unable to load production inventory detail.")} />
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={state.search}
            onSearchChange={(value) => setState((current) => ({ ...current, search: value, page: 1 }))}
            pageSize={state.pageSize}
            onPageSizeChange={(value) => setState((current) => ({ ...current, pageSize: value, page: 1 }))}
            pageSizeOptions={["10", "20", "50", "100", "all"]}
            onExport={(format) => {
              void handleExport(format);
            }}
            summaryText={totalRows > 0 ? `${totalRows} batch row${totalRows === 1 ? "" : "s"}` : "No batch rows found"}
            isFetching={detailRowsQuery.isFetching}
          />

          {detailRowsQuery.isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading batch details...</div>
          ) : pagedRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="max-h-[calc(100vh-26rem)] overflow-auto">
                <Table className="min-w-[1080px]">
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      <TableHead className="w-12 text-right">S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>BATCH ID</TableHead>
                      <TableHead className="text-right">Captured WT</TableHead>
                      <TableHead>Scancode</TableHead>
                      <TableHead>Binlot</TableHead>
                      <TableHead>Baglot</TableHead>
                      <TableHead>Captured By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row, index) => (
                      <TableRow key={`${row.stage}-${row.id}`}>
                        <TableCell className="text-right text-muted-foreground">
                          {getPageSerialNumber(state.page, state.pageSize, totalRows, index)}
                        </TableCell>
                        <TableCell>{formatDatePart(row.created_at)}</TableCell>
                        <TableCell>{formatTimePart(row.created_at)}</TableCell>
                        <TableCell className="font-mono text-sm font-medium">{getDisplayedBatchId(row)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatWeightValue(row.captured_weight, row.uom)}
                        </TableCell>
                        <TableCell>{getInventoryText(row.scancode)}</TableCell>
                        <TableCell>{getInventoryText(row.binlot)}</TableCell>
                        <TableCell>{getInventoryText(row.baglot)}</TableCell>
                        <TableCell>{getInventoryText(row.created_by)}</TableCell>
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
              title={`No rows for PRD ${productionId}`}
              description={`No batch rows were found for ${stageDefinition.label} under production ${productionId}.`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionInventoryDetailPage;
