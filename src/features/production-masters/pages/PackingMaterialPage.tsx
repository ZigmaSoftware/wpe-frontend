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
import { packingMaterialSchema, type PackingMaterialFormValues } from "@/features/production-masters/schemas";

const defaultValues: PackingMaterialFormValues = {
  code: "",
  name: "",
  description: "",
  item: 0,
  uom: "KG",
  standard_consumption: undefined,
  is_active: true,
};

const PackingMaterialPage = () => {
  const itemQuery = useQuery({
    queryKey: ["wpe-masters", "item-creations", "lookup"],
    queryFn: () => wpeMastersApi.itemCreations.lookup(),
  });

  return (
    <CodeMasterPage
      title="Packing Material"
      description="Configure packing materials and standard consumption."
      queryKey="production-packing-materials"
      api={productionMastersApi.packingMaterials}
      schema={packingMaterialSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        item: record.item,
        uom: record.uom,
        standard_consumption: record.standard_consumption ? Number(record.standard_consumption) : undefined,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        item: values.item,
        uom: values.uom,
        standard_consumption: values.standard_consumption ?? null,
        is_active: values.is_active,
      })}
      codeLabel="Packing Material Code*"
      nameLabel="Packing Material Name*"
      namePlaceholder="Enter packing material name"
      showDescription={false}
      createLabel="Add Packing Material"
      createButtonLabel="Create Packing Material"
      allowDelete={false}
      renderNameSecondary={(record) => `${record.item_name} (${record.item_code})`}
      extraColumns={[
        { key: "uom", title: "UOM", render: (record) => <ProductionEnumBadge value={record.uom} label={record.uom === "NOS" ? "Nos" : "KG"} /> },
        { key: "consumption", title: "Standard Consumption", render: (record) => record.standard_consumption ?? "-" },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="item"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(itemQuery.data ?? []).map((option) => (
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
                    <SelectItem value="NOS">Nos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="standard_consumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Consumption</FormLabel>
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

export default PackingMaterialPage;
