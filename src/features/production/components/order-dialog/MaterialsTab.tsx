import { memo, type ComponentProps } from "react";
import ProductionMaterialsTab from "./ProductionMaterialsTab";

type MaterialsTabProps = ComponentProps<typeof ProductionMaterialsTab>;

const MaterialsTab = (props: MaterialsTabProps) => <ProductionMaterialsTab {...props} />;

export default memo(MaterialsTab);
