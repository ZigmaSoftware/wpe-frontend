import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MaterialComponentRow from "./MaterialComponentRow";
import MaterialsEmptyState from "./MaterialsEmptyState";
import type { ProductionMaterialComputedRow, ProductionOrderFormValues } from "./productionOrderForm";

type MaterialComponentsTableProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  rows: Array<{
    fieldIndex: number;
    row: ProductionMaterialComputedRow;
  }>;
  emptyState: {
    title: string;
    description: string;
  } | null;
};

const MaterialComponentsTable = ({ form, rows, emptyState }: MaterialComponentsTableProps) => {
  const { remove } = useFieldArray({
    control: form.control,
    name: "materials.rows",
  });

  if (emptyState) {
    return <MaterialsEmptyState title={emptyState.title} description={emptyState.description} />;
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_18px_42px_-38px_rgba(15,23,42,0.3)]">
      <ScrollArea className="w-full">
        <div className="min-w-[920px]">
          <Table>
            <TableHeader className="bg-[#f8fbff]">
              <TableRow className="hover:bg-[#f8fbff]">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Material Code</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Material Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">1U Qty</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Required Qty</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Unit</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ fieldIndex, row }) => (
                <MaterialComponentRow key={row.client_id} index={fieldIndex} row={row} form={form} onRemove={remove} />
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3 text-sm text-slate-500">
        <span>
          Showing 1 to {rows.length} of {rows.length} item{rows.length === 1 ? "" : "s"}
        </span>
        <span>{rows.length} rows</span>
      </div>
    </div>
  );
};

export default MaterialComponentsTable;
