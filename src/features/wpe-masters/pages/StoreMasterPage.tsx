import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import {
  codeMasterSchema,
  type CodeMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const defaultValues: CodeMasterFormValues = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

const StoreMasterPage = () => (
  <CodeMasterPage
    title="Store"
    description="Manage store master records used by inventory and store administration."
    queryKey="stores"
    api={wpeMastersApi.stores}
    schema={codeMasterSchema}
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
    codeLabel="Store Code*"
    nameLabel="Store Name*"
    namePlaceholder="Enter store name"
    showDescription={false}
    createLabel="Add Store"
    createButtonLabel="Create Store"
  />
);

export default StoreMasterPage;
