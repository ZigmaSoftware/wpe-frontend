import { Package2, Search } from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  formatNumberInputValue,
  type ProductionItemOption,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionHelperTextClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

type MaterialsSummaryPanelProps = {
  finishedGoods: ProductionItemOption | null;
  productionQty: number;
  bomMultiplierField: ControllerRenderProps<ProductionOrderFormValues, "materials.bom_multiplier">;
  bomMultiplierError?: string;
};

const MaterialsSummaryPanel = ({
  finishedGoods,
  productionQty,
  bomMultiplierField,
  bomMultiplierError,
}: MaterialsSummaryPanelProps) => (
  <ProductionSectionCard
    title="Manufacture Item"
    description="Select the product to calculate material requirements."
    tone="amber"
    icon={Package2}
  >
    <div className="grid gap-4 xl:grid-cols-[minmax(0,620px)_210px_250px_minmax(0,1fr)] xl:items-end">
      <div className="flex h-full flex-col justify-end space-y-2">
        <div className={productionFieldLabelClassName}>Manufacture Item*</div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <div
            className={cn(
              productionInputClassName,
              "flex items-center pl-10 pr-4",
              !finishedGoods && "text-slate-300",
            )}
          >
            {finishedGoods
              ? `${finishedGoods.item_code} - ${finishedGoods.item_name}${finishedGoods.unit ? ` (${finishedGoods.unit})` : ""}`
              : "Search finished goods from the General tab"}
          </div>
        </div>
        <div className={productionHelperTextClassName}>Selected from the finished goods field in the General tab.</div>
      </div>

      <div className="flex h-full flex-col justify-end space-y-2">
        <div className={productionFieldLabelClassName}>Production Qty*</div>
        <div className="relative">
          <div
            className={cn(
              productionInputClassName,
              "flex items-center justify-between pr-4 text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950",
            )}
          >
            <span>{formatNumberInputValue(productionQty, 3, 3)}</span>
            <span className="text-sm font-medium text-slate-400">{finishedGoods?.unit || "kg"}</span>
          </div>
        </div>
        <div className={productionHelperTextClassName}>Total quantity to be produced.</div>
      </div>

      <FormItem className="flex h-full flex-col justify-end space-y-2">
        <FormLabel className={productionFieldLabelClassName}>BOM Multiplier</FormLabel>
        <FormControl>
          <Input
            {...bomMultiplierField}
            inputMode="decimal"
            className={cn(productionInputClassName, "text-[1rem] font-semibold tracking-[-0.03em]")}
          />
        </FormControl>
        <div className={productionHelperTextClassName}>Multiplier applied to BOM quantities.</div>
        {bomMultiplierError ? <FormMessage>{bomMultiplierError}</FormMessage> : null}
      </FormItem>

      <div className="hidden xl:block" />
    </div>
  </ProductionSectionCard>
);

export default MaterialsSummaryPanel;
