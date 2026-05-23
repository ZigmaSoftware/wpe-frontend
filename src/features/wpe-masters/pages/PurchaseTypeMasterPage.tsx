import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const PurchaseTypeMasterPage = () => (
  <SimpleMasterPage
    title="Purchase Type Master"
    description="Manage authorized purchase transaction types for users."
    queryKey="purchase-types"
    api={wpeMastersApi.purchaseTypes}
  />
);

export default PurchaseTypeMasterPage;
