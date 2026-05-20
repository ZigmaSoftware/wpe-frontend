import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PanelSize } from "@/components/erp/types";
import { cn } from "@/lib/utils";

const widthBySize: Record<PanelSize, string> = {
  sm: "sm:max-w-2xl",
  md: "sm:max-w-4xl",
  lg: "sm:max-w-6xl",
  xl: "sm:max-w-7xl",
};

const FormPanel = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  footer,
  bodyClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: PanelSize;
  footer?: ReactNode;
  bodyClassName?: string;
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      className={cn(
        "w-full overflow-hidden border-l border-border/70 bg-background p-0",
        widthBySize[size],
      )}
    >
      <div className="flex h-full flex-col">
        <SheetHeader className="border-b border-border/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-6 py-5 text-left">
          <SheetTitle className="text-2xl font-semibold tracking-tight">{title}</SheetTitle>
          {description ? <SheetDescription className="max-w-3xl text-sm leading-6">{description}</SheetDescription> : null}
        </SheetHeader>
        <div className={cn("flex-1 overflow-y-auto px-6 py-5", bodyClassName)}>{children}</div>
        {footer ? <div className="border-t border-border/70 bg-white px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">{footer}</div> : null}
      </div>
    </SheetContent>
  </Sheet>
);

export default FormPanel;
