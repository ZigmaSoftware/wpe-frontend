import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  productionCardBaseClassName,
  productionCardContentClassName,
  productionCardHeaderClassName,
} from "./productionOrderFormStyles";

type ProductionSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "amber" | "blue" | "violet" | "slate" | "gold" | "emerald";
  icon?: LucideIcon;
};

const toneClasses = {
  amber: {
    accent: "before:bg-[#ff6b00]",
    iconWrap: "bg-[#fff3e8]",
    icon: "text-[#ff6b00]",
  },
  blue: {
    accent: "before:bg-[#2d6cdf]",
    iconWrap: "bg-[#eef4ff]",
    icon: "text-[#2d6cdf]",
  },
  violet: {
    accent: "before:bg-[#8b5cf6]",
    iconWrap: "bg-[#f4efff]",
    icon: "text-[#8b5cf6]",
  },
  slate: {
    accent: "before:bg-[#94a3b8]",
    iconWrap: "bg-slate-100",
    icon: "text-slate-500",
  },
  gold: {
    accent: "before:bg-[#f2b200]",
    iconWrap: "bg-[#fff8e1]",
    icon: "text-[#c98a00]",
  },
  emerald: {
    accent: "before:bg-[#10b981]",
    iconWrap: "bg-[#eafaf4]",
    icon: "text-[#059669]",
  },
} as const;

const ProductionSectionCard = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  tone = "slate",
  icon: Icon,
}: ProductionSectionCardProps) => (
  <Card
    className={cn(
      productionCardBaseClassName,
      "before:absolute before:left-0 before:top-3 before:h-9 before:w-[3px] before:rounded-full",
      toneClasses[tone].accent,
      className,
    )}
  >
    <CardHeader className={productionCardHeaderClassName}>
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? (
          <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", toneClasses[tone].iconWrap)}>
            <Icon className={cn("h-3.5 w-3.5", toneClasses[tone].icon)} />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-800">{title}</div>
          {description ? <p className="text-[12px] leading-5 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </CardHeader>
    <CardTitle className="sr-only">{title}</CardTitle>
    <CardContent className={cn(productionCardContentClassName, contentClassName)}>{children}</CardContent>
  </Card>
);

export default ProductionSectionCard;
