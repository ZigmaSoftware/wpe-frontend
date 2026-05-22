import type { ControllerRenderProps } from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  formatNumberInputValue,
  type ProductionItemOption,
  type ProductionOrderFormValues,
} from "./productionOrderForm";

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
  <ProductionSectionCard title="Materials" description="BOM-driven materials planning for the selected manufacture item.">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_220px]">
      <div className="rounded-2xl bg-slate-50 px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Manufacture Item</div>
        <div className="mt-2 text-lg font-semibold text-slate-950">{finishedGoods?.item_name ?? "No finished goods selected"}</div>
        <div className="mt-1 text-sm text-slate-500">
          {finishedGoods ? `${finishedGoods.item_code}${finishedGoods.unit ? ` · ${finishedGoods.unit}` : ""}` : "Select Finished Goods in General tab."}
        </div>
        <div className="mt-1 text-xs text-slate-500">Batch: Auto on create</div>
      </div>

      <div className="rounded-2xl bg-slate-50 px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Production Qty</div>
        <div className="mt-2 text-lg font-semibold text-slate-950">{formatNumberInputValue(productionQty, 3, 3)}</div>
        <div className="mt-1 text-sm text-slate-500">Mapped from General tab plan total.</div>
      </div>

      <FormItem>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <FormLabel className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">BOM Multiplier</FormLabel>
          <FormControl>
            <Input
              {...bomMultiplierField}
              inputMode="decimal"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white text-lg font-semibold"
            />
          </FormControl>
          <div className="mt-1 text-sm text-slate-500">Recalculates BOM and required quantities.</div>
        </div>
        {bomMultiplierError ? <FormMessage>{bomMultiplierError}</FormMessage> : null}
      </FormItem>
    </div>
  </ProductionSectionCard>
);

export default MaterialsSummaryPanel;
