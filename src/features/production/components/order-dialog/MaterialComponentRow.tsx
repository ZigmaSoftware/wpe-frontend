import type { UseFormReturn } from "react-hook-form";
import { Trash2 } from "lucide-react";
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
import MaterialVariantSelect from "./MaterialVariantSelect";

type MaterialComponentRowProps = {
  index: number;
  row: ProductionMaterialComputedRow;
  form: UseFormReturn<ProductionOrderFormValues>;
  onRemove: (index: number) => void;
};

const MaterialComponentRow = ({ index, row, form, onRemove }: MaterialComponentRowProps) => {
  return (
    <TableRow className="align-top hover:bg-slate-50/60">
      <TableCell className="font-mono text-xs font-semibold text-[#2563eb]">{row.item_code}</TableCell>
      <TableCell className="min-w-[320px]">
        <div className="space-y-2">
          <div className="font-medium text-slate-900">{row.item_name}</div>
          <MaterialVariantSelect index={index} row={row} form={form} />
          <div className="text-xs text-slate-400">
            Per unit {formatNumberInputValue(parseNumericInput(row.per_unit_quantity), 3, 3)}
          </div>
        </div>
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
      <TableCell className="min-w-[120px] text-right font-medium text-slate-900">
        {formatNumberInputValue(row.required_quantity, 3, 3)}
      </TableCell>
      <TableCell className="min-w-[90px] text-slate-600">{row.unit}</TableCell>
      <TableCell className="min-w-[72px] text-right">
        {row.is_manual ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-[#ff6b00] hover:bg-[#fff3eb] hover:text-[#ff6b00]"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default MaterialComponentRow;
