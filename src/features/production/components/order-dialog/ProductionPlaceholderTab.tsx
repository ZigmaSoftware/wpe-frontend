import ProductionSectionCard from "./ProductionSectionCard";

type ProductionPlaceholderTabProps = {
  title: string;
  description: string;
};

const ProductionPlaceholderTab = ({ title, description }: ProductionPlaceholderTabProps) => (
  <ProductionSectionCard title={title} description={description} className="border-dashed" tone="slate">
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#f8fbff] px-5 py-10 text-center">
      <div className="text-sm font-semibold text-slate-700">{title} section ready</div>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  </ProductionSectionCard>
);

export default ProductionPlaceholderTab;
