import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  createEmptyPlanRow,
  parseNumericInput,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionCompactInputClassName,
  productionFieldLabelClassName,
} from "./productionOrderFormStyles";

type ProductionPlanTableProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionPlanTable = ({ form }: ProductionPlanTableProps) => {
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
      title="Production Plan"
      description="Define the compact production plan for this order."
      tone="violet"
      icon={ClipboardList}
      action={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-2xl border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700"
          onClick={() => append(createEmptyPlanRow())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      }
    >
      <div className="overflow-hidden rounded-[20px] border border-slate-200/90 bg-white">
        <Table>
          <TableHeader className="bg-[#f8fbff]">
            <TableRow className="hover:bg-[#f8fbff]">
              <TableHead className="w-14 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">#</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Length (Mts)</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Qty</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Packets</TableHead>
              <TableHead className="w-20 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id} className="align-top hover:bg-slate-50/50">
                <TableCell className="pt-4 text-sm font-semibold text-slate-700">{index + 1}</TableCell>
                <TableCell className="min-w-[220px]">
                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.length_mts` as const}
                    render={({ field: lengthField }) => (
                      <FormItem>
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
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.qty_mts` as const}
                    render={({ field: quantityField }) => (
                      <FormItem>
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
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <FormField
                    control={form.control}
                    name={`plan_rows.${index}.packets` as const}
                    render={({ field: packetsField }) => (
                      <FormItem>
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
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-[#ff6b00] hover:bg-[#fff3eb] hover:text-[#ff6b00]"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
              <TableCell className="text-sm font-semibold text-slate-700">Totals</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.length.toFixed(3)}</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.quantity.toFixed(3)}</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.packets.toFixed(0)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] text-slate-500 md:grid-cols-3">
        <div>
          <span className={productionFieldLabelClassName}>Length</span>
          <div className="mt-1">Total planned length in metres.</div>
        </div>
        <div>
          <span className={productionFieldLabelClassName}>Qty</span>
          <div className="mt-1">Production quantity used across materials and output.</div>
        </div>
        <div>
          <span className={productionFieldLabelClassName}>Packets</span>
          <div className="mt-1">Finished packet count planned for this order.</div>
        </div>
      </div>
    </ProductionSectionCard>
  );
};

export default ProductionPlanTable;
