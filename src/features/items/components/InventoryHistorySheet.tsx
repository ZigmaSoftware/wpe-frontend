import { Search } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/QueryState";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InventoryHistoryRow, InventoryHistoryState, InventoryHistoryTarget } from "@/features/items/types";
import { formatDateTime, formatDecimal } from "@/lib/api-helpers";

type InventoryHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: InventoryHistoryTarget | null;
  state: InventoryHistoryState;
  onStateChange: (updater: (current: InventoryHistoryState) => InventoryHistoryState) => void;
  rows: InventoryHistoryRow[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  errorDescription: string;
  onRetry: () => void;
};

const InventoryHistoryLoading = () => (
  <div className="space-y-3">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="grid grid-cols-[minmax(160px,1.5fr)_100px_100px_100px_100px_minmax(140px,1fr)] gap-3 rounded-xl border border-border px-4 py-4">
        {Array.from({ length: 6 }).map((__, cellIndex) => (
          <Skeleton key={cellIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

const InventoryHistorySheet = ({
  open,
  onOpenChange,
  target,
  state,
  onStateChange,
  rows,
  total,
  isLoading,
  isError,
  errorDescription,
  onRetry,
}: InventoryHistorySheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full border-l border-border px-0 sm:max-w-4xl">
      <SheetHeader className="border-b border-border px-6 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <SheetTitle>{target ? target.row.item_name : "Inventory History"}</SheetTitle>
          {target ? <Badge variant="outline">{target.module.toUpperCase()}</Badge> : null}
        </div>
        <SheetDescription>
          {target
            ? `Movement ledger for ${target.row.item_code}. Search transactions or narrow the timeline without leaving the summary view.`
            : "Select an inventory row to inspect its movement ledger."}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-6 py-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={state.search}
              onChange={(event) =>
                onStateChange((current) => ({
                  ...current,
                  search: event.target.value,
                  page: 1,
                }))
              }
              placeholder="Search reference, module, remarks, or user"
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={state.dateFrom}
            onChange={(event) =>
              onStateChange((current) => ({
                ...current,
                dateFrom: event.target.value,
                page: 1,
              }))
            }
          />
          <Input
            type="date"
            value={state.dateTo}
            onChange={(event) =>
              onStateChange((current) => ({
                ...current,
                dateTo: event.target.value,
                page: 1,
              }))
            }
          />
        </div>

        {isLoading ? <InventoryHistoryLoading /> : null}

        {isError ? (
          <ErrorState
            description={errorDescription}
            action={
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        ) : null}

        {!isLoading && !isError ? (
          rows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <ScrollArea className="max-h-[calc(100vh-20rem)]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Opening</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Closing</TableHead>
                      <TableHead className="hidden lg:table-cell">Reference</TableHead>
                      <TableHead className="hidden xl:table-cell">Module</TableHead>
                      <TableHead className="hidden xl:table-cell">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.reference_no ?? "row"}-${row.datetime}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{formatDateTime(row.datetime)}</div>
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground lg:hidden">
                            <div>Reference: {row.reference_no || "-"}</div>
                            <div>Module: {row.module}</div>
                            <div>User: {row.created_by}</div>
                          </div>
                        </TableCell>
                        <TableCell>{row.transaction_type}</TableCell>
                        <TableCell className="text-right font-medium">{formatDecimal(row.quantity)}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{formatDecimal(row.opening_stock)}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{formatDecimal(row.closing_stock)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{row.reference_no || "-"}</TableCell>
                        <TableCell className="hidden xl:table-cell">{row.module}</TableCell>
                        <TableCell className="hidden xl:table-cell">{row.created_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <TablePagination
                page={state.page}
                pageSize={state.pageSize}
                total={total}
                onPageChange={(page) => onStateChange((current) => ({ ...current, page }))}
                onPageSizeChange={(pageSize) =>
                  onStateChange((current) => ({
                    ...current,
                    pageSize,
                    page: 1,
                  }))
                }
              />
            </div>
          ) : (
            <EmptyState
              title="No inventory history"
              description="No transactions matched the current search or date window for this item."
            />
          )
        ) : null}
      </div>
    </SheetContent>
  </Sheet>
);

export default InventoryHistorySheet;
