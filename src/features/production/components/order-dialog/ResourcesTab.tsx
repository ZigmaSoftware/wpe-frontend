import { memo } from "react";
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";

const ResourcesTab = () => (
  <ProductionPlaceholderTab
    title="Resources"
    description="Resource calendars, labor assignment, and machine loading will be added here."
  />
);

export default memo(ResourcesTab);
