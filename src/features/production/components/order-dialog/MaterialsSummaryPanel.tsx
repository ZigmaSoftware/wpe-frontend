import { Info, Package2, Search } from "lucide-react";
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
    title="Materials"
    description="Hand-driven materials planning for the selected manufacture item."
    tone="amber"
    icon={Package2}
  >
    <div className="rounded-[22px] border border-slate-200/90 bg-[#f8fbff] p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_160px_160px] xl:items-start">
        <div className="space-y-3">
          <div>
            <div className={productionFieldLabelClassName}>Manufacture Item*</div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <div
                className={cn(
                  productionInputClassName,
                  "flex items-center pl-10 pr-4",
                  !finishedGoods && "text-slate-300",
                )}
              >
                {finishedGoods ? `${finishedGoods.item_name}${finishedGoods.unit ? ` · ${finishedGoods.unit}` : ""}` : "Search FMS Product type sub-category..."}
              </div>
            </div>
            <div className={`mt-2 ${productionHelperTextClassName}`}>
              Search FMS Product Type sub-category and append them as manual material items without saving immediately.
            </div>
          </div>

          <div className="rounded-[20px] border border-dashed border-[#cddcf0] bg-white px-4 py-4">
            {finishedGoods ? (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2d6cdf]">
                  <Package2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{finishedGoods.item_name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {finishedGoods.item_code}
                    {finishedGoods.unit ? ` · ${finishedGoods.unit}` : ""}
                  </div>
                </div>
              </div>  
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Package2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">No finished goods selected</div>
                  <div className="mt-1 text-sm text-slate-400">Select finished goods in General tab before planning materials.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={productionFieldLabelClassName}>Production Qty*</div>
          <div className="mt-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
            {formatNumberInputValue(productionQty, 3, 3)}
          </div>
          <div className={`mt-2 ${productionHelperTextClassName}`}>Populated from General tab plan total.</div>
        </div>

        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>BOM Multiplier</FormLabel>
          <FormControl>
            <Input
              {...bomMultiplierField}
              inputMode="decimal"
              className={cn(productionInputClassName, "mt-2 text-[1.2rem] font-semibold tracking-[-0.03em]")}
            />
          </FormControl>
          <div className={`mt-2 ${productionHelperTextClassName}`}>Recalculate BOM and required quantities.</div>
          <div className="mt-3 inline-flex items-start gap-2 rounded-2xl border border-[#facc15] bg-[#fff8dc] px-3 py-2 text-sm text-[#c56a00]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Recalculate BOM and required quantities.</span>
          </div>
          {bomMultiplierError ? <FormMessage>{bomMultiplierError}</FormMessage> : null}
        </FormItem>
      </div>
    </div>
  </ProductionSectionCard>
);

export default MaterialsSummaryPanel;
