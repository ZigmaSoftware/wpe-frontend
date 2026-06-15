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
            "min-h-[76px] rounded-[16px] border px-4 py-3 text-left transition-all",
            active
              ? "border-[#6ea0ff] bg-[#f8fbff] text-[#1d4ed8] shadow-[0_18px_32px_-28px_rgba(45,108,223,0.55)]"
              : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-[#3b82f6]" : "border-slate-300",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", active ? "bg-[#3b82f6]" : "bg-transparent")} />
            </span>
            <span className="min-w-0">
              <div className="text-[13px] font-semibold">{shift.label}</div>
              <div className={cn("mt-1 text-[13px]", active ? "text-[#5f7fb8]" : "text-slate-400")}>{shift.timeRange}</div>
            </span>
          </div>
        </button>
      );
    })}
  </div>
);

export default ProductionShiftSelector;
