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
import { recipeBomMastersApi } from "@/features/recipe-bom-masters/api/recipeBomMastersApi";
import {
  recipeCreationSchema,
  type RecipeCreationFormValues,
} from "@/features/recipe-bom-masters/schemas";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";

const fallbackBatchUomOptions = [
  { id: -1, name: "KG", code: "KG" },
  { id: -2, name: "Nos", code: "NOS" },
  { id: -3, name: "Meter", code: "METER" },
];

const defaultValues: RecipeCreationFormValues = {
  code: "",
  name: "",
  description: "",
  recipe_version: "",
  batch_size: undefined as unknown as number,
  batch_uom: "",
  status: "DRAFT",
  approved_by: null,
  approved_at: "",
  is_active: true,
};

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment: number) => String(segment).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoString = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const RecipeCreationPage = () => {
  const batchUomQuery = useQuery({
    queryKey: ["wpe-masters", "units", "lookup"],
    queryFn: wpeMastersApi.units.lookup,
  });
  const approverQuery = useQuery({
    queryKey: ["recipe-bom-masters", "recipes", "approvers"],
    queryFn: recipeBomMastersApi.recipes.approverOptions,
  });

  const batchUomOptions = batchUomQuery.data?.length ? batchUomQuery.data : fallbackBatchUomOptions;

  return (
    <CodeMasterPage
      title="Recipe Creation"
      description="Create and maintain production recipes, batch sizes, versions, and approval status."
      queryKey="recipe-creations"
      api={recipeBomMastersApi.recipes}
      schema={recipeCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        recipe_version: record.recipe_version ?? "",
        batch_size: record.batch_size ? Number(record.batch_size) : (undefined as unknown as number),
        batch_uom: record.batch_uom ?? "",
        status: record.status,
        approved_by: record.approved_by,
        approved_at: toDatetimeLocalValue(record.approved_at),
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description || "",
        recipe_version: values.recipe_version || "",
        batch_size: values.batch_size,
        batch_uom: values.batch_uom,
        status: values.status,
        approved_by: values.approved_by || null,
        approved_at: toIsoString(values.approved_at),
        is_active: values.is_active,
      })}
      codeLabel="Recipe Code*"
      nameLabel="Recipe Name*"
      namePlaceholder="Enter recipe name"
      showDescription={false}
      createLabel="Add Recipe"
      createButtonLabel="Create Recipe"
      allowDelete={false}
      extraColumns={[
        { key: "version", title: "Recipe Version", render: (record) => record.recipe_version || "-" },
        {
          key: "batch",
          title: "Batch",
          render: (record) =>
            record.batch_size ? `${record.batch_size}${record.batch_uom ? ` ${record.batch_uom}` : ""}` : "-",
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
                  : record.status === "INACTIVE"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }
            >
              {record.status === "APPROVED" ? "Approved" : record.status === "INACTIVE" ? "Inactive" : "Draft"}
            </Badge>
          ),
        },
        { key: "approved_by", title: "Approved By", render: (record) => record.approved_by_name || "-" },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="recipe_version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipe Version</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter recipe version" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batch_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Size*</FormLabel>
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
            name="batch_uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch UOM*</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Batch UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batchUomOptions.map((option) => (
                      <SelectItem key={`${option.id}-${option.code ?? option.name}`} value={option.code ?? option.name}>
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
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="approved_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved By</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Approved By" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(approverQuery.data ?? []).map((option) => (
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
            name="approved_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved At</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
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

export default RecipeCreationPage;
