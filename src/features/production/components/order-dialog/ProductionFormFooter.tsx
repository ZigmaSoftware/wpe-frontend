import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProductionFormFooterProps = {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
};

const ProductionFormFooter = ({
  onCancel,
  isSubmitting = false,
  submitLabel,
}: ProductionFormFooterProps) => (
  <div className="sticky bottom-0 z-20 border-t border-[#d8e0e8] bg-[#e7ecf1]/95 py-4 backdrop-blur">
    <div className="rounded-[20px] border border-[#d8e0e8] bg-[#edf1f4] px-4 py-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.14)] sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-[#e5e7eb] bg-white px-5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 rounded-xl bg-[#f97316] px-5 text-[14px] font-semibold text-white shadow-[0_16px_28px_-18px_rgba(249,115,22,0.7)] hover:bg-[#ea580c]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {`${submitLabel}...`}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  </div>
);

export default ProductionFormFooter;
