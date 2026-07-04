import type { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getDashboardPeriodLabel, getFooterToneClassName } from "@/components/dashboard/dashboardData";
import type { DashboardFooterStat, DashboardPeriod } from "@/components/dashboard/types";

type DashboardChartCardProps = {
  title: string;
  period: DashboardPeriod;
  onPeriodChange?: (period: DashboardPeriod) => void;
  children: ReactNode;
  footerStats?: DashboardFooterStat[];
  className?: string;
  unavailable?: boolean;
};

const PERIOD_OPTIONS: DashboardPeriod[] = ["this-month", "this-week", "today"];

const DashboardChartCard = ({
  title,
  period,
  onPeriodChange,
  children,
  footerStats,
  className,
  unavailable = false,
}: DashboardChartCardProps) => (
  <section
    className={cn(
      "rounded-[24px] border border-[#e5eaf1] bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.18)]",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] px-5 py-4">
      <div className="space-y-1">
        <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-[#121926]">{title}</h2>
        {unavailable ? <p className="text-xs font-medium text-[#9aa6b2]">Source unavailable</p> : null}
      </div>
      <Select value={period} onValueChange={(value) => onPeriodChange?.(value as DashboardPeriod)}>
        <SelectTrigger className="h-10 w-[136px] rounded-xl border-[#e5eaf1] bg-white text-sm font-medium text-[#243041] shadow-none">
          <SelectValue>{getDashboardPeriodLabel(period)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {getDashboardPeriodLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="px-5 py-5">{children}</div>

    {footerStats?.length ? (
      <div className="grid gap-4 border-t border-[#edf1f6] px-5 py-4 sm:grid-cols-3">
        {footerStats.map((item) => (
          <div key={item.id} className="space-y-1">
            <p className="text-xs font-medium text-[#8a95a5]">{item.label}</p>
            <p className={cn("font-display text-[1.1rem] font-semibold tracking-[-0.02em]", getFooterToneClassName(item.tone))}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    ) : null}
  </section>
);

export default DashboardChartCard;
