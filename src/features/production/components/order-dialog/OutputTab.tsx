import { memo, type ComponentProps } from "react";
import ProductionOutputTab from "./ProductionOutputTab";

type OutputTabProps = ComponentProps<typeof ProductionOutputTab>;

const OutputTab = (props: OutputTabProps) => <ProductionOutputTab {...props} />;

export default memo(OutputTab);
