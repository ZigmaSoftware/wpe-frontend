import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const DepartmentMasterPage = () => (
  <SimpleMasterPage
    title="Department Master"
    description="Manage departments used across the organization."
    queryKey="departments"
    api={wpeMastersApi.departments}
  />
);

export default DepartmentMasterPage;
