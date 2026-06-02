import type { UseFieldArrayRemove, UseFormReturn } from "react-hook-form";
import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  formatNumberInputValue,
  parseNumericInput,
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

const MaterialComponentRow = ({ index, row, form, remove }: MaterialComponentRowProps) => {
  const receivedQuantity = parseNumericInput(row.received_quantity);
  const status =
    row.remaining_quantity <= 0 && row.required_quantity > 0
      ? { label: "Fulfilled", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : receivedQuantity > 0
        ? { label: "Partial", className: "border-lime-200 bg-lime-50 text-lime-700" }
        : { label: "Pending", className: "border-slate-200 bg-slate-100 text-slate-600" };

  return (
    <TableRow className="align-top hover:bg-slate-50/60">
      <TableCell className="font-mono text-xs font-semibold text-[#2563eb]">{row.item_code}</TableCell>
      <TableCell className="min-w-[220px]">
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{row.item_name}</div>
          <div className="text-xs text-slate-400">
            Per unit {formatNumberInputValue(parseNumericInput(row.per_unit_quantity), 3, 3)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {row.is_bom_derived ? (
          <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 px-2.5 text-sky-700">BOM</Badge>
        ) : (
          <Badge variant="outline" className="rounded-full border-violet-200 bg-violet-50 px-2.5 text-violet-700">Manual</Badge>
        )}
      </TableCell>
      <TableCell className="min-w-[110px]">
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
    <TableCell className="min-w-[90px] text-slate-600">{row.unit}</TableCell>
    <TableCell>
      <Badge variant="outline" className={`rounded-full px-2.5 ${status.className}`}>
        {status.label}
      </Badge>
    </TableCell>
    <TableCell className="min-w-[110px] text-right">
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100">
          <Eye className="h-4 w-4" />
        </Button>
        {row.is_manual ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-[#ff6b00] hover:bg-[#fff3eb] hover:text-[#ff6b00]"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </div>
    </TableCell>
  </TableRow>
  );
};

export default MaterialComponentRow;
