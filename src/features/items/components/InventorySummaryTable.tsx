import { ArrowUpRight } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/QueryState";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import InventorySummarySkeleton from "@/features/items/components/InventorySummarySkeleton";
import type { InventorySummaryRow } from "@/features/items/types";
import { formatDateTime, formatDecimal } from "@/lib/api-helpers";

type InventorySummaryTableProps = {
  rows: InventorySummaryRow[];
  isLoading: boolean;
  isError: boolean;
  errorDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onRowClick: (row: InventorySummaryRow) => void;
};

const InventorySummaryTable = ({
  rows,
  isLoading,
  isError,
  errorDescription,
  emptyTitle,
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onRowClick,
}: InventorySummaryTableProps) => {
  if (isLoading) {
    return <InventorySummarySkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        description={errorDescription}
        action={
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="max-h-[calc(100vh-18rem)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-card">
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="hidden md:table-cell">Unit</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Total Inward</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Total Outward</TableHead>
              <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.item_id}-${row.item_code}`}
                tabIndex={0}
                role="button"
                className="cursor-pointer transition-all duration-200 hover:-translate-y-px hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onRowClick(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-card-foreground">{row.item_name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">{row.item_code}</div>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground md:hidden">
                        <div>Unit: {row.unit}</div>
                        <div>Updated: {formatDateTime(row.last_updated)}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-card-foreground">{formatDecimal(row.current_stock)}</TableCell>
                <TableCell className="hidden md:table-cell">{row.unit}</TableCell>
                <TableCell className="hidden lg:table-cell text-right">{formatDecimal(row.total_inward)}</TableCell>
                <TableCell className="hidden lg:table-cell text-right">{formatDecimal(row.total_outward)}</TableCell>
                <TableCell className="hidden xl:table-cell">{formatDateTime(row.last_updated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default InventorySummaryTable;
