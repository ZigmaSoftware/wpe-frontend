import ProductionStageList from "@/features/production/components/ProductionStageList";

const ProductionPage = () => (
  <ProductionStageList
    stage="AD"
    headerTitle="AD - Weightage"
    headerDescription="Manage production orders, batches, and weighment entries."
  />
);

export default ProductionPage;
