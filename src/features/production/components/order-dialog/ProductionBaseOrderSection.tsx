import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";

type ProductionBaseOrderSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const readOnlyClassName = "h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-600";

const ProductionBaseOrderSection = ({ form }: ProductionBaseOrderSectionProps) => (
  <ProductionSectionCard
    title="Base Order Details"
    description="Readonly linkage fields prepared for plan, customer, and order integration."
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="base_order.base_plan_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Base Plan ID</FormLabel>
            <Input {...field} readOnly placeholder="Will populate from linked plan" className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="base_order.base_order_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Base Order ID</FormLabel>
            <Input {...field} readOnly placeholder="Will populate from linked order" className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="base_order.base_customer_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Base Customer ID</FormLabel>
            <Input {...field} readOnly placeholder="Will populate from linked customer" className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="base_order.base_customer_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-slate-700">Base Customer Name</FormLabel>
            <Input {...field} readOnly placeholder="Will populate from linked customer" className={readOnlyClassName} />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="base_order.base_order_date"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel className="text-sm font-medium text-slate-700">Base Order Date</FormLabel>
            <Input {...field} readOnly placeholder="Will populate from linked order date" className={readOnlyClassName} />
          </FormItem>
        )}
      />
    </div>
  </ProductionSectionCard>
);

export default ProductionBaseOrderSection;
