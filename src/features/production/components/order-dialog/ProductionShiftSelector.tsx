import { cn } from "@/lib/utils";
import { SHIFT_OPTIONS, type ProductionShiftValue } from "./productionOrderForm";

type ProductionShiftSelectorProps = {
  value: ProductionShiftValue;
  onChange: (value: ProductionShiftValue) => void;
};

const ProductionShiftSelector = ({ value, onChange }: ProductionShiftSelectorProps) => (
  <div className="grid gap-3 md:grid-cols-3">
    {SHIFT_OPTIONS.map((shift) => {
      const active = shift.value === value;

      return (
        <button
          key={shift.value}
          type="button"
          onClick={() => onChange(shift.value)}
          className={cn(
            "min-h-[72px] rounded-[14px] border px-4 py-3 text-left transition-all",
            active
              ? "border-[#fdba74] bg-[#fff7ed] text-[#ea580c] shadow-[0_14px_24px_-18px_rgba(249,115,22,0.35)]"
              : "border-[#e5e7eb] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-[#f97316]" : "border-slate-300",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", active ? "bg-[#f97316]" : "bg-transparent")} />
            </span>
            <span className="min-w-0">
              <div className="text-[13px] font-semibold">{shift.label}</div>
              <div className={cn("mt-1 text-[12px]", active ? "text-[#f97316]" : "text-slate-400")}>{shift.timeRange}</div>
            </span>
          </div>
        </button>
      );
    })}
  </div>
);

export default ProductionShiftSelector;
