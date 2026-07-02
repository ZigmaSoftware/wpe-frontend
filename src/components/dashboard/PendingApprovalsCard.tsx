import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type PendingApprovalsCardProps = {
  items: Array<{
    id: string;
    label: string;
    count: number | null;
    to: string;
    unavailable?: boolean;
  }>;
};

const PendingApprovalsCard = ({ items }: PendingApprovalsCardProps) => (
  <section className="rounded-[24px] border border-[#e5eaf1] bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.18)]">
    <div className="px-5 py-4">
      <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-[#121926]">Pending Approvals / Tasks</h2>
    </div>

    <div className="px-5 pb-4">
      <div className="overflow-hidden rounded-[18px] border border-[#e7ecf3]">
        {items.length ? (
          items.map((item, index) => (
            <Link
              key={item.id}
              to={item.to}
              className="relative flex items-center justify-between gap-3 px-4 py-4 text-sm transition-colors hover:bg-[#fafbfc]"
            >
              <span className="font-medium text-[#1f2937]">{item.label}</span>
              <span className="ml-auto text-base font-semibold text-[#111827]">
                {item.unavailable ? "--" : item.count?.toLocaleString("en-IN") ?? "--"}
              </span>
              <ChevronRight className="h-4 w-4 text-[#9aa6b2]" />
              {index < items.length - 1 ? <span className="absolute inset-x-4 bottom-0 h-px bg-[#edf1f6]" aria-hidden="true" /> : null}
            </Link>
          ))
        ) : (
          <div className="px-4 py-8 text-sm text-[#8a95a5]">No approval queues are available for this user.</div>
        )}
      </div>
    </div>

    <div className="border-t border-[#edf1f6] px-5 py-4">
      <Link to={items[0]?.to ?? "/app/requests"} className="inline-flex items-center gap-1 text-sm font-semibold text-[#ea580c] transition-colors hover:text-[#c2410c]">
        View all approvals
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

export default PendingApprovalsCard;
