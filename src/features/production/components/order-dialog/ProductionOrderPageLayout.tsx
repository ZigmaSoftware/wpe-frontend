import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProductionOrderPageLayoutProps = {
  children: ReactNode;
  onBack: () => void;
  backLabel?: string;
};

const ProductionOrderPageLayout = ({
  children,
  onBack,
  backLabel = "Back to Production",
}: ProductionOrderPageLayoutProps) => (
  <div className="-m-4 min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(244,248,252,0.98)_28%,_rgba(239,244,250,1)_100%)] px-4 py-3 lg:-m-6 lg:px-6 lg:py-4">
    <div className="flex min-h-full w-full flex-col gap-4">
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          className="h-auto rounded-none px-0 text-sm font-semibold text-slate-600 hover:bg-transparent hover:text-slate-950"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      </div>

      <div className="w-full">{children}</div>
    </div>
  </div>
);

export default ProductionOrderPageLayout;
