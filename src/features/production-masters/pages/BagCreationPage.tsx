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
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import ProductionEnumBadge from "@/features/production-masters/components/ProductionEnumBadge";
import { bagCreationSchema, type BagCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: BagCreationFormValues = {
  code: "",
  name: "",
  description: "",
  standard_weight: undefined,
  uom: "KG",
  department: null,
  current_status: "FREE",
  is_active: true,
};

const BagCreationPage = () => {
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
        standard_weight: record.standard_weight === null ? undefined : Number(record.standard_weight),
        uom: record.uom,
        department: record.department,
        current_status: record.current_status,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        standard_weight: values.standard_weight ?? null,
        uom: values.uom,
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
      extraColumns={[
        { key: "standard_weight", title: "Standard Weight", render: (record) => (record.standard_weight ? `${record.standard_weight} KG` : "-") },
        { key: "current_status", title: "Current Status", render: (record) => <ProductionEnumBadge value={record.current_status} /> },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="standard_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Weight</FormLabel>
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
                <FormLabel>UOM</FormLabel>
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
            name="current_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
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
