import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const RoleMasterPage = () => (
  <SimpleMasterPage
    title="Role Master"
    description="Manage roles that can be assigned to users."
    queryKey="roles"
    api={wpeMastersApi.roles}
  />
);

export default RoleMasterPage;
