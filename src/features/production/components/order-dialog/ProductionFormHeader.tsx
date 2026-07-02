import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductionFormHeaderProps = {
  title: string;
  subtitle: string;
  activeSectionLabel?: string;
  showSectionNavigation?: boolean;
  onOpenNavigation?: () => void;
  productionId: string;
  productionIdStatus: "Pending" | "Generated" | "Saved";
  onRegenerateId?: () => void;
  isRegeneratingId?: boolean;
  isCreateMode?: boolean;
};

const statusClassNames: Record<ProductionFormHeaderProps["productionIdStatus"], string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Generated: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Saved: "border-[#ffd7bf] bg-[#fff4eb] text-[#f97316]",
};

const ProductionFormHeader = ({
  title,
  subtitle,
  activeSectionLabel,
  showSectionNavigation = false,
  onOpenNavigation,
  productionId,
  productionIdStatus,
  onRegenerateId,
  isRegeneratingId = false,
  isCreateMode = false,
}: ProductionFormHeaderProps) => (
  <div className="rounded-[24px] border border-[#d8e0e8] bg-[#edf1f4] shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)]">
    <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {showSectionNavigation ? (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e7e9ee] bg-white text-slate-500 transition-colors hover:border-[#f97316]/30 hover:text-[#f97316] lg:hidden"
            aria-label="Open production sections"
            onClick={onOpenNavigation}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        ) : null}

        <div className="min-w-0">
          {showSectionNavigation && activeSectionLabel ? (
            <div className="mb-2 inline-flex items-center rounded-full border border-[#ffd7bf] bg-[#fff4eb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f97316]">
              {activeSectionLabel}
            </div>
          ) : null}
          <h1 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="w-full lg:max-w-[260px]">
        <div className="rounded-[18px] border border-[#d8e0e8] bg-[#e7ecf1] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Production ID
              </div>
              <div className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
                {productionId.trim() || "Pending"}
              </div>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                statusClassNames[productionIdStatus],
              )}
            >
              {productionIdStatus}
            </span>
          </div>

          {isCreateMode && onRegenerateId ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 h-8 rounded-lg border border-[#e7e9ee] bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-[#fff4eb] hover:text-[#f97316]"
              onClick={onRegenerateId}
            >
              <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isRegeneratingId && "animate-spin")} />
              Regenerate ID
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  </div>
);

export default ProductionFormHeader;
