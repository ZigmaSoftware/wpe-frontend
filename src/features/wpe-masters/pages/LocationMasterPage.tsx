import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import SimpleMasterPage from "./SimpleMasterPage";

const LocationMasterPage = () => (
  <SimpleMasterPage
    title="Location"
    description="Manage locations such as warehouses, work centers, and WIP areas."
    queryKey="locations"
    api={wpeMastersApi.locations}
  />
);

export default LocationMasterPage;
