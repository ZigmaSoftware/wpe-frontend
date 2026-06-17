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
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import {
  roleMasterSchema,
  type RoleMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const ROLE_SCREEN_CODE = "role-master";

const defaultValues: RoleMasterFormValues = {
  code: "",
  name: "",
  description: "",
  designation: 0,
  is_active: true,
};

const RoleMasterPage = () => {
  const designationQuery = useQuery({
    queryKey: ["wpe-masters", "designations", "lookup"],
    queryFn: wpeMastersApi.designations.lookup,
  });

  const columnConfigQuery = useQuery({
    queryKey: ["admin-master", "user-screens", "table-columns", ROLE_SCREEN_CODE],
    queryFn: () => adminMasterApi.fetchTableColumns(ROLE_SCREEN_CODE),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <CodeMasterPage
      title="Role"
      description="Manage roles mapped to designations and downstream user setup."
      queryKey="roles"
      api={wpeMastersApi.roles}
      schema={roleMasterSchema}
      defaultValues={defaultValues}
      columnConfig={columnConfigQuery.data}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        designation: record.designation ?? 0,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        designation: values.designation,
        is_active: values.is_active,
      })}
      codeLabel="Role Code*"
      nameLabel="Role Name*"
      namePlaceholder="Enter role name"
      descriptionLabel="Role Details"
      createLabel="Add Role"
      createButtonLabel="Create Role"
      renderNameSecondary={(record) =>
        record.designation_name ? `Designation: ${record.designation_name}` : "No designation linked"
      }
      extraColumns={[
        {
          key: "designation",
          title: "Designation",
          render: (record) => record.designation_name || "-",
        },
      ]}
      renderExtras={({ form }) => (
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designation*</FormLabel>
              <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(designationQuery.data ?? []).map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
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

export default RoleMasterPage;
