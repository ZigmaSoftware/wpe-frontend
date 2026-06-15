import { memo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type StorePageSizeValue = "10" | "20" | "50" | "100" | "all";
export type StoreExportFormat = "csv" | "excel" | "pdf" | "print";

type StoreTableToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterContent?: ReactNode;
  pageSize: StorePageSizeValue;
  onPageSizeChange: (value: StorePageSizeValue) => void;
  pageSizeOptions?: StorePageSizeValue[];
  onExport: (format: StoreExportFormat) => void;
  summaryText: string;
  isFetching?: boolean;
};

const StoreTableToolbar = ({
  searchValue,
  onSearchChange,
  filterContent,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = ["10", "20", "50", "100", "all"],
  onExport,
  summaryText,
  isFetching = false,
}: StoreTableToolbarProps) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = Boolean(filterContent);

  return (
  <div className="space-y-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{summaryText}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="🔍 Search"
          className="h-9 w-full min-w-0 text-sm sm:w-[240px]"
        />
        {hasFilter ? (
          <Button
            type="button"
            variant="outline"
            className={cn("h-9 px-3 text-sm", filterOpen ? "border-slate-300 bg-slate-50" : "")}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((current) => !current)}
          >
            ⚙ Filter
          </Button>
        ) : null}
      </div>
    </div>

    {hasFilter && filterOpen ? (
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          filterOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-border bg-slate-50/70 p-3">
            {filterContent}
          </div>
        </div>
      </div>
    ) : null}

    <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">{isFetching ? "Refreshing table data..." : "Table controls"}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Page size</span>
          <Select value={pageSize} onValueChange={(value) => onPageSizeChange(value as StorePageSizeValue)}>
            <SelectTrigger className="h-8 w-[110px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-8 px-3 text-sm">
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onExport("csv")}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("excel")}>Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("pdf")}>PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("print")}>Print</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
  );
};

export default memo(StoreTableToolbar);
