import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { extrusionApi } from "@/features/production/extrusion/api/extrusionApi";
import { scrapCategorySchema, type ScrapCategoryFormValues } from "@/features/production/extrusion/schemas";

const defaultValues: ScrapCategoryFormValues = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

const ScrapCategoryPage = () => (
  <CodeMasterPage
    title="Scrap Category"
    description="Maintain the extrusion scrap category master (FRD §7)."
    queryKey="extrusion-scrap-categories"
    api={extrusionApi.scrapCategories}
    schema={scrapCategorySchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      description: record.description ?? "",
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      description: values.description,
      is_active: values.is_active,
    })}
    codeLabel="Category Code*"
    nameLabel="Category Name*"
    namePlaceholder="e.g. Straightness Failure"
    createLabel="Add Scrap Category"
    createButtonLabel="Create Scrap Category"
  />
);

export default ScrapCategoryPage;
