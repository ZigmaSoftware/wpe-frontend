import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LookupOption } from "@/features/admin-master/types";

export const DepartmentField = ({
  value,
  onChange,
  options,
  label = "Department",
}: {
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  options: LookupOption[];
  label?: string;
}) => {
  if (!options.length) {
    return (
      <FormItem>
        <FormLabel>{label} ID</FormLabel>
        <FormControl>
          <Input
            type="number"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
            placeholder="Enter department id"
          />
        </FormControl>
        <div className="text-xs text-muted-foreground">Department lookup is not exposed by the backend yet. Manual ID entry is enabled.</div>
        <FormMessage />
      </FormItem>
    );
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select value={value ? String(value) : "none"} onValueChange={(next) => onChange(next === "none" ? null : Number(next))}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="none">No department</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
};
