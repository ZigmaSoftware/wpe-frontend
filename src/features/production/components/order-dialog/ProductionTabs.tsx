import { memo } from "react";
import { Boxes, Coins, FileText, Layers3, Package, RefreshCcw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTION_ORDER_TABS, type ProductionDialogTab } from "./productionOrderForm";

type ProductionTabsProps = {
  value: ProductionDialogTab;
  onValueChange: (value: ProductionDialogTab) => void;
  tabs?: ReadonlyArray<(typeof PRODUCTION_ORDER_TABS)[number]>;
  className?: string;
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

const ProductionTabs = ({
  value,
  onValueChange,
  tabs = PRODUCTION_ORDER_TABS,
  className,
}: ProductionTabsProps) => (
  <nav aria-label="Production sections" className={cn("flex flex-col gap-1", className)}>
    {tabs.map((tab) => {
      const Icon = tabIcons[tab.value];
      const active = value === tab.value;

      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onValueChange(tab.value)}
          aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex w-full items-center gap-3 overflow-hidden rounded-[16px] px-3.5 py-3 text-left transition-all",
              active
                ? "bg-[#fff4eb] text-[#f97316] shadow-[0_16px_28px_-24px_rgba(249,115,22,0.4)]"
                : "text-slate-600 hover:bg-[#e7ecf1] hover:text-slate-900",
            )}
          >
          <span
            className={cn(
              "absolute inset-y-2 left-0 w-1 rounded-r-full transition-colors",
              active ? "bg-[#f97316]" : "bg-transparent group-hover:bg-slate-200",
            )}
          />
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
              active
                ? "border-[#ffd7bf] bg-white text-[#f97316]"
                : "border-[#e5e7eb] bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-700",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-[-0.01em]">{tab.label}</span>
            <span className={cn("block text-[10px] uppercase tracking-[0.12em]", active ? "text-[#fb923c]" : "text-slate-500")}>Section</span>
          </span>
        </button>
      );
    })}
  </nav>
);

export default memo(ProductionTabs);
