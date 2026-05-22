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
    <div className="rounded-2xl border border-slate-200 bg-white">
      <ScrollArea className="w-full">
        <div className="min-w-[1420px]">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead>Sl.</TableHead>
                <TableHead>Item #</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>1U Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>BOM</TableHead>
                <TableHead>Required Qty</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Rem. Qty</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
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
