import { memo, type ComponentProps } from "react";
import ProductionGeneralTab from "./ProductionGeneralTab";

type GeneralTabProps = ComponentProps<typeof ProductionGeneralTab>;

const GeneralTab = (props: GeneralTabProps) => <ProductionGeneralTab {...props} />;

export default memo(GeneralTab);
