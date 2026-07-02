import { cn } from "@/lib/utils";
import ProductionTabs from "./ProductionTabs";
import { PRODUCTION_ORDER_TABS, type ProductionDialogTab } from "./productionOrderForm";

type ProductionSectionSidebarProps = {
  value: ProductionDialogTab;
  onValueChange: (value: ProductionDialogTab) => void;
  tabs?: ReadonlyArray<(typeof PRODUCTION_ORDER_TABS)[number]>;
  className?: string;
  compact?: boolean;
};

const ProductionSectionSidebar = ({
  value,
  onValueChange,
  tabs = PRODUCTION_ORDER_TABS,
  className,
  compact = false,
}: ProductionSectionSidebarProps) => (
  <div
    className={cn(
      "flex h-full flex-col overflow-hidden rounded-[22px] border border-[#d8e0e8] bg-[#edf1f4] shadow-[0_18px_42px_-34px_rgba(15,23,42,0.14)]",
      compact && "shadow-none",
      className,
    )}
  >
    {!compact ? (
      <div className="border-b border-[#dde4ec] px-4 py-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
          Sections
        </div>
        <p className="mt-1 text-[12px] leading-5 text-slate-600">
          Navigate the centralized production form from here.
        </p>
      </div>
    ) : null}
    <div className="flex-1 p-3">
      <ProductionTabs value={value} onValueChange={onValueChange} tabs={tabs} />
    </div>
  </div>
);

export default ProductionSectionSidebar;
