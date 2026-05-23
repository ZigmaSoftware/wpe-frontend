import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type MaterialsEmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

const MaterialsEmptyState = ({ title, description, className }: MaterialsEmptyStateProps) => (
  <div className={cn("rounded-[22px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center", className)}>
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <PackageSearch className="h-5 w-5" />
    </div>
    <div className="mt-4 text-base font-semibold text-slate-800">{title}</div>
    <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>
  </div>
);

export default MaterialsEmptyState;
