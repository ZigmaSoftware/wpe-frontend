import { Skeleton } from "@/components/ui/skeleton";

const InventorySummarySkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border px-4 py-3">
      <div className="grid grid-cols-[minmax(220px,2.2fr)_minmax(120px,1fr)_minmax(100px,0.8fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(180px,1.3fr)] gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(220px,2.2fr)_minmax(120px,1fr)_minmax(100px,0.8fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(180px,1.3fr)] gap-3 border-b border-border/70 px-4 py-4 last:border-b-0"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  </div>
);

export default InventorySummarySkeleton;
