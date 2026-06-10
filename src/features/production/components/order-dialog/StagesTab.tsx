import { memo } from "react";
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";

const StagesTab = () => (
  <ProductionPlaceholderTab
    title="Stages"
    description="Stage routing, checkpoints, and execution controls are prepared here."
  />
);

export default memo(StagesTab);
