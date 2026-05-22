import { Skeleton } from "@/components/ui/skeleton";

type ProductTypesTableSkeletonProps = {
  templateColumns: string;
  rows?: number;
};

const ProductTypesTableSkeleton = ({
  templateColumns,
  rows = 5,
}: ProductTypesTableSkeletonProps) => (
  <div className="px-5 pb-5 pt-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b bg-slate-50/80 px-4 py-3">
        <div
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: templateColumns }}
        >
          {Array.from({ length: templateColumns.split(" ").length }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4">
            <div
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: templateColumns }}
            >
              <Skeleton className="h-4 w-8 rounded-md" />
              {Array.from({ length: templateColumns.split(" ").length - 1 }).map((__, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  className={`h-4 rounded-md ${columnIndex === 0 ? "w-4/5" : "w-full"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-40 rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

export default ProductTypesTableSkeleton;
