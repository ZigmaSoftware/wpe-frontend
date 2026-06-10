import type { UseFormReturn } from "react-hook-form";
import ProductionBaseOrderSection from "./ProductionBaseOrderSection";
import ProductionDetailsSection from "./ProductionDetailsSection";
import ProductionNotesSection from "./ProductionNotesSection";
import ProductionPlanTable from "./ProductionPlanTable";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import { productionSectionColumnsClassName } from "./productionOrderFormStyles";

type GeneralTabDeferredSectionsProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const GeneralTabDeferredSections = ({ form }: GeneralTabDeferredSectionsProps) => (
  <>
    <div className="grid gap-5 xl:grid-cols-2">
      <ProductionPlanTable form={form} />
      <ProductionBaseOrderSection
        form={form}
        title="Base Order Details"
        description="Link this production order to a base plan, customer, and sales order."
      />
    </div>

    <div className={productionSectionColumnsClassName}>
      <ProductionNotesSection form={form} />
      <ProductionDetailsSection form={form} />
    </div>
  </>
);

export default GeneralTabDeferredSections;
