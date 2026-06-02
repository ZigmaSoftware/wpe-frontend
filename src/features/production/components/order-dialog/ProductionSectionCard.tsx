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
    iconWrap: "bg-[#fff4eb] text-[#ff6b00]",
    icon: "text-[#ff6b00]",
  },
  blue: {
    iconWrap: "bg-[#eef4ff] text-[#2d6cdf]",
    icon: "text-[#2d6cdf]",
  },
  violet: {
    iconWrap: "bg-[#f4efff] text-[#8b5cf6]",
    icon: "text-[#8b5cf6]",
  },
  slate: {
    iconWrap: "bg-slate-100 text-slate-500",
    icon: "text-slate-500",
  },
  gold: {
    iconWrap: "bg-[#fff8e1] text-[#c98a00]",
    icon: "text-[#c98a00]",
  },
  emerald: {
    iconWrap: "bg-[#eafaf4] text-[#059669]",
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
      className,
    )}
  >
    <CardHeader className={productionCardHeaderClassName}>
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon ? (
          <div
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
              toneClasses[tone].iconWrap,
            )}
          >
            <Icon className={cn("h-5 w-5", toneClasses[tone].icon)} />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <div className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">{title}</div>
          {description ? <p className="text-[13px] leading-5 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </CardHeader>
    <CardTitle className="sr-only">{title}</CardTitle>
    <CardContent className={cn(productionCardContentClassName, contentClassName)}>{children}</CardContent>
  </Card>
);

export default ProductionSectionCard;
