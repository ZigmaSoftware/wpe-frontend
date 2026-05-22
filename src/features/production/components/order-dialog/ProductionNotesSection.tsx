import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";

type ProductionNotesSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionNotesSection = ({ form }: ProductionNotesSectionProps) => {
  const notesValue = form.watch("notes");

  return (
    <ProductionSectionCard title="Notes" description="Operational context for production, planning, and handover.">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="production_for"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-700">Production For</FormLabel>
              <Input {...field} placeholder="Customer / job / internal purpose" className="h-11 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-medium text-slate-700">Notes</FormLabel>
                <span className="text-xs text-slate-500">{notesValue.length}/2000</span>
              </div>
              <Textarea
                {...field}
                rows={4}
                maxLength={2000}
                placeholder="Add production notes, special instructions, or planning remarks."
                className="min-h-[124px] rounded-xl border-slate-200"
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
