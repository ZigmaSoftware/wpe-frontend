import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { colorCreationSchema, type ColorCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: ColorCreationFormValues = {
  code: "",
  name: "",
  description: "",
  color_group: "",
  is_active: true,
};

const ColorCreationsPage = () => (
  <CodeMasterPage
    title="Color Creations"
    description="Manage production colors and color groups."
    queryKey="production-color-creations"
    api={productionMastersApi.colorCreations}
    schema={colorCreationSchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      description: record.description ?? "",
      color_group: record.color_group ?? "",
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      description: values.description,
      color_group: values.color_group,
      is_active: values.is_active,
    })}
    codeLabel="Color Code*"
    nameLabel="Color Name*"
    namePlaceholder="Enter color name"
    showDescription={false}
    createLabel="Add Color Creation"
    createButtonLabel="Create Color"
    allowDelete={false}
    extraColumns={[
      {
        key: "color_group",
        title: "Color Group",
        render: (record) => <ProductionEnumBadge value={record.color_group} />,
      },
    ]}
    renderExtras={({ form }) => (
      <FormField
        control={form.control}
        name="color_group"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color Group</FormLabel>
            <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Color Group" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="DARK">Dark</SelectItem>
                <SelectItem value="LIGHT">Light</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  />
);

export default ColorCreationsPage;
