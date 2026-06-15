import type { ProductionStageValue } from "@/features/production/api/productionWorkspaceApi";
import ProductionStageList from "@/features/production/components/ProductionStageList";

type ProductionStagePageProps = {
  stage: ProductionStageValue;
};

const ProductionStagePage = ({ stage }: ProductionStagePageProps) => <ProductionStageList stage={stage} />;

export default ProductionStagePage;
