import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ProductionMachine } from "@/lib/types";
import ProductionOrderForm from "./ProductionOrderForm";
import type { CreateProductionOrderPayload } from "./productionOrderForm";

type ProductionOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateProductionOrderPayload) => void;
  isSubmitting?: boolean;
  machines: ProductionMachine[];
  machinesLoading?: boolean;
};

const ProductionOrderDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  machines,
  machinesLoading = false,
}: ProductionOrderDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="h-[92vh] max-w-[96vw] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:rounded-3xl">
      <ProductionOrderForm
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
        isSubmitting={isSubmitting}
        machines={machines}
        machinesLoading={machinesLoading}
      />
    </DialogContent>
  </Dialog>
);

export default ProductionOrderDialog;
