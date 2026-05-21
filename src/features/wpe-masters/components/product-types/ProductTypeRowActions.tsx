import type { MouseEvent } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductTypeRowActionsProps = {
  onEdit?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  className?: string;
};

const ProductTypeRowActions = ({
  onEdit,
  onToggle,
  onDelete,
  className,
}: ProductTypeRowActionsProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>, action?: () => void) => {
    event.stopPropagation();
    action?.();
  };

  if (!onEdit && !onToggle && !onDelete) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={(event) => handleClick(event, onEdit)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : null}
      {onToggle ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={(event) => handleClick(event, onToggle)}
          title="Toggle status"
        >
          <Power className="h-4 w-4" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
          onClick={(event) => handleClick(event, onDelete)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ProductTypeRowActions;
