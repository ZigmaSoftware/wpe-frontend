import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PRODUCTION_ORDER_TABS, type ProductionDialogTab } from "./productionOrderForm";

type ProductionTabsProps = {
  value: ProductionDialogTab;
  onValueChange: (value: ProductionDialogTab) => void;
};

const ProductionTabs = ({ value, onValueChange }: ProductionTabsProps) => (
  <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-slate-100/80 p-2">
    {PRODUCTION_ORDER_TABS.map((tab) => (
      <TabsTrigger
        key={tab.value}
        value={tab.value}
        onClick={() => onValueChange(tab.value)}
        className={cn(
          "min-w-[112px] rounded-xl border border-transparent px-4 py-2.5 text-sm text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-950",
          value === tab.value && "shadow-sm",
        )}
      >
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
);

export default ProductionTabs;
