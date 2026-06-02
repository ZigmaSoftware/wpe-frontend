import { Zap } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionReadOnlyInputClassName,
  productionTripleFieldGridClassName,
} from "./productionOrderFormStyles";

type ProductionDetailsSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionDetailsSection = ({ form }: ProductionDetailsSectionProps) => (
  <ProductionSectionCard
    title="Tracking & Lifecycle"
    description="System generated tracking information for this order."
    tone="emerald"
    icon={Zap}
  >
    <div className={productionTripleFieldGridClassName}>
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
