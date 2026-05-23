import { Zap } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionReadOnlyInputClassName,
} from "./productionOrderFormStyles";

type ProductionDetailsSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionDetailsSection = ({ form }: ProductionDetailsSectionProps) => (
  <ProductionSectionCard
    title="Details"
    description="Auto-generated tracking fields for the production order lifecycle."
    tone="emerald"
    icon={Zap}
  >
    <div className="grid gap-4 lg:grid-cols-3">
      <FormField
        control={form.control}
        name="details.batch_auto"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>Batch (Auto)</FormLabel>
            <Input {...field} readOnly className={productionReadOnlyInputClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="details.actual_start_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>Actual Start Time (Auto)</FormLabel>
            <Input {...field} readOnly className={productionReadOnlyInputClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="details.actual_end_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>Actual End Time (Auto)</FormLabel>
            <Input {...field} readOnly className={productionReadOnlyInputClassName} />
          </FormItem>
        )}
      />
    </div>
  </ProductionSectionCard>
);

export default ProductionDetailsSection;
