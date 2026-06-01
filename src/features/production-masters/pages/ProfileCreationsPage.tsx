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
import { profileCreationSchema, type ProfileCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: ProfileCreationFormValues = {
  code: "",
  name: "",
  profile_type: 0,
  profile_size: 0,
  color: 0,
  length: 0,
  weight_per_piece: undefined,
  uom: "NOS",
  packing_type: null,
  is_active: true,
};

const ProfileCreationsPage = () => {
  const profileTypeQuery = useQuery({
    queryKey: ["wpe-masters", "product-type-categories", "lookup"],
    queryFn: wpeMastersApi.productTypeCategories.lookup,
  });
  const profileSizeQuery = useQuery({
    queryKey: ["production-masters", "profile-sizes", "lookup"],
    queryFn: productionMastersApi.profileSizes.lookup,
  });
  const colorQuery = useQuery({
    queryKey: ["production-masters", "color-creations", "lookup"],
    queryFn: productionMastersApi.colorCreations.lookup,
  });
  const packingTypeQuery = useQuery({
    queryKey: ["production-masters", "packing-types", "lookup"],
    queryFn: productionMastersApi.packingTypes.lookup,
  });

  return (
    <CodeMasterPage
      title="Profile Creations"
      description="Create and maintain finished profile/product specifications."
      queryKey="production-profile-creations"
      api={productionMastersApi.profileCreations}
      schema={profileCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        profile_type: record.profile_type,
        profile_size: record.profile_size,
        color: record.color,
        length: Number(record.length),
        weight_per_piece: record.weight_per_piece ? Number(record.weight_per_piece) : undefined,
        uom: record.uom,
        packing_type: record.packing_type,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        profile_type: values.profile_type,
        profile_size: values.profile_size,
        color: values.color,
        length: values.length,
        weight_per_piece: values.weight_per_piece ?? null,
        uom: values.uom,
        packing_type: values.packing_type || null,
        is_active: values.is_active,
      })}
      codeLabel="Product Code*"
      nameLabel="Product Name*"
      namePlaceholder="Enter product name"
      showDescription={false}
      createLabel="Add Profile"
      createButtonLabel="Create Profile"
      allowDelete={false}
      renderNameSecondary={(record) => `${record.profile_type_name} / ${record.profile_size_name}`}
      extraColumns={[
        { key: "color", title: "Color", render: (record) => record.color_name },
        { key: "length", title: "Length", render: (record) => record.length },
        { key: "uom", title: "UOM", render: (record) => <ProductionEnumBadge value={record.uom} label={record.uom === "METER" ? "Meter" : "Nos"} /> },
        { key: "packing_type", title: "Packing Type", render: (record) => record.packing_type_name || "-" },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="profile_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Type*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Profile Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(profileTypeQuery.data ?? []).map((option) => (
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
            name="profile_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Size*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Profile Size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(profileSizeQuery.data ?? []).map((option) => (
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
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(colorQuery.data ?? []).map((option) => (
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
            name="weight_per_piece"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Per Piece</FormLabel>
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
                    <SelectItem value="METER">Meter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Packing Type</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Packing Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(packingTypeQuery.data ?? []).map((option) => (
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
        </div>
      )}
    />
  );
};

export default ProfileCreationsPage;

