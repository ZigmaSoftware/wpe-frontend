import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MaterialComponentRow from "./MaterialComponentRow";
import MaterialsEmptyState from "./MaterialsEmptyState";
import type { ProductionMaterialComputedRow, ProductionOrderFormValues } from "./productionOrderForm";

type MaterialComponentsTableProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  rows: ProductionMaterialComputedRow[];
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
    <div className="overflow-hidden rounded-[22px] border border-slate-200/90 bg-white">
      <ScrollArea className="w-full">
        <div className="min-w-[1420px]">
          <Table>
            <TableHeader className="bg-[#f8fbff]">
              <TableRow className="hover:bg-[#f8fbff]">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sl.</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Item #</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Item Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">1U Qty</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Unit</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">BOM</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Required Qty</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Received</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Running</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Requested</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rate</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Material Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <MaterialComponentRow key={row.client_id} index={index} row={row} form={form} remove={remove} />
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default MaterialComponentsTable;
