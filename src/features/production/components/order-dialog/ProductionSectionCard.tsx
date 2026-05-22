import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProductionSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const ProductionSectionCard = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ProductionSectionCardProps) => (
  <Card className={cn("rounded-2xl border-slate-200/90 bg-white shadow-sm", className)}>
    <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div className="space-y-1">
        <div className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
          {title}
        </div>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </CardHeader>
    <CardTitle className="sr-only">{title}</CardTitle>
    <CardContent className={cn("px-5 py-5", contentClassName)}>{children}</CardContent>
  </Card>
);

export default ProductionSectionCard;
