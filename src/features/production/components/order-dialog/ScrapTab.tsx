import { memo } from "react";
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";

const ScrapTab = () => (
  <ProductionPlaceholderTab
    title="Scrap"
    description="Scrap classification, yield loss, and recovery handling will fit into this tab."
  />
);

export default memo(ScrapTab);
