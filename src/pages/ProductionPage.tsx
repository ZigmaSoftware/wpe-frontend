import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coreApi } from "@/lib/api";
import { formatDate, formatDecimal, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionOrder } from "@/lib/types";
import { ORDER_STATUS_CLASSES, StatusBadge } from "./productionShared";

type DashboardData = {
  planned: number;
  in_progress: number;
  completed: number;
  closed: number;
  total_machines: number;
  total_bom_variants: number;
};

const ProductionPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const dashQ = useQuery({
    queryKey: ["production-dashboard"],
    queryFn: async () => {
      const response = await coreApi.get<{ data: DashboardData } | DashboardData>("/api/production/dashboard/");
      const payload = response.data as { data?: DashboardData } & DashboardData;
      return (payload.data ?? payload) as DashboardData;
    },
  });

  const ordersQ = useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => {
      const response = await coreApi.get<unknown>("/api/production/production/");
      return normalizeListResponse<ProductionOrder>(response.data);
    },
  });

  const filteredOrders = (ordersQ.data ?? []).filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (!search.trim()) return true;

    return [order.production_id, order.production_type, order.batch_number ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const dash = dashQ.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Manage production orders, batches, and weighment entries."
        actions={
          <Button onClick={() => navigate("/app/production/neworder")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Planned" value={dash?.planned ?? 0} />
        <StatCard label="In Progress" value={dash?.in_progress ?? 0} />
        <StatCard label="Completed" value={dash?.completed ?? 0} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search production ID, type, batch..."
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
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

      {ordersQ.isLoading ? <LoadingState label="Loading production orders..." /> : null}
      {ordersQ.isError ? <ErrorState description="Could not load production orders." /> : null}

      {!ordersQ.isLoading && !ordersQ.isError ? (
        filteredOrders.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Production ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Planned Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{order.production_id}</TableCell>
                    <TableCell>{order.production_type}</TableCell>
                    <TableCell>{formatDate(order.production_date)}</TableCell>
                    <TableCell>{order.shift}</TableCell>
                    <TableCell>{formatDecimal(order.planned_quantity)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} classes={ORDER_STATUS_CLASSES} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/app/production/manage-batch/${order.id}`)}
                      >
                        Manage Batch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No production orders" description="Create a new order to begin tracking production batches." />
        )
      ) : null}
    </div>
  );
};

export default ProductionPage;
