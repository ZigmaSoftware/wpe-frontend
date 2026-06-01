import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const ProductionTypeMasterPage = () => (
  <SimpleMasterPage
    title="Production Type"
    description="Manage production types authorized for users."
    queryKey="production-types"
    api={wpeMastersApi.productionTypes}
  />
);

export default ProductionTypeMasterPage;
