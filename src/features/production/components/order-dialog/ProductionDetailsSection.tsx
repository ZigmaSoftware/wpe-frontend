import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";

type ProductionDetailsSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const readOnlyClassName = "h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-600";

const ProductionDetailsSection = ({ form }: ProductionDetailsSectionProps) => (
  <ProductionSectionCard title="Details" description="Auto-generated tracking fields for the production order lifecycle.">
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="details.batch_auto"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Batch (Auto)</FormLabel>
            <Input {...field} readOnly className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="details.actual_start_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Actual Start Time (Auto)</FormLabel>
            <Input {...field} readOnly className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="details.actual_end_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Actual End Time (Auto)</FormLabel>
            <Input {...field} readOnly className={readOnlyClassName} />
          </FormItem>
        )}
      />
    </div>
  </ProductionSectionCard>
);

export default ProductionDetailsSection;
