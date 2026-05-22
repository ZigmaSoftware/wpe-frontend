import { Plus, Trash2 } from "lucide-react";
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
      title="Plan"
      description="Capture the compact production plan in ERP-ready rows."
      action={
        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => append(createEmptyPlanRow())}>
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      }
      contentClassName="space-y-4"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="min-w-[150px]">LENGTH (mts)</TableHead>
                <TableHead className="min-w-[150px]">QTY (mts)</TableHead>
                <TableHead className="min-w-[140px]">PACKETS</TableHead>
                <TableHead className="w-[84px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`plan_rows.${index}.length_mts` as const}
                      render={({ field: lengthField }) => (
                        <FormItem>
                          <Input
                            {...lengthField}
                            inputMode="decimal"
                            placeholder="0.000"
                            className="h-10 rounded-xl border-slate-200 bg-white"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`plan_rows.${index}.qty_mts` as const}
                      render={({ field: quantityField }) => (
                        <FormItem>
                          <Input
                            {...quantityField}
                            inputMode="decimal"
                            placeholder="0.000"
                            className="h-10 rounded-xl border-slate-200 bg-white"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`plan_rows.${index}.packets` as const}
                      render={({ field: packetsField }) => (
                        <FormItem>
                          <Input
                            {...packetsField}
                            inputMode="numeric"
                            placeholder="0"
                            className="h-10 rounded-xl border-slate-200 bg-white"
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
                      className="h-9 w-9 rounded-full text-slate-500"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Total Length</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{totals.length.toFixed(3)} mts</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Total Qty</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{totals.quantity.toFixed(3)} mts</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Total Packets</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{totals.packets.toFixed(0)}</div>
        </div>
      </div>
    </ProductionSectionCard>
  );
};

export default ProductionPlanTable;
