import { memo } from "react";
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";

const CostTab = () => (
  <ProductionPlaceholderTab
    title="Cost"
    description="Cost rollups, overhead allocation, and ERP cost traceability can be layered in next."
  />
);

export default memo(CostTab);
