import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productionWorkspaceApi } from "@/features/production/api/productionWorkspaceApi";
import {
  formatProductionListLabel,
  ProductionStatusBadge,
} from "@/features/production/components/productionListShared";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, {
  type StoreExportFormat,
  type StorePageSizeValue,
} from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import {
  PRODUCTION_NEW_ORDER_ROUTE,
  getProductionManageBatchRoute,
} from "@/features/production/utils/routes";
import { formatDate } from "@/lib/api-helpers";
import type { ProductionOrder } from "@/lib/types";

const resolvePageSize = (value: StorePageSizeValue, totalRows: number) =>
  value === "all" ? Math.max(totalRows, 1) : Number(value);

const getProductionName = (order: ProductionOrder) => {
  if (typeof order.production_for === "string" && order.production_for.trim().length > 0) {
    return order.production_for;
  }

  return order.production_type || "-";
};

const getStartedDateValue = (order: ProductionOrder) => order.start_date_time || order.created_at;

const isWithinDateRange = (value: string | null | undefined, dateFrom: string, dateTo: string) => {
  if (!dateFrom && !dateTo) {
    return true;
  }

  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const comparable = parsed.toISOString().slice(0, 10);
  if (dateFrom && comparable < dateFrom) {
    return false;
  }
  if (dateTo && comparable > dateTo) {
    return false;
  }

  return true;
};

const getExportColumns = (): StoreExportColumn<ProductionOrder>[] => [
  { label: "Prd ID", value: (row) => row.production_id },
  { label: "Production Name", value: (row) => getProductionName(row) },
  { label: "No.of Batch", value: (row) => row.batch_number || "-" },
  { label: "BOM Varient", value: () => "-" },
  { label: "Started Date", value: (row) => formatDate(getStartedDateValue(row)) },
  { label: "Ended Date", value: (row) => formatDate(row.end_date_time) },
  { label: "Production Status", value: (row) => formatProductionListLabel(row.status) },
];

const ProductionPage = () => {
  const navigate = useNavigate();
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

  const ordersQ = useQuery({
    queryKey: ["production-orders"],
    queryFn: productionWorkspaceApi.listOrders,
  });

  const filteredOrders = useMemo(() => {
    const searchValue = deferredSearch.trim().toLowerCase();

    return (ordersQ.data ?? []).filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!isWithinDateRange(getStartedDateValue(order), dateFrom, dateTo)) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return [order.production_id, getProductionName(order), order.production_type, order.batch_number ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    });
  }, [dateFrom, dateTo, deferredSearch, ordersQ.data, statusFilter]);

  const resolvedPageSize = resolvePageSize(pageSize, filteredOrders.length);
  const paginatedOrders = useMemo(() => {
    if (pageSize === "all") {
      return filteredOrders;
    }

    const startIndex = (page - 1) * resolvedPageSize;
    return filteredOrders.slice(startIndex, startIndex + resolvedPageSize);
  }, [filteredOrders, page, pageSize, resolvedPageSize]);

  const handleExport = (format: StoreExportFormat) => {
    exportTableData({
      title: "AD - Weightage",
      filename: "production-ad-weightage",
      rows: paginatedOrders,
      columns: getExportColumns(),
      format,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Manage production orders, batches, and weighment entries."
        actions={
          <Button onClick={() => navigate(PRODUCTION_NEW_ORDER_ROUTE)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
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
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="PLAN_COMPLETED">Completed</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Date From</div>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Date To</div>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            }
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            onExport={handleExport}
            summaryText={`${filteredOrders.length} AD - Weightage record${filteredOrders.length === 1 ? "" : "s"}`}
            isFetching={ordersQ.isFetching}
          />
        </div>

        {ordersQ.isLoading ? <LoadingState label="Loading production orders..." /> : null}
        {ordersQ.isError ? <ErrorState description="Could not load production orders." /> : null}

        {!ordersQ.isLoading && !ordersQ.isError ? (
          filteredOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prd ID</TableHead>
                      <TableHead>Production Name</TableHead>
                      <TableHead>No.of Batch</TableHead>
                      <TableHead>BOM Varient</TableHead>
                      <TableHead>Started Date</TableHead>
                      <TableHead>Ended Date</TableHead>
                      <TableHead>Production Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-slate-50/80"
                        onClick={() => navigate(getProductionManageBatchRoute(order.id))}
                      >
                        <TableCell className="font-mono text-xs font-medium">{order.production_id}</TableCell>
                        <TableCell className="font-medium">{getProductionName(order)}</TableCell>
                        <TableCell>{order.batch_number || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell>{formatDate(getStartedDateValue(order))}</TableCell>
                        <TableCell>{formatDate(order.end_date_time)}</TableCell>
                        <TableCell>
                          <ProductionStatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <StoreTablePagination
                page={page}
                pageSize={resolvedPageSize}
                total={filteredOrders.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No production orders"
              description="Create a new order to begin tracking production batches."
            />
          )
        ) : null}
      </div>
    </div>
  );
};

export default ProductionPage;
