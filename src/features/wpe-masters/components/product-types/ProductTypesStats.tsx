import { Box, Layers, PackageSearch, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ProductTypesStatsProps = {
  isLoading?: boolean;
  summary: {
    categories: number;
    activeCategories: number;
    subtypes: number;
    activeSubtypes: number;
  };
};

const statItems = [
  {
    key: "categories",
    label: "Total Categories",
    hint: "Governed parent classifications",
    icon: Layers,
  },
  {
    key: "subtypes",
    label: "Total Subtypes",
    hint: "Reusable child mappings",
    icon: Box,
  },
  {
    key: "activeCategories",
    label: "Active Categories",
    hint: "Available to downstream users",
    icon: Tag,
  },
  {
    key: "activeSubtypes",
    label: "Active Subtypes",
    hint: "Live selections across modules",
    icon: PackageSearch,
  },
] as const;

const ProductTypesStats = ({ isLoading = false, summary }: ProductTypesStatsProps) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    {statItems.map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.key}
          className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-slate-950">
                  {summary[item.key]}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {isLoading ? <Skeleton className="h-4 w-36 rounded-lg" /> : item.hint}
          </div>
        </div>
      );
    })}
  </div>
);

export default ProductTypesStats;
