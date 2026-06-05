import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { recipeBomMastersApi } from "@/features/recipe-bom-masters/api/recipeBomMastersApi";
import {
  recipeCreationSchema,
  type RecipeCreationFormValues,
} from "@/features/recipe-bom-masters/schemas";

const defaultValues: RecipeCreationFormValues = {
  code: "",
  name: "",
  description: "",
  recipe_version: "",
  batch_size: undefined as unknown as number,
  is_active: true,
};

const RecipeCreationPage = () => {
  return (
    <CodeMasterPage
      title="Recipe Creation"
      description="Create and maintain recipe creation records."
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
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description || "",
        recipe_version: values.recipe_version || "",
        batch_size: values.batch_size,
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
                <FormLabel>Batch Size</FormLabel>
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

export default RecipeCreationPage;
