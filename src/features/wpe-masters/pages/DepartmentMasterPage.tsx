import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import {
  departmentMasterSchema,
  type DepartmentMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const defaultValues: DepartmentMasterFormValues = {
  code: "",
  name: "",
  description: "",
  department_head: null,
  is_active: true,
};

const DepartmentMasterPage = () => {
  const departmentHeadQuery = useQuery({
    queryKey: ["wpe-masters", "users", "lookup"],
    queryFn: wpeMastersApi.users.lookup,
  });

  return (
    <CodeMasterPage
      title="Department"
      description="Manage departments, department heads, and administrative ownership."
      queryKey="departments"
      api={wpeMastersApi.departments}
      schema={departmentMasterSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        department_head: record.department_head,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        department_head: values.department_head || null,
        is_active: values.is_active,
      })}
      codeLabel="Department Code*"
      nameLabel="Department Name*"
      namePlaceholder="Enter department name"
      descriptionLabel="Details"
      createLabel="Add Department"
      createButtonLabel="Create Department"
      renderNameSecondary={(record) => record.department_head_name ? `Head: ${record.department_head_name}` : "No department head assigned"}
      extraColumns={[
        {
          key: "department_head",
          title: "Department Head",
          render: (record) => record.department_head_name || "-",
        },
      ]}
      renderExtras={({ form }) => (
        <FormField
          control={form.control}
          name="department_head"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Head</FormLabel>
              <Select
                value={field.value ? String(field.value) : "none"}
                onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department Head" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(departmentHeadQuery.data ?? []).map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
                      {option.username ? ` (${option.username})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    />
  );
};

export default DepartmentMasterPage;
