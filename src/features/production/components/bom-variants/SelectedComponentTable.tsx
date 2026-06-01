import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ComponentRow from "@/features/production/components/bom-variants/ComponentRow";
import type { DraftBOMComponent } from "@/features/production/components/bom-variants/types";

type SelectedComponentTableProps = {
  components: DraftBOMComponent[];
  invalidComponentIds: Set<string>;
  onStandardWeightChange: (clientId: string, value: string) => void;
  onMinimumWeightChange: (clientId: string, value: string) => void;
  onMaximumWeightChange: (clientId: string, value: string) => void;
  onToggleActive: (clientId: string, value: boolean) => void;
  onRemove: (clientId: string) => void;
};

const SelectedComponentTable = ({
  components,
  invalidComponentIds,
  onStandardWeightChange,
  onMinimumWeightChange,
  onMaximumWeightChange,
  onToggleActive,
  onRemove,
}: SelectedComponentTableProps) => (
  <div className="rounded-md border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Add Items</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-36">Standard Weight</TableHead>
          <TableHead className="w-36">Minimum Weight</TableHead>
          <TableHead className="w-36">Maximum Weight</TableHead>
          <TableHead className="w-28">Active Status</TableHead>
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
            onStandardWeightChange={onStandardWeightChange}
            onMinimumWeightChange={onMinimumWeightChange}
            onMaximumWeightChange={onMaximumWeightChange}
            onToggleActive={onToggleActive}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

export default SelectedComponentTable;
