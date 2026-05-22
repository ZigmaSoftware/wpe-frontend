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
            "rounded-2xl border px-4 py-4 text-left transition-colors",
            active
              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
          )}
        >
          <div className="text-sm font-semibold">{shift.label}</div>
          <div className={cn("mt-1 text-sm", active ? "text-sky-50" : "text-slate-500")}>{shift.timeRange}</div>
        </button>
      );
    })}
  </div>
);

export default ProductionShiftSelector;
