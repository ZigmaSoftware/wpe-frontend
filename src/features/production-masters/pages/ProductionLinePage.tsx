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
import ProductionEnumBadge from "@/features/production-masters/components/ProductionEnumBadge";
import { productionLineSchema, type ProductionLineFormValues } from "@/features/production-masters/schemas";

const defaultValues: ProductionLineFormValues = {
  code: "",
  name: "",
  description: "",
  department: null,
  machine: null,
  line_capacity: undefined,
  capacity_uom: "",
  status: "FREE",
  is_active: true,
};

const capacityUomLabel = (value: string) =>
  ({
    KG: "KG",
    HOUR: "Hour",
    KG_PER_HOUR: "KG / Hour",
  })[value] ?? value;

const ProductionLinePage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });
  const machineQuery = useQuery({
    queryKey: ["production-masters", "machine-creations", "lookup"],
    queryFn: productionMastersApi.machineCreations.lookup,
  });

  return (
    <CodeMasterPage
      title="Production Line"
      description="Configure production lines, machines, capacities, and running status."
      queryKey="production-lines"
      api={productionMastersApi.productionLines}
      schema={productionLineSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        department: record.department,
        machine: record.machine,
        line_capacity: record.line_capacity ? Number(record.line_capacity) : undefined,
        capacity_uom: record.capacity_uom ?? "",
        status: record.status,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        department: values.department || null,
        machine: values.machine || null,
        line_capacity: values.line_capacity ?? null,
        capacity_uom: values.capacity_uom,
        status: values.status,
        is_active: values.is_active,
      })}
      codeLabel="Line Code*"
      nameLabel="Line Name*"
      namePlaceholder="Enter line name"
      showDescription={false}
      createLabel="Add Production Line"
      createButtonLabel="Create Line"
      allowDelete={false}
      renderNameSecondary={(record) => record.department_name || "No department linked"}
      extraColumns={[
        {
          key: "machine",
          title: "Machine",
          render: (record) => record.machine_name ? `${record.machine_name}${record.machine_code ? ` (${record.machine_code})` : ""}` : "-",
        },
        {
          key: "capacity",
          title: "Line Capacity",
          render: (record) => record.line_capacity ? `${record.line_capacity} ${capacityUomLabel(record.capacity_uom)}` : "-",
        },
        { key: "status", title: "Status", render: (record) => <ProductionEnumBadge value={record.status} /> },
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
            name="machine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Machine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(machineQuery.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.name}
                        {option.code ? ` (${option.code})` : ""}
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
            name="line_capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Line Capacity</FormLabel>
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
          <FormField
            control={form.control}
            name="capacity_uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity UOM</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="HOUR">Hour</SelectItem>
                    <SelectItem value="KG_PER_HOUR">KG / Hour</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="RUNNING">Running</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    />
  );
};

export default ProductionLinePage;

