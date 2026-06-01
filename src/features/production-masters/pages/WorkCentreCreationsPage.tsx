import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import { workCentreCreationSchema, type WorkCentreCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: WorkCentreCreationFormValues = {
  code: "",
  name: "",
  description: "",
  department: null,
  capacity: undefined,
  is_active: true,
};

const WorkCentreCreationsPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Work Centre Creations"
      description="Manage production work centres by department and capacity."
      queryKey="production-work-centre-creations"
      api={productionMastersApi.workCentreCreations}
      schema={workCentreCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        department: record.department,
        capacity: record.capacity ? Number(record.capacity) : undefined,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        department: values.department || null,
        capacity: values.capacity ?? null,
        is_active: values.is_active,
      })}
      codeLabel="Work Centre Code*"
      nameLabel="Work Centre Name*"
      namePlaceholder="Enter work centre name"
      showDescription={false}
      createLabel="Add Work Centre"
      createButtonLabel="Create Work Centre"
      allowDelete={false}
      renderNameSecondary={(record) => record.department_name || "No department linked"}
      extraColumns={[
        {
          key: "capacity",
          title: "Capacity",
          render: (record) => record.capacity ?? "-",
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    />
  );
};

export default WorkCentreCreationsPage;
