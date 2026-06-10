import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import {
  getProductionEditRoute,
  getProductionManageBatchRoute,
} from "@/features/production/utils/routes";
import { formatDate } from "@/lib/api-helpers";
import type { ProductionStageRecord } from "@/lib/types";
import type { ProductionStageValue } from "@/features/production/api/productionWorkspaceApi";

type ProductionStageListResultsProps = {
  rows: ProductionStageRecord[];
  stage: ProductionStageValue;
  showsBatchCount: boolean;
  showRowActions: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onNavigate: (to: string) => void;
  onDeleteOrder: (orderId: number, productionId: string) => void;
  isDeleting?: boolean;
  getProductionName: (row: ProductionStageRecord) => string;
};

const ProductionStageListResults = ({
  rows,
  stage,
  showsBatchCount,
  showRowActions,
  page,
  pageSize,
  total,
  onPageChange,
  onNavigate,
  onDeleteOrder,
  isDeleting = false,
  getProductionName,
}: ProductionStageListResultsProps) => (
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
            {showRowActions ? <TableHead className="w-[120px] text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={`${stage}-${row.id}`}
              className="cursor-pointer hover:bg-slate-50/80"
              onClick={() => onNavigate(getProductionManageBatchRoute(row.order_id, stage === "PR" ? undefined : stage))}
            >
              <TableCell className="font-mono text-xs font-medium">{row.production_id || "-"}</TableCell>
              <TableCell className="font-medium">{getProductionName(row)}</TableCell>
              <TableCell>{showsBatchCount ? row.batch_count ?? 0 : row.display_batch_no || row.batch_no || "-"}</TableCell>
              <TableCell className="text-muted-foreground">-</TableCell>
              <TableCell>{formatDate(row.start_date_time || row.production_date)}</TableCell>
              <TableCell>{formatDate(row.end_date_time)}</TableCell>
              {showRowActions ? (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500 hover:text-slate-900"
                      onClick={(event) => {
                        event.stopPropagation();
                        onNavigate(getProductionEditRoute(row.order_id));
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      disabled={isDeleting}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteOrder(row.order_id, row.production_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <StoreTablePagination
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
    />
  </>
);

export default memo(ProductionStageListResults);
