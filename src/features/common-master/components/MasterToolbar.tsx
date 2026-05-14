import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MasterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  createLabel: string;
  onCreate: () => void;
  filters?: React.ReactNode;
};

const MasterToolbar = ({
  search,
  onSearchChange,
  createLabel,
  onCreate,
  filters,
}: MasterToolbarProps) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search records..."
          className="h-10 pl-9"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {filters}
        <Button onClick={onCreate} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      </div>
    </div>
  </div>
);

export default MasterToolbar;
