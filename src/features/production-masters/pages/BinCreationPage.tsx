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
import { binCreationSchema, type BinCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: BinCreationFormValues = {
  code: "",
  name: "",
  description: "",
  department: 0,
  capacity: 0,
  capacity_uom: "KG",
  current_status: "",
  current_material: "",
  is_active: true,
};

const BinCreationPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Bin Creation"
      description="Manage bins used for production material handling."
      queryKey="production-bin-creations"
      api={productionMastersApi.binCreations}
      schema={binCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        department: record.department,
        capacity: Number(record.capacity),
        capacity_uom: record.capacity_uom,
        current_status: record.current_status ?? "",
        current_material: record.current_material ?? "",
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        department: values.department,
        capacity: values.capacity,
        capacity_uom: values.capacity_uom,
        current_status: values.current_status || "",
        current_material: values.current_material,
        is_active: values.is_active,
      })}
      codeLabel="Bin Code*"
      nameLabel="Bin Name*"
      namePlaceholder="Enter bin name"
      showDescription={false}
      createLabel="Add Bin"
      createButtonLabel="Create Bin"
      allowDelete={false}
      renderNameSecondary={(record) => record.department_name}
      extraColumns={[
        {
          key: "capacity",
          title: "Capacity",
          render: (record) => `${record.capacity} ${record.capacity_uom === "NOS" ? "Nos" : "KG"}`,
        },
        {
          key: "current_status",
          title: "Current Status",
          render: (record) => <ProductionEnumBadge value={record.current_status} />,
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
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
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
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
                <FormLabel>Capacity UOM*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="NOS">Nos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="current_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="HOLD">Hold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="current_material"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Current Material</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter current material" />
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

export default BinCreationPage;
