import { Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const RowActions = ({
  onView,
  onEdit,
  onToggle,
  onDelete,
  isActive,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  isActive?: boolean;
}) => (
  <div className="flex justify-end gap-2">
    {onView ? (
      <Button variant="outline" size="icon" onClick={onView}>
        <Eye className="h-4 w-4" />
      </Button>
    ) : null}
    {onEdit ? (
      <Button variant="outline" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    ) : null}
    {onToggle ? (
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        title={isActive === undefined ? "Toggle status" : isActive ? "Deactivate" : "Activate"}
        className={isActive === true ? "text-destructive hover:text-destructive" : isActive === false ? "text-green-600 hover:text-green-600" : ""}
      >
        {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
      </Button>
    ) : null}
    {onDelete ? (
      <Button variant="outline" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    ) : null}
  </div>
);

export default RowActions;
