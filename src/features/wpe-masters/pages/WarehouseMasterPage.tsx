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
  warehouseMasterSchema,
  type WarehouseMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const defaultValues: WarehouseMasterFormValues = {
  code: "",
  name: "",
  description: "",
  warehouse_type: "RM",
  is_active: true,
};

const WarehouseMasterPage = () => (
  <CodeMasterPage
    title="Warehouse"
    description="Manage warehouses by type for inventory and store operations."
    queryKey="warehouses"
    api={wpeMastersApi.warehouses}
    schema={warehouseMasterSchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      description: record.description ?? "",
      warehouse_type: record.warehouse_type,
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      description: values.description,
      warehouse_type: values.warehouse_type,
      is_active: values.is_active,
    })}
    codeLabel="Warehouse Code*"
    nameLabel="Warehouse Name*"
    namePlaceholder="Enter warehouse name"
    showDescription={false}
    renderNameSecondary={(record) => `Type: ${record.warehouse_type === "SCRAP" ? "Scrap" : record.warehouse_type}`}
    extraColumns={[
      {
        key: "warehouse_type",
        title: "Warehouse Type",
        render: (record) => record.warehouse_type === "SCRAP" ? "Scrap" : record.warehouse_type,
      },
    ]}
    createLabel="Add Warehouse"
    createButtonLabel="Create Warehouse"
    renderExtras={({ form }) => (
      <FormField
        control={form.control}
        name="warehouse_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Warehouse Type*</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse Type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="FG">FG</SelectItem>
                <SelectItem value="RM">RM</SelectItem>
                <SelectItem value="SCRAP">Scrap</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  />
);

export default WarehouseMasterPage;
