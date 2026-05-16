import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const WarehouseMasterPage = () => (
  <SimpleMasterPage
    title="Warehouse Master"
    description="Manage authorized warehouses for user access control."
    queryKey="warehouses"
    api={wpeMastersApi.warehouses}
  />
);

export default WarehouseMasterPage;
