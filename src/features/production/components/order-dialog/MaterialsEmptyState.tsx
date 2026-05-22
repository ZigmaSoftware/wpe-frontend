import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type MaterialsEmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

const MaterialsEmptyState = ({ title, description, className }: MaterialsEmptyStateProps) => (
  <div className={cn("rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center", className)}>
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
      <PackageSearch className="h-5 w-5" />
    </div>
    <div className="mt-4 text-base font-semibold text-slate-900">{title}</div>
    <div className="mt-1 text-sm text-slate-500">{description}</div>
  </div>
);

export default MaterialsEmptyState;
