import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ComponentRow from "@/features/production/components/bom-variants/ComponentRow";
import type { DraftBOMComponent } from "@/features/production/components/bom-variants/types";

type SelectedComponentTableProps = {
  components: DraftBOMComponent[];
  invalidComponentIds: Set<string>;
  onQuantityChange: (clientId: string, value: string) => void;
  onUnitChange: (clientId: string, value: string) => void;
  onRemove: (clientId: string) => void;
};

const SelectedComponentTable = ({
  components,
  invalidComponentIds,
  onQuantityChange,
  onUnitChange,
  onRemove,
}: SelectedComponentTableProps) => (
  <div className="rounded-md border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Product / Subcategory</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-36">Quantity</TableHead>
          <TableHead className="w-24">Unit</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead className="w-16 text-right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {components.map((component, index) => (
          <ComponentRow
            key={component.client_id}
            component={component}
            index={index}
            hasInvalidQuantity={invalidComponentIds.has(component.client_id)}
            onQuantityChange={onQuantityChange}
            onUnitChange={onUnitChange}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

export default SelectedComponentTable;
