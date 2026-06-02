import type { ReactNode } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  createEmptyPlanRow,
  parseNumericInput,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionCompactInputClassName,
  productionFieldLabelClassName,
  productionMetricCardClassName,
  productionSidebarPanelClassName,
  productionTripleFieldGridClassName,
} from "./productionOrderFormStyles";

type ProductionPlanTableProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  sidebar?: ReactNode;
};

const ProductionPlanTable = ({ form, sidebar }: ProductionPlanTableProps) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "plan_rows",
  });

  const rows = form.watch("plan_rows");
  const totals = rows.reduce(
    (accumulator, row) => ({
      length: accumulator.length + parseNumericInput(row.length_mts),
      quantity: accumulator.quantity + parseNumericInput(row.qty_mts),
      packets: accumulator.packets + parseNumericInput(row.packets),
    }),
    { length: 0, quantity: 0, packets: 0 },
  );

  return (
    <ProductionSectionCard
      title="Plan"
      description="Capture compact production-plan rows and linked ERP order context."
      tone="violet"
      icon={ClipboardList}
      action={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-full border-slate-200 bg-white px-3.5 text-xs"
          onClick={() => append(createEmptyPlanRow())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      }
      contentClassName="space-y-4"
    >
      <div className={cn("grid gap-4", sidebar && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="space-y-3.5">
          <div className="grid gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-[16px] border border-slate-200/90 bg-[#f8fbff] p-3.5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Plan Row {index + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-slate-500 hover:bg-white"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className={productionTripleFieldGridClassName}>
                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.length_mts` as const}
                    render={({ field: lengthField }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Length (DXG)</FormLabel>
                        <Input
                          {...lengthField}
                          inputMode="decimal"
                          placeholder="0.000"
                          className={productionCompactInputClassName}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.qty_mts` as const}
                    render={({ field: quantityField }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Qty (SKG)</FormLabel>
                        <Input
                          {...quantityField}
                          inputMode="decimal"
                          placeholder="0.000"
                          className={productionCompactInputClassName}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.packets` as const}
                    render={({ field: packetsField }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Packets</FormLabel>
                        <Input
                          {...packetsField}
                          inputMode="numeric"
                          placeholder="0"
                          className={productionCompactInputClassName}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-slate-200/80 pt-3.5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Computed Totals</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className={productionMetricCardClassName}>
                <div className={productionFieldLabelClassName}>Total Length</div>
                <div className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">{totals.length.toFixed(3)}</div>
                <div className="text-[13px] text-slate-400">metres</div>
              </div>
              <div className={productionMetricCardClassName}>
                <div className={productionFieldLabelClassName}>Total Qty</div>
                <div className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">{totals.quantity.toFixed(3)}</div>
                <div className="text-[13px] text-slate-400">metres</div>
              </div>
              <div className={productionMetricCardClassName}>
                <div className={productionFieldLabelClassName}>Total Packets</div>
                <div className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">{totals.packets.toFixed(0)}</div>
                <div className="text-[13px] text-slate-400">units</div>
              </div>
            </div>
          </div>
        </div>

        {sidebar ? <div className={productionSidebarPanelClassName}>{sidebar}</div> : null}
      </div>
    </ProductionSectionCard>
  );
};

export default ProductionPlanTable;
