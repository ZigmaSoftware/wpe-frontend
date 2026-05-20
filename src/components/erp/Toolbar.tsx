import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Toolbar = ({
  search,
  onSearchChange,
  createLabel,
  onCreate,
  filters,
  actions,
  searchPlaceholder = "Search records...",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  createLabel: string;
  onCreate: () => void;
  filters?: ReactNode;
  actions?: ReactNode;
  searchPlaceholder?: string;
}) => (
  <div className="rounded-3xl border border-border/70 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-9"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {filters}
        {actions}
        <Button onClick={onCreate} className="h-11 rounded-2xl px-4">
          <Plus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      </div>
    </div>
  </div>
);

export default Toolbar;
