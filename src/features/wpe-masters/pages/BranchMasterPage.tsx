import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const BranchMasterPage = () => (
  <SimpleMasterPage
    title="Branch Master"
    description="Manage authorized branches for user assignment."
    queryKey="branches"
    api={wpeMastersApi.branches}
  />
);

export default BranchMasterPage;
