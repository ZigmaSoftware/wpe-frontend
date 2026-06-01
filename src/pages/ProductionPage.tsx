import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productionWorkspaceApi } from "@/features/production/api/productionWorkspaceApi";
import {
  PRODUCTION_NEW_ORDER_ROUTE,
  getProductionManageBatchRoute,
} from "@/features/production/utils/routes";
import { formatDate } from "@/lib/api-helpers";
import type { ProductionOrder } from "@/lib/types";

const ProductionPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getProductionFor = (order: ProductionOrder) => {
    if (typeof order.production_for === "string" && order.production_for.trim().length > 0) {
      return order.production_for;
    }

    return order.production_type || "-";
  };

  const ordersQ = useQuery({
    queryKey: ["production-orders"],
    queryFn: productionWorkspaceApi.listOrders,
  });

  const filteredOrders = (ordersQ.data ?? []).filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (!search.trim()) return true;

    return [order.production_id, getProductionFor(order), order.production_type, order.batch_number ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search production ID or production..."
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
                  <TableHead>Prd ID</TableHead>
                  <TableHead className="w-12">L</TableHead>
                  <TableHead className="w-12">S</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => navigate(getProductionManageBatchRoute(order.id))}
                  >
                    <TableCell className="font-mono text-xs font-medium">{order.production_id}</TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell>{getProductionFor(order)}</TableCell>
                    <TableCell>{formatDate(order.production_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(getProductionManageBatchRoute(order.id));
                          }}
                        >
                          Manage Batch
                        </Button>
                      </div>
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
