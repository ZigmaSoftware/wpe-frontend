import { useQuery } from "@tanstack/react-query";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import {
  roleMasterSchema,
  type RoleMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";

const ROLE_SCREEN_CODE = "role-master";

const defaultValues: RoleMasterFormValues = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

const RoleMasterPage = () => {
  const columnConfigQuery = useQuery({
    queryKey: ["admin-master", "user-screens", "table-columns", ROLE_SCREEN_CODE],
    queryFn: () => adminMasterApi.fetchTableColumns(ROLE_SCREEN_CODE),
    staleTime: 5 * 60 * 1000,
  });
  const filteredColumnConfig = (columnConfigQuery.data ?? []).filter((column) => {
    const key = column.key.trim().toLowerCase();
    const field = column.field.trim().toLowerCase();
    const title = column.title.trim().toLowerCase();
    return key !== "designation" && field !== "designation" && title !== "designation";
  });

  return (
    <CodeMasterPage
      title="Role"
      description="Manage role records used across downstream user setup."
      queryKey="roles"
      api={wpeMastersApi.roles}
      schema={roleMasterSchema}
      defaultValues={defaultValues}
      columnConfig={filteredColumnConfig}
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
      codeLabel="Role Code*"
      nameLabel="Role Name*"
      namePlaceholder="Enter role name"
      descriptionLabel="Role Details"
      createLabel="Add Role"
      createButtonLabel="Create Role"
    />
  );
};

export default RoleMasterPage;
