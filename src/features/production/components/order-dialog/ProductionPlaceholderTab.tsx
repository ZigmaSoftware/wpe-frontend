import ProductionSectionCard from "./ProductionSectionCard";

type ProductionPlaceholderTabProps = {
  title: string;
  description: string;
};

const ProductionPlaceholderTab = ({ title, description }: ProductionPlaceholderTabProps) => (
  <ProductionSectionCard title={title} description={description} className="border-dashed" tone="slate">
    <div className="rounded-[18px] border border-dashed border-[#d8e0e8] bg-[#e7ecf1] px-5 py-10 text-center">
      <div className="text-sm font-semibold text-slate-700">{title} section ready</div>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  </ProductionSectionCard>
);

export default ProductionPlaceholderTab;
