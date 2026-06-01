import { ArrowLeft, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/QueryState";
import TablePagination from "@/components/TablePagination";
import { formatDateTime } from "@/lib/api-helpers";
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
  ProductTypeSubtypeRecord,
  ProductTypeTreeCategoryRecord,
} from "@/features/wpe-masters/types";

type SelectedCategory = ProductTypeCategoryRecord | ProductTypeTreeCategoryRecord;

type ProductSubtypePanelProps = {
  selectedCategory: SelectedCategory;
  activeSubtypeCount: number;
  records: ProductTypeSubtypeRecord[];
  isLoading: boolean;
  isError: boolean;
  errorDescription: string;
  search: string;
  onSearchChange: (value: string) => void;
  status: ProductTypeStatusFilterValue;
  onStatusChange: (value: ProductTypeStatusFilterValue) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onCreateSubtype: () => void;
  onEditCategory?: (record: ProductTypeCategoryRecord) => void;
  onToggleCategory?: (record: ProductTypeCategoryRecord) => void;
  onDeleteCategory?: (record: ProductTypeCategoryRecord) => void;
  onEditSubtype?: (record: ProductTypeSubtypeRecord) => void;
  onToggleSubtype?: (record: ProductTypeSubtypeRecord) => void;
  onDeleteSubtype?: (record: ProductTypeSubtypeRecord) => void;
  onBackToCategories: () => void;
  canAdd: boolean;
};

const tableTemplate = "64px minmax(0,1.8fr) minmax(0,1.1fr) 120px 170px 120px";

const ProductSubtypePanel = ({
  selectedCategory,
  activeSubtypeCount,
  records,
  isLoading,
  isError,
  errorDescription,
  search,
  onSearchChange,
  status,
  onStatusChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onCreateSubtype,
  onEditCategory,
  onToggleCategory,
  onDeleteCategory,
  onEditSubtype,
  onToggleSubtype,
  onDeleteSubtype,
  onBackToCategories,
  canAdd,
}: ProductSubtypePanelProps) => {
  const hasFilters = Boolean(search.trim()) || status !== "all";

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                Active item sub category workspace
              </Badge>
              <MasterStatusBadge active={selectedCategory.is_active} />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {selectedCategory.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {selectedCategory.description || "Maintain the reusable subtype set mapped under this category."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                Code: {selectedCategory.code}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                {selectedCategory.subtype_count} total item sub categories
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                {activeSubtypeCount} active
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                Updated {formatDateTime(selectedCategory.updated_at)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={onBackToCategories}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Item Categories
            </Button>
            {onEditCategory ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => onEditCategory(selectedCategory)}
              >
                <Pencil className="h-4 w-4" />
                Edit Item Category
              </Button>
            ) : null}
            {onToggleCategory ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => onToggleCategory(selectedCategory)}
              >
                <Power className="h-4 w-4" />
                Toggle Status
              </Button>
            ) : null}
            {onDeleteCategory ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDeleteCategory(selectedCategory)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
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
              placeholder={`Search item sub categories in ${selectedCategory.name}`}
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
              <Button onClick={onCreateSubtype} className="h-11 rounded-xl px-4">
                <Plus className="h-4 w-4" />
                Add Item Sub Category
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {isLoading ? (
        <ProductTypesTableSkeleton templateColumns={tableTemplate} rows={5} />
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
            title={hasFilters ? "No item sub categories match your filters" : "No item sub categories created yet"}
            description={
              hasFilters
                ? "Refine the search or status filter to find matching item sub categories."
                : `Create the first item sub category under ${selectedCategory.name} to complete this hierarchy.`
            }
            action={
              canAdd && !hasFilters ? (
                <Button onClick={onCreateSubtype}>
                  <Plus className="h-4 w-4" />
                  Add First Item Sub Category
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto px-5 pb-5 pt-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table className="min-w-[760px]">
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Item Sub Category</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={record.id} className="transition-colors hover:bg-slate-50">
                    <TableCell className="text-center text-sm font-medium text-slate-500">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-600" />
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
                    <TableCell>
                      <MasterStatusBadge active={record.is_active} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDateTime(record.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductTypeRowActions
                        onEdit={onEditSubtype ? () => onEditSubtype(record) : undefined}
                        onToggle={onToggleSubtype ? () => onToggleSubtype(record) : undefined}
                        onDelete={onDeleteSubtype ? () => onDeleteSubtype(record) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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
      )}
    </section>
  );
};

export default ProductSubtypePanel;
