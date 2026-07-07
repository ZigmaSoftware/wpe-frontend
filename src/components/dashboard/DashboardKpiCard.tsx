import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { getKpiToneStyles } from "@/components/dashboard/dashboardData";
import type { DashboardKpiCardData } from "@/components/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardKpiCardProps = {
  item: DashboardKpiCardData;
};

const DashboardKpiCardContent = ({ item }: DashboardKpiCardProps) => {
  const tone = getKpiToneStyles(item.tone);
  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-[22px] border border-[#e7ecf3] bg-white px-5 py-4 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#7f8a9b]">{item.label}</div>
          <div className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-[#111827]">
            {item.value === null ? "--" : item.value.toLocaleString("en-IN")}
          </div>
          <div
            className={cn(
              "text-sm font-semibold",
              item.unavailable
                ? "text-[#9aa6b2]"
                : item.trendDirection === "down"
                  ? "text-[#ef4444]"
                  : item.trendDirection === "up"
                    ? "text-[#16a34a]"
                    : "text-[#64748b]",
            )}
          >
            {item.unavailable ? "Source unavailable" : item.trendLabel}
          </div>
        </div>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
          style={{ backgroundColor: tone.accent, color: tone.line }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={item.sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone.line} stopOpacity={0.2} />
                <stop offset="100%" stopColor={tone.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={tone.line}
              fill={`url(#spark-${item.id})`}
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DashboardKpiCard = ({ item }: DashboardKpiCardProps) =>
  item.href ? (
    <Link to={item.href} className="block transition-transform duration-150 hover:-translate-y-0.5">
      <DashboardKpiCardContent item={item} />
    </Link>
  ) : (
    <DashboardKpiCardContent item={item} />
  );

export default DashboardKpiCard;
