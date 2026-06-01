import { cn } from "@/lib/utils";
import { SHIFT_OPTIONS, type ProductionShiftValue } from "./productionOrderForm";

type ProductionShiftSelectorProps = {
  value: ProductionShiftValue;
  onChange: (value: ProductionShiftValue) => void;
};

const ProductionShiftSelector = ({ value, onChange }: ProductionShiftSelectorProps) => (
  <div className="grid gap-2 md:grid-cols-3">
    {SHIFT_OPTIONS.map((shift) => {
      const active = shift.value === value;

      return (
        <button
          key={shift.value}
          type="button"
          onClick={() => onChange(shift.value)}
          className={cn(
            "min-h-[72px] rounded-[14px] border px-3 py-2.5 text-left transition-colors",
            active
              ? "border-[#2d6cdf] bg-[#2d6cdf] text-white shadow-[0_14px_30px_-20px_rgba(45,108,223,0.95)]"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <div className="text-[13px] font-semibold">{shift.label}</div>
          <div className={cn("mt-1 text-[13px]", active ? "text-sky-50" : "text-slate-400")}>{shift.timeRange}</div>
        </button>
      );
    })}
  </div>
);

export default ProductionShiftSelector;
