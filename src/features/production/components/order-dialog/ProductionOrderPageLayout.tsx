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
  <div className="-m-4 min-h-full bg-[#eef3f8] px-3 py-2 lg:-m-6 lg:px-4 lg:py-3">
    <div className="flex min-h-full w-full flex-col gap-2">
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          className="h-8 rounded-full px-2.5 text-sm font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900"
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
