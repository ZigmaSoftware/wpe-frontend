import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const SaleTypeMasterPage = () => (
  <SimpleMasterPage
    title="Sale Type"
    description="Manage authorized sale transaction types for users."
    queryKey="sale-types"
    api={wpeMastersApi.saleTypes}
  />
);

export default SaleTypeMasterPage;
