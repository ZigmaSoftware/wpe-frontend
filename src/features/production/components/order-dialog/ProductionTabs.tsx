import { Boxes, Coins, FileText, Layers3, Package, RefreshCcw, Users } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PRODUCTION_ORDER_TABS, type ProductionDialogTab } from "./productionOrderForm";

type ProductionTabsProps = {
  value: ProductionDialogTab;
  onValueChange: (value: ProductionDialogTab) => void;
};

const tabIcons = {
  general: FileText,
  materials: Boxes,
  stages: Layers3,
  output: Package,
  scrap: RefreshCcw,
  cost: Coins,
  resources: Users,
} as const;

const ProductionTabs = ({ value, onValueChange }: ProductionTabsProps) => (
  <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-none bg-transparent p-0">
    {PRODUCTION_ORDER_TABS.map((tab) => {
      const Icon = tabIcons[tab.value];

      return (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "relative min-w-fit rounded-none border-b-2 border-transparent px-2.5 py-2 text-[12px] font-semibold text-slate-500 shadow-none transition-colors hover:text-slate-800 data-[state=active]:border-[#ff6b00] data-[state=active]:bg-transparent data-[state=active]:text-[#ff6b00] data-[state=active]:shadow-none",
            value === tab.value && "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[#ff6b00]",
          )}
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Icon className="h-3.25 w-3.25" />
            {tab.label}
          </span>
        </TabsTrigger>
      );
    })}
  </TabsList>
);

export default ProductionTabs;
