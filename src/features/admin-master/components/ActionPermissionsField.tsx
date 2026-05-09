import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const actions = ["add", "update", "list", "delete", "view", "print"] as const;

export const ActionPermissionsField = ({
  value,
  onChange,
}: {
  value: Record<string, boolean | undefined>;
  onChange: (next: Record<string, boolean>) => void;
}) => (
  <FormItem>
    <FormLabel>Action Permissions</FormLabel>
    <FormControl>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <label key={action} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <Checkbox
              checked={Boolean(value[action])}
              onCheckedChange={(checked) => onChange({ ...value, [action]: Boolean(checked) })}
            />
            <span className="capitalize">{action}</span>
          </label>
        ))}
      </div>
    </FormControl>
    <FormMessage />
  </FormItem>
);
