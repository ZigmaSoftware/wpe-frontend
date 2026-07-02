import { Link } from "react-router-dom";
import type { DashboardQuickAction } from "@/components/dashboard/types";
import { cn } from "@/lib/utils";

type QuickActionsCardProps = {
  actions: DashboardQuickAction[];
};

const toneClassName = (tone: DashboardQuickAction["tone"]) => {
  switch (tone) {
    case "green":
      return "bg-emerald-50 text-emerald-700";
    case "blue":
      return "bg-blue-50 text-blue-700";
    case "purple":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-orange-50 text-orange-700";
  }
};

const QuickActionsCard = ({ actions }: QuickActionsCardProps) => (
  <section className="rounded-[24px] border border-[#e5eaf1] bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.18)]">
    <div className="px-5 py-4">
      <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-[#121926]">Quick Actions</h2>
    </div>

    {actions.length ? (
      <div className="grid grid-cols-2 gap-4 px-5 pb-5 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              to={action.to}
              className="group flex min-h-[106px] flex-col items-center justify-center gap-3 rounded-[18px] border border-[#e7ecf3] bg-white px-3 py-4 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-[#f2c6b1] hover:bg-[#fffaf7] hover:shadow-[0_12px_32px_-20px_rgba(234,88,12,0.35)]"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-150 group-hover:scale-105", toneClassName(action.tone))}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-[#182132]">{action.label}</span>
            </Link>
          );
        })}
      </div>
    ) : (
      <div className="px-5 pb-5 text-sm text-[#8a95a5]">No quick actions are available for the current permission set.</div>
    )}
  </section>
);

export default QuickActionsCard;
