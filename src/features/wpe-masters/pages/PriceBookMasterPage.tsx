import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const PriceBookMasterPage = () => (
  <SimpleMasterPage
    title="Price Book Master"
    description="Manage price book references assigned to users."
    queryKey="price-books"
    api={wpeMastersApi.priceBooks}
  />
);

export default PriceBookMasterPage;
