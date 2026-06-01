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
import { bagCreationSchema, type BagCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: BagCreationFormValues = {
  code: "",
  name: "",
  description: "",
  standard_weight: 0,
  uom: "KG",
  department: 0,
  current_status: "FREE",
  is_active: true,
};

const BagCreationPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Bag Creation"
      description="Manage production bags and standard weight configurations."
      queryKey="production-bag-creations"
      api={productionMastersApi.bagCreations}
      schema={bagCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        standard_weight: Number(record.standard_weight),
        uom: record.uom,
        department: record.department,
        current_status: record.current_status,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        standard_weight: values.standard_weight,
        uom: values.uom,
        department: values.department,
        current_status: values.current_status,
        is_active: values.is_active,
      })}
      codeLabel="Bag Code*"
      nameLabel="Bag Name*"
      namePlaceholder="Enter bag name"
      showDescription={false}
      createLabel="Add Bag"
      createButtonLabel="Create Bag"
      allowDelete={false}
      renderNameSecondary={(record) => record.department_name}
      extraColumns={[
        { key: "standard_weight", title: "Standard Weight", render: (record) => `${record.standard_weight} KG` },
        { key: "current_status", title: "Current Status", render: (record) => <ProductionEnumBadge value={record.current_status} /> },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="standard_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Weight*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UOM*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="current_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
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

export default BagCreationPage;
