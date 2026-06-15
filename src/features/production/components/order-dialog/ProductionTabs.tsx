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
            "group relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-4 py-3 text-left transition-all",
            active
              ? "bg-[#eef4ff] text-[#1d4ed8] shadow-[0_18px_30px_-26px_rgba(37,99,235,0.55)]"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <span
            className={cn(
              "absolute inset-y-2 left-0 w-1 rounded-r-full transition-colors",
              active ? "bg-[#2563eb]" : "bg-transparent group-hover:bg-slate-200",
            )}
          />
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
              active
                ? "border-[#bfdbfe] bg-white text-[#2563eb]"
                : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-700",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold tracking-[-0.01em]">{tab.label}</span>
            <span className={cn("block text-[11px]", active ? "text-[#3b82f6]" : "text-slate-400")}>Section</span>
          </span>
        </button>
      );
    })}
  </nav>
);

export default memo(ProductionTabs);
