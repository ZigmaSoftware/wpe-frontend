import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDecimal } from "@/lib/api-helpers";
import type { StoreStockRequest } from "@/lib/types";

type RequestItemsPreviewDialogProps = {
  open: boolean;
  request: StoreStockRequest | null;
  onOpenChange: (open: boolean) => void;
  requestLabel: string;
  quantityField?: "requested_qty" | "approved_qty" | "issued_qty";
  quantityLabel?: string;
  secondaryQuantityField?: "requested_qty" | "approved_qty" | "issued_qty" | null;
  secondaryQuantityLabel?: string;
  showAvailableQty?: boolean;
};

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

export const getRequestDisplayId = (request: StoreStockRequest) => request.request_no || `SR-${request.id}`;

export const getRequestItemSummary = (request: StoreStockRequest) => {
  const items = request.items ?? [];
  if (!items.length) {
    return {
      title: request.item_name || "-",
      subtitle: request.item_code || null,
      extra: null as string | null,
    };
  }

  const [firstItem, ...restItems] = items;
  return {
    title: firstItem.item_name,
    subtitle: firstItem.item_code,
    extra: restItems.length ? `+${restItems.length} more` : null,
  };
};

const RequestItemsPreviewDialog = ({
  open,
  request,
  onOpenChange,
  requestLabel,
  quantityField = "requested_qty",
  quantityLabel = "Requested Qty",
  secondaryQuantityField = null,
  secondaryQuantityLabel = "Available Qty",
  showAvailableQty = true,
}: RequestItemsPreviewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{request ? getRequestDisplayId(request) : `${requestLabel} Items`}</DialogTitle>
        <DialogDescription>Full product list for this store request.</DialogDescription>
      </DialogHeader>

      {request ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">S.No</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">{quantityLabel}</TableHead>
                {secondaryQuantityField ? <TableHead className="text-right">{secondaryQuantityLabel}</TableHead> : null}
                {showAvailableQty ? <TableHead className="text-right">Available Qty</TableHead> : null}
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(request.items ?? []).map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{readText(item.item_code)}</TableCell>
                  <TableCell>{readText(item.item_name)}</TableCell>
                  <TableCell className="text-right font-medium">{formatDecimal(item[quantityField] ?? null)}</TableCell>
                  {secondaryQuantityField ? (
                    <TableCell className="text-right font-medium">{formatDecimal(item[secondaryQuantityField] ?? null)}</TableCell>
                  ) : null}
                  {showAvailableQty ? <TableCell className="text-right">{formatDecimal(item.available_qty)}</TableCell> : null}
                  <TableCell>{readText(item.unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
);

export default RequestItemsPreviewDialog;
