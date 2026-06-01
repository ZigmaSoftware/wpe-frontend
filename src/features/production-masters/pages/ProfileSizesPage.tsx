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
import { profileSizeSchema, type ProfileSizeFormValues } from "@/features/production-masters/schemas";

const defaultValues: ProfileSizeFormValues = {
  code: "",
  name: "",
  width: 0,
  thickness: 0,
  length: 0,
  uom: "MM",
  description: "",
  is_active: true,
};

const ProfileSizesPage = () => (
  <CodeMasterPage
    title="Profile Size"
    description="Manage profile dimensions such as width, thickness, length, and UOM."
    queryKey="production-profile-sizes"
    api={productionMastersApi.profileSizes}
    schema={profileSizeSchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      width: Number(record.width),
      thickness: Number(record.thickness),
      length: Number(record.length),
      uom: record.uom,
      description: record.description ?? "",
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      width: values.width,
      thickness: values.thickness,
      length: values.length,
      uom: values.uom,
      description: values.description,
      is_active: values.is_active,
    })}
    codeLabel="Size Code*"
    nameLabel="Size Name*"
    namePlaceholder="Enter profile size name"
    descriptionLabel="Details"
    createLabel="Add Profile Size"
    createButtonLabel="Create Profile Size"
    allowDelete={false}
    extraColumns={[
      { key: "width", title: "Width", render: (record) => record.width },
      { key: "thickness", title: "Thickness", render: (record) => record.thickness },
      { key: "length", title: "Length", render: (record) => record.length },
      {
        key: "uom",
        title: "UOM",
        render: (record) => <ProductionEnumBadge value={record.uom} label={record.uom === "METER" ? "Meter" : "MM"} />,
      },
    ]}
    renderExtras={({ form }) => (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width*</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thickness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thickness*</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.001" value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="length"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Length*</FormLabel>
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
                  <SelectItem value="MM">MM</SelectItem>
                  <SelectItem value="METER">Meter</SelectItem>
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

export default ProfileSizesPage;

