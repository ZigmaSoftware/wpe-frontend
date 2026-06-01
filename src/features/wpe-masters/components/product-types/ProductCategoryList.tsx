import { Plus, Search } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/QueryState";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import ProductTypeRowActions from "@/features/wpe-masters/components/product-types/ProductTypeRowActions";
import ProductTypesTableSkeleton from "@/features/wpe-masters/components/product-types/ProductTypesTableSkeleton";
import type {
  ProductTypeCategoryRecord,
  ProductTypeStatusFilterValue,
} from "@/features/wpe-masters/types";
import { cn } from "@/lib/utils";

type ProductCategoryListProps = {
  records: ProductTypeCategoryRecord[];
  isLoading: boolean;
  isError: boolean;
  errorDescription: string;
  emptyDescription?: string;
  emptyTitle?: string;
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  status: ProductTypeStatusFilterValue;
  onStatusChange: (value: ProductTypeStatusFilterValue) => void;
  onSelectCategory: (record: ProductTypeCategoryRecord) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onCreateCategory: () => void;
  onEditCategory?: (record: ProductTypeCategoryRecord) => void;
  onToggleCategory?: (record: ProductTypeCategoryRecord) => void;
  onDeleteCategory?: (record: ProductTypeCategoryRecord) => void;
  panelDescription?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  typeLabel?: string;
  canAdd: boolean;
  createLabel?: string;
};

const tableTemplate = "64px minmax(0,1.8fr) minmax(0,1.1fr) 120px 120px 120px";

const ProductCategoryList = ({
  records,
  isLoading,
  isError,
  errorDescription,
  emptyDescription,
  emptyTitle,
  search,
  searchPlaceholder,
  onSearchChange,
  status,
  onStatusChange,
  onSelectCategory,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onCreateCategory,
  onEditCategory,
  onToggleCategory,
  onDeleteCategory,
  panelDescription,
  panelEyebrow,
  panelTitle,
  typeLabel = "Category",
  canAdd,
  createLabel = "Add Item Category",
}: ProductCategoryListProps) => {
  const hasFilters = Boolean(search.trim()) || status !== "all";

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {panelEyebrow ?? "Item Category"}
            </p>
            <div className="text-lg font-semibold text-slate-950">{panelTitle ?? "Item Categories"}</div>
            <p className="text-sm text-slate-500">
              {panelDescription ?? "Click an item category to open its dedicated item sub category workspace."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              {total} visible
            </Badge>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? "Search item categories by name or code"}
              className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm shadow-slate-100"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={status}
              onValueChange={(value) => onStatusChange(value as ProductTypeStatusFilterValue)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm shadow-slate-100 sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
            {canAdd ? (
              <Button onClick={onCreateCategory} className="h-11 rounded-xl px-4">
                <Plus className="h-4 w-4" />
                {createLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {isLoading ? (
        <ProductTypesTableSkeleton templateColumns={tableTemplate} rows={6} />
      ) : isError ? (
        <div className="p-5">
          <ErrorState
            description={errorDescription}
            action={
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        </div>
      ) : !records.length ? (
        <div className="p-5">
          <EmptyState
            title={hasFilters ? `No ${typeLabel.toLowerCase()} records match your filters` : emptyTitle ?? `No ${typeLabel.toLowerCase()} records found`}
            description={
              hasFilters
                ? `Adjust the ${typeLabel.toLowerCase()} search or status filter to reveal more records.`
                : emptyDescription ?? "Create the first item category to start governing the hierarchy."
            }
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto px-5 pb-5 pt-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table className="min-w-[760px]">
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>{typeLabel}</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Item Sub Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => {
                    return (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer transition-all duration-200 hover:bg-slate-50"
                        onClick={() => onSelectCategory(record)}
                      >
                        <TableCell className="text-center text-sm font-medium text-slate-500">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-2 h-2.5 w-2.5 rounded-full transition-colors",
                                record.is_active ? "bg-emerald-500" : "bg-slate-300",
                              )}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900">{record.name}</div>
                              <div className="line-clamp-1 text-xs text-slate-500">
                                {record.description || "No description provided"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">
                            {record.code}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {record.subtype_count}
                        </TableCell>
                        <TableCell>
                          <MasterStatusBadge active={record.is_active} />
                        </TableCell>
                        <TableCell className="text-right">
                          <ProductTypeRowActions
                            onEdit={onEditCategory ? () => onEditCategory(record) : undefined}
                            onToggle={onToggleCategory ? () => onToggleCategory(record) : undefined}
                            onDelete={onDeleteCategory ? () => onDeleteCategory(record) : undefined}
                            isActive={record.is_active}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ProductCategoryList;
