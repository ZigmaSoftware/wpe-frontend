import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DraftBOMComponent } from "@/features/production/components/bom-variants/types";

type ComponentRowProps = {
  component: DraftBOMComponent;
  index: number;
  hasInvalidQuantity: boolean;
  onQuantityChange: (clientId: string, value: string) => void;
  onUnitChange: (clientId: string, value: string) => void;
  onRemove: (clientId: string) => void;
};

const ComponentRow = ({
  component,
  index,
  hasInvalidQuantity,
  onQuantityChange,
  onUnitChange,
  onRemove,
}: ComponentRowProps) => (
  <TableRow>
    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
    <TableCell>
      <div className="space-y-1">
        <div className="font-medium">{component.item_name}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{component.item_code}</span>
          {component.source_type === "ITEM" ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Legacy item
            </Badge>
          ) : null}
        </div>
      </div>
    </TableCell>
    <TableCell>{component.category || "—"}</TableCell>
    <TableCell>
      <Input
        type="number"
        min="0"
        step="0.001"
        value={component.target_weight_grams}
        onChange={(event) => onQuantityChange(component.client_id, event.target.value)}
        className={cn("h-9 min-w-28", hasInvalidQuantity && "border-destructive focus-visible:ring-destructive")}
      />
    </TableCell>
    <TableCell>
      <Input
        value={component.unit}
        onChange={(event) => onUnitChange(component.client_id, event.target.value)}
        className="h-9 min-w-20"
      />
    </TableCell>
    <TableCell>
      <Badge
        variant="outline"
        className={cn(
          component.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
        )}
      >
        {component.is_active ? "Active" : "Inactive"}
      </Badge>
    </TableCell>
    <TableCell className="text-right">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-red-500 hover:bg-red-50 hover:text-red-700"
        onClick={() => onRemove(component.client_id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </TableCell>
  </TableRow>
);

export default ComponentRow;
