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
import { packingTypeSchema, type PackingTypeFormValues } from "@/features/production-masters/schemas";

const defaultValues: PackingTypeFormValues = {
  code: "",
  name: "",
  description: "",
  standard_pcs: 0,
  standard_weight: 0,
  uom: "NOS",
  is_active: true,
};

const PackingTypePage = () => (
  <CodeMasterPage
    title="Packing Type"
    description="Define packing types, standard pieces, and standard weight."
    queryKey="production-packing-types"
    api={productionMastersApi.packingTypes}
    schema={packingTypeSchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      description: record.description ?? "",
      standard_pcs: record.standard_pcs,
      standard_weight: Number(record.standard_weight),
      uom: record.uom,
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      description: values.description,
      standard_pcs: values.standard_pcs,
      standard_weight: values.standard_weight,
      uom: values.uom,
      is_active: values.is_active,
    })}
    codeLabel="Packing Type Code*"
    nameLabel="Packing Type Name*"
    namePlaceholder="Enter packing type name"
    descriptionLabel="Details"
    createLabel="Add Packing Type"
    createButtonLabel="Create Packing Type"
    allowDelete={false}
    extraColumns={[
      { key: "standard_pcs", title: "Standard PCS", render: (record) => record.standard_pcs },
      { key: "standard_weight", title: "Standard Weight", render: (record) => record.standard_weight },
      { key: "uom", title: "UOM", render: (record) => <ProductionEnumBadge value={record.uom} label={record.uom === "NOS" ? "Nos" : "KG"} /> },
    ]}
    renderExtras={({ form }) => (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="standard_pcs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standard PCS*</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="1" value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  <SelectItem value="NOS">Nos</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
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

export default PackingTypePage;
