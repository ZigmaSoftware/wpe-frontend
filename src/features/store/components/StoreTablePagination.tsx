import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type StoreTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

const StoreTablePagination = ({ page, pageSize, total, onPageChange }: StoreTablePaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {start} - {end} of {total}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[88px] text-center text-sm font-medium">
          Page {safePage} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StoreTablePagination;
