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
  <div className="-m-4 min-h-full bg-[#e7ecf1] px-4 py-4 lg:-m-6 lg:px-6 lg:py-5">
    <div className="flex min-h-full w-full flex-col gap-4">
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          className="h-auto rounded-none px-0 text-sm font-semibold text-slate-500 hover:bg-transparent hover:text-[#f97316]"
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
