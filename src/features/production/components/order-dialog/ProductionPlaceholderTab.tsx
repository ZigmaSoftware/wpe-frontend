import ProductionSectionCard from "./ProductionSectionCard";

type ProductionPlaceholderTabProps = {
  title: string;
  description: string;
};

const ProductionPlaceholderTab = ({ title, description }: ProductionPlaceholderTabProps) => (
  <ProductionSectionCard title={title} description={description} className="border-dashed" tone="slate">
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#f8fbff] px-5 py-8 text-sm leading-6 text-slate-500">
      This tab shell is ready for the next phase of the production workflow implementation.
    </div>
  </ProductionSectionCard>
);

export default ProductionPlaceholderTab;
