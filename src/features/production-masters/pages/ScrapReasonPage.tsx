import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { extrusionApi } from "@/features/production/extrusion/api/extrusionApi";
import { scrapReasonSchema, type ScrapReasonFormValues } from "@/features/production/extrusion/schemas";
import type { LookupItem } from "@/features/wpe-masters/types";

const defaultValues: ScrapReasonFormValues = {
  code: "",
  name: "",
  description: "",
  category: 0,
  is_active: true,
};

const ScrapReasonPage = () => {
  const categoriesQuery = useQuery({
    queryKey: ["extrusion-scrap-categories-lookup"],
    queryFn: () => extrusionApi.scrapCategories.lookup() as Promise<LookupItem[]>,
  });
  const categories = categoriesQuery.data ?? [];

  return (
    <CodeMasterPage
      title="Scrap Reason"
      description="Maintain the extrusion scrap reason master grouped by category (FRD §7)."
      queryKey="extrusion-scrap-reasons"
      api={extrusionApi.scrapReasons}
      schema={scrapReasonSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        category: record.category,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        category: values.category,
        is_active: values.is_active,
      })}
      codeLabel="Reason Code*"
      nameLabel="Reason Name*"
      namePlaceholder="e.g. Profile bend, twist or straightness outside limit"
      renderNameSecondary={(record) => record.category_name}
      createLabel="Add Scrap Reason"
      createButtonLabel="Create Scrap Reason"
      renderExtras={({ form }) => (
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scrap Category*</FormLabel>
              <Select value={String(field.value || "")} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scrap category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    />
  );
};

export default ScrapReasonPage;
