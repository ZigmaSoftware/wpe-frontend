import ProductionSectionCard from "./ProductionSectionCard";

type ProductionPlaceholderTabProps = {
  title: string;
  description: string;
};

const ProductionPlaceholderTab = ({ title, description }: ProductionPlaceholderTabProps) => (
  <ProductionSectionCard title={title} description={description} className="border-dashed">
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-sm text-slate-600">
      This tab shell is ready for the next phase of the production workflow implementation.
    </div>
  </ProductionSectionCard>
);

export default ProductionPlaceholderTab;
