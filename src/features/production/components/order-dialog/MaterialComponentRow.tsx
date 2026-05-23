import type { UseFieldArrayRemove, UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  formatNumberInputValue,
  type ProductionMaterialComputedRow,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import { productionTableInputClassName } from "./productionOrderFormStyles";

type MaterialComponentRowProps = {
  index: number;
  row: ProductionMaterialComputedRow;
  form: UseFormReturn<ProductionOrderFormValues>;
  remove: UseFieldArrayRemove;
};

const MaterialComponentRow = ({ index, row, form, remove }: MaterialComponentRowProps) => (
  <TableRow className="align-top hover:bg-slate-50/60">
    <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
    <TableCell className="font-mono text-xs text-slate-600">{row.item_code}</TableCell>
    <TableCell className="min-w-[220px]">
      <div className="space-y-1">
        <div className="font-medium text-slate-900">{row.item_name}</div>
        <div className="flex flex-wrap gap-2">
          {row.is_bom_derived ? <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">BOM</Badge> : null}
          {row.is_manual ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Manual</Badge> : null}
          {row.source_type === "PRODUCT_SUBTYPE" ? (
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Subtype</Badge>
          ) : null}
        </div>
      </div>
    </TableCell>
    <TableCell className="min-w-[120px]">
      <FormField
        control={form.control}
        name={`materials.rows.${index}.per_unit_quantity` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                inputMode="decimal"
                className={productionTableInputClassName}
                readOnly={row.is_bom_derived}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </TableCell>
    <TableCell className="min-w-[96px] text-slate-600">{row.unit}</TableCell>
    <TableCell className="min-w-[120px] text-right font-medium text-slate-900">{formatNumberInputValue(row.bom_quantity, 3, 3)}</TableCell>
    <TableCell className="min-w-[120px] text-right font-medium text-slate-900">{formatNumberInputValue(row.required_quantity, 3, 3)}</TableCell>
    <TableCell className="min-w-[120px]">
      <FormField
        control={form.control}
        name={`materials.rows.${index}.received_quantity` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} inputMode="decimal" className={productionTableInputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </TableCell>
    <TableCell className="min-w-[120px] text-right font-medium text-slate-900">{formatNumberInputValue(row.remaining_quantity, 3, 3)}</TableCell>
    <TableCell className="min-w-[120px]">
      <FormField
        control={form.control}
        name={`materials.rows.${index}.request_quantity` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} inputMode="decimal" className={productionTableInputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </TableCell>
    <TableCell className="min-w-[120px]">
      <FormField
        control={form.control}
        name={`materials.rows.${index}.rate` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} inputMode="decimal" className={productionTableInputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </TableCell>
    <TableCell className="min-w-[140px] text-right font-semibold text-slate-950">{formatNumberInputValue(row.amount, 2, 2)}</TableCell>
    <TableCell className="min-w-[100px] text-right">
      {row.is_manual ? (
        <Button type="button" variant="ghost" className="h-8 rounded-lg px-3 text-red-600 hover:text-red-700" onClick={() => remove(index)}>
          Remove
        </Button>
      ) : (
        <span className="text-xs text-slate-400">BOM row</span>
      )}
    </TableCell>
  </TableRow>
);

export default MaterialComponentRow;
