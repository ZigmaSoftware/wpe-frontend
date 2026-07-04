import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductionSectionCard from "./ProductionSectionCard";
import {
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
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "plan_rows",
  });

  const visibleFields = fields.slice(0, 1);

  const rows = useWatch({ control: form.control, name: "plan_rows" }) ?? [];
  const totals = rows.reduce(
    (accumulator, row) => ({
      length: accumulator.length + parseNumericInput(row.length_mts),
      quantity: accumulator.quantity + parseNumericInput(row.qty_mts),
      packets: accumulator.packets + parseNumericInput(row.packets),
    }),
    { length: 0, quantity: 0, packets: 0 },
  );

  useEffect(() => {
    if (rows.length > 1) {
      replace(rows.slice(0, 1));
    }
  }, [replace, rows]);

  return (
    <ProductionSectionCard
      title="Production Plan"
      description="Define the production target for this order using the current single-line planning logic."
      tone="violet"
      icon={ClipboardList}
      action={
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-lg border-[#e5e7eb] bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          onClick={() =>
            form.resetField("plan_rows", {
              defaultValue: [{ length_mts: "", qty_mts: "", packets: "" }],
            })
          }
        >
          Clear
        </Button>
      }
    >
      <div className="overflow-hidden rounded-[18px] border border-[#d8e0e8] bg-white">
        <Table>
          <TableHeader className="bg-[#edf1f4]">
            <TableRow className="hover:bg-[#edf1f4]">
              <TableHead className="w-14 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">#</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Length / Label</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Qty</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Packets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleFields.map((field, index) => (
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
              </TableRow>
            ))}
            <TableRow className="bg-[#edf1f4] hover:bg-[#edf1f4]">
              <TableCell className="text-sm font-semibold text-slate-700">Totals</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.length.toFixed(3)}</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.quantity.toFixed(3)}</TableCell>
              <TableCell className="text-sm font-semibold text-slate-950">{totals.packets.toFixed(0)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] text-slate-600 md:grid-cols-3">
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
