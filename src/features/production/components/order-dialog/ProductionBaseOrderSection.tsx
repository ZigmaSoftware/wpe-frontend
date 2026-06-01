import { Link2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionHelperTextClassName,
  productionReadOnlyInputClassName,
} from "./productionOrderFormStyles";

type ProductionBaseOrderSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  embedded?: boolean;
  title?: string;
  description?: string;
};

const BaseOrderFields = ({ form }: Pick<ProductionBaseOrderSectionProps, "form">) => (
  <div className="grid gap-3">
    <FormField
      control={form.control}
      name="base_order.base_plan_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>Plan ID</FormLabel>
          <Input {...field} readOnly placeholder="Will populate from linked plan" className={productionReadOnlyInputClassName} />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="base_order.base_order_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>Base Order ID</FormLabel>
          <Input {...field} readOnly placeholder="Will populate from linked order" className={productionReadOnlyInputClassName} />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="base_order.base_customer_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>Base Customer ID</FormLabel>
          <Input {...field} readOnly placeholder="Will populate from linked customer" className={productionReadOnlyInputClassName} />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="base_order.base_customer_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>Base Customer Name</FormLabel>
          <Input {...field} readOnly placeholder="Will populate from linked customer" className={productionReadOnlyInputClassName} />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="base_order.base_order_date"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={productionFieldLabelClassName}>Base Order Date</FormLabel>
          <Input {...field} readOnly placeholder="Will populate from base order date" className={productionReadOnlyInputClassName} />
        </FormItem>
      )}
    />
  </div>
);

const ProductionBaseOrderSection = ({
  form,
  embedded = false,
  title = "Base Order Details",
  description = "Readonly linkage fields prepared for plan, customer, and order integration.",
}: ProductionBaseOrderSectionProps) => {
  if (embedded) {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-800">{title}</div>
          <p className={`mt-1 ${productionHelperTextClassName}`}>{description}</p>
        </div>
        <BaseOrderFields form={form} />
      </div>
    );
  }

  return (
    <ProductionSectionCard title={title} description={description} tone="slate" icon={Link2}>
      <BaseOrderFields form={form} />
    </ProductionSectionCard>
  );
};

export default ProductionBaseOrderSection;
