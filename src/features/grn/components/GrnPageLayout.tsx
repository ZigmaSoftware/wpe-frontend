import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type GrnPageLayoutProps = {
  children: ReactNode;
  onBack: () => void;
  backLabel?: string;
};

const GrnPageLayout = ({
  children,
  onBack,
  backLabel = "Back to GRN",
}: GrnPageLayoutProps) => (
  <div className="-m-4 min-h-full bg-[#eef3f8] px-3 py-3 lg:-m-6 lg:px-4 lg:py-4">
    <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-3">
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-full px-2.5 text-sm font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      </div>

      <div className="h-[calc(100vh-8.5rem)] min-h-[640px]">{children}</div>
    </div>
  </div>
);

export default GrnPageLayout;
