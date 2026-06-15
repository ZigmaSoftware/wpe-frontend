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
  designationMasterSchema,
  type DesignationMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const defaultValues: DesignationMasterFormValues = {
  code: "",
  name: "",
  description: "",
  department: 0,
  is_active: true,
};

const DesignationMasterPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Desigination"
      description="Manage desigination records mapped to departments for staff setup."
      queryKey="designations"
      api={wpeMastersApi.designations}
      schema={designationMasterSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        department: record.department,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        department: values.department,
        is_active: values.is_active,
      })}
      codeLabel="Desigination Code*"
      nameLabel="Desigination Name*"
      namePlaceholder="Enter desigination name"
      descriptionLabel="Details"
      createLabel="Add Desigination"
      createButtonLabel="Create Desigination"
      renderNameSecondary={(record) => record.department_name}
      extraColumns={[
        {
          key: "department",
          title: "Department",
          render: (record) => record.department_name,
        },
      ]}
      renderExtras={({ form }) => (
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department*</FormLabel>
              <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(departmentQuery.data ?? []).map((option) => (
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

export default DesignationMasterPage;
