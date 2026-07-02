import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductionFormSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
};

const ProductionFormSection = ({
  title,
  description,
  action,
  icon: Icon,
  children,
  className,
  contentClassName,
  headerClassName,
}: ProductionFormSectionProps) => (
  <section
    className={cn(
      "overflow-hidden rounded-[22px] border border-[#d8e0e8] bg-[#edf1f4] shadow-[0_16px_36px_-30px_rgba(15,23,42,0.16)]",
      className,
    )}
  >
    {title || description || action || Icon ? (
      <div className={cn("flex items-start justify-between gap-4 border-b border-[#dde4ec] px-5 py-4", headerClassName)}>
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff4eb] text-[#f97316]">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            {title ? (
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#f97316]">
                {title}
              </div>
            ) : null}
            {description ? (
              <p className="mt-1 text-[12px] leading-5 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    ) : null}
    <div className={cn("px-5 py-5", contentClassName)}>{children}</div>
  </section>
);

export default ProductionFormSection;
