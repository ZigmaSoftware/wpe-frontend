import type { UseFormReturn } from "react-hook-form";
import { SlidersHorizontal } from "lucide-react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionCompactInputClassName,
  productionFieldLabelClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

type ProductionSpecsSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionSpecsSection = ({ form }: ProductionSpecsSectionProps) => (
  <ProductionSectionCard
    title="Custom Specs"
    description="Capture custom production specs without changing the current order contract."
    tone="gold"
    icon={SlidersHorizontal}
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="custom_specs.material_type"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel className={productionFieldLabelClassName}>Material Type</FormLabel>
            <Input {...field} placeholder="Material type / grade..." className={productionInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="custom_specs.cbhr_inward_qty"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>CBHR Inward Qty</FormLabel>
            <Input {...field} inputMode="decimal" placeholder="0.000" className={productionCompactInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="custom_specs.cbhr_ok_qty"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>CBHR OK Qty</FormLabel>
            <Input {...field} inputMode="decimal" placeholder="0.000" className={productionCompactInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="custom_specs.cbhr_scrap_qty"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>CBHR Scrap Qty</FormLabel>
            <Input {...field} inputMode="decimal" placeholder="0.000" className={productionCompactInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="custom_specs.yet_to_pack_mtrs"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>Yet to Pack (Mtrs)</FormLabel>
            <Input {...field} inputMode="decimal" placeholder="0.000" className={productionCompactInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="custom_specs.yet_to_pack_pcs"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={productionFieldLabelClassName}>Yet to Pack (Pcs)</FormLabel>
            <Input {...field} inputMode="numeric" placeholder="0" className={productionCompactInputClassName} />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </ProductionSectionCard>
);

export default ProductionSpecsSection;
