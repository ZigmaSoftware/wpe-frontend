import type { UseFormReturn } from "react-hook-form";
import { NotebookText } from "lucide-react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionInputClassName,
  productionTextareaClassName,
} from "./productionOrderFormStyles";

type ProductionNotesSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionNotesSection = ({ form }: ProductionNotesSectionProps) => {
  const notesValue = form.watch("notes");

  return (
    <ProductionSectionCard
      title="Notes"
      description="Operational context for production, planning, and handover."
      tone="slate"
      icon={NotebookText}
    >
      <div className="grid gap-3">
        <FormField
          control={form.control}
          name="production_for"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Production For</FormLabel>
              <Input {...field} placeholder="Customer / Job / Internal purpose..." className={productionInputClassName} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <FormLabel className={productionFieldLabelClassName}>Notes</FormLabel>
                <span className="text-xs text-slate-400">{notesValue.length}/2000</span>
              </div>
              <Textarea
                {...field}
                rows={4}
                maxLength={2000}
                placeholder="Add production notes, special instructions, or planning remarks."
                className={productionTextareaClassName}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </ProductionSectionCard>
  );
};

export default ProductionNotesSection;
