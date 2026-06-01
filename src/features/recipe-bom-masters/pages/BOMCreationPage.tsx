import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
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
import { recipeBomMastersApi } from "@/features/recipe-bom-masters/api/recipeBomMastersApi";
import {
  bomCreationSchema,
  type BOMCreationFormValues,
} from "@/features/recipe-bom-masters/schemas";

const defaultValues: BOMCreationFormValues = {
  code: "",
  name: "",
  description: "",
  product: null,
  bom_version: "",
  output_quantity: undefined,
  output_uom: "",
  status: "DRAFT",
  is_active: true,
};

const BOMCreationPage = () => {
  const productQuery = useQuery({
    queryKey: ["production-masters", "profile-creations", "lookup"],
    queryFn: productionMastersApi.profileCreations.lookup,
  });

  return (
    <CodeMasterPage
      title="BOM Creation"
      description="Create and maintain bill of materials records for production outputs."
      queryKey="bom-creations"
      api={recipeBomMastersApi.bomCreations}
      schema={bomCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        product: record.product,
        bom_version: record.bom_version ?? "",
        output_quantity: record.output_quantity ? Number(record.output_quantity) : undefined,
        output_uom: record.output_uom ?? "",
        status: record.status,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description || "",
        product: values.product || null,
        bom_version: values.bom_version || "",
        output_quantity: values.output_quantity ?? null,
        output_uom: values.output_uom || "",
        status: values.status,
        is_active: values.is_active,
      })}
      codeLabel="BOM Code*"
      nameLabel="BOM Name*"
      namePlaceholder="Enter BOM name"
      showDescription={false}
      createLabel="Add BOM"
      createButtonLabel="Create BOM"
      allowDelete={false}
      extraColumns={[
        {
          key: "product",
          title: "Product",
          render: (record) => record.product_name || "-",
        },
        {
          key: "output_quantity",
          title: "Output",
          render: (record) =>
            record.output_quantity
              ? `${record.output_quantity}${record.output_uom ? ` ${record.output_uom === "NOS" ? "Nos" : record.output_uom}` : ""}`
              : "-",
        },
        {
          key: "status",
          title: "Status",
          render: (record) => (
            <Badge
              variant="outline"
              className={
                record.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }
            >
              {record.status === "APPROVED" ? "Approved" : "Draft"}
            </Badge>
          ),
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(productQuery.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.code ? `${option.code} - ${option.name}` : option.name}
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
            name="bom_version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BOM Version</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter BOM version" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="output_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Quantity</FormLabel>
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
            name="output_uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output UOM</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Output UOM" />
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
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
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

export default BOMCreationPage;
