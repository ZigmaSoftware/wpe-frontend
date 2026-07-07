import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardActivityItem } from "@/components/dashboard/types";
import { cn } from "@/lib/utils";

type RecentActivityCardProps = {
  items: DashboardActivityItem[];
  viewAllTo: string;
};

const toneClassName = (tone: DashboardActivityItem["tone"]) => {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    case "danger":
      return "bg-rose-50 text-rose-700";
    case "info":
      return "bg-blue-50 text-blue-700";
    case "purple":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const RecentActivityCard = ({ items, viewAllTo }: RecentActivityCardProps) => (
  <section className="rounded-[24px] border border-[#e5eaf1] bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.18)]">
    <div className="px-5 py-4">
      <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-[#121926]">Recent Activity</h2>
    </div>

    <div className="space-y-4 px-5 pb-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", toneClassName(item.tone))}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#162033]">{item.title}</p>
                <p className="mt-1 text-xs text-[#7f8a9b]">{item.meta}</p>
              </div>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", toneClassName(item.tone))}>
              {item.status}
            </span>
          </div>
        );
      })}
    </div>

    <div className="border-t border-[#edf1f6] px-5 py-4">
      <Link to={viewAllTo} className="inline-flex items-center gap-1 text-sm font-semibold text-[#ea580c] transition-colors hover:text-[#c2410c]">
        View all activities
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

export default RecentActivityCard;
