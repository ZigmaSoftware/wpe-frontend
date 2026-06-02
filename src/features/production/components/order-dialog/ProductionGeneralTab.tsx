import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Factory } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductionMachine } from "@/lib/types";
import ProductionBaseOrderSection from "./ProductionBaseOrderSection";
import ProductionDetailsSection from "./ProductionDetailsSection";
import FinishedGoodsAutocomplete from "./FinishedGoodsAutocomplete";
import ProductionNotesSection from "./ProductionNotesSection";
import ProductionPlanTable from "./ProductionPlanTable";
import ProductionResourcesSection from "./ProductionResourcesSection";
import ProductionSectionCard from "./ProductionSectionCard";
import ProductionSpecsSection from "./ProductionSpecsSection";
import {
  ORDER_STATUS_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  WORKFLOW_STAGE_OPTIONS,
  type NamedOption,
  type ProductionItemOption,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

type ProductionGeneralTabProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  facilityOptions: NamedOption[];
  workCenterOptions: NamedOption[];
  inchargeOptions: NamedOption[];
  machines: ProductionMachine[];
  machinesLoading?: boolean;
  lookupsLoading?: boolean;
  lookupError?: string | null;
};

const ProductionGeneralTab = ({
  form,
  facilityOptions,
  workCenterOptions,
  inchargeOptions,
  machines,
  machinesLoading = false,
  lookupsLoading = false,
  lookupError,
}: ProductionGeneralTabProps) => {
  const finishedGoods = form.watch("finished_goods");

  useEffect(() => {
    if (finishedGoods?._source === "profile") {
      if (finishedGoods._profile_length) {
        form.setValue("plan_rows.0.length_mts", finishedGoods._profile_length, { shouldDirty: true });
      }
      if (finishedGoods._profile_weight) {
        form.setValue("plan_rows.0.qty_mts", finishedGoods._profile_weight, { shouldDirty: true });
      }
    }
  }, [finishedGoods, form]);

  return (
  <div className="space-y-5">
    <div className="grid gap-5 xl:grid-cols-2">
      <ProductionSectionCard
        title="Production"
        description="Set the production order control fields and finished goods target."
        tone="amber"
        icon={Factory}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={productionFieldLabelClassName}>Status*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={productionInputClassName}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="production_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={productionFieldLabelClassName}>Production Type*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={productionInputClassName}>
                      <SelectValue placeholder="Select production type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={productionFieldLabelClassName}>Stage*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={productionInputClassName}>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORKFLOW_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="next_workflow_stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={productionFieldLabelClassName}>Next Workflow Stage*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={productionInputClassName}>
                      <SelectValue placeholder="Select next stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORKFLOW_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="finished_goods"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className={productionFieldLabelClassName}>Finished Goods</FormLabel>
                  <FinishedGoodsAutocomplete
                    value={field.value as ProductionItemOption | null}
                    onChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </ProductionSectionCard>
      <ProductionResourcesSection
        form={form}
        facilityOptions={facilityOptions}
        workCenterOptions={workCenterOptions}
        inchargeOptions={inchargeOptions}
        machines={machines}
        machinesLoading={machinesLoading}
        lookupsLoading={lookupsLoading}
        lookupError={lookupError}
      />
    </div>

    <ProductionPlanTable
      form={form}
      sidebar={
        <ProductionBaseOrderSection form={form} embedded title="Basic Order Details" description="Readonly linkage fields populated for plan, customer, and order integration." />
      }
    />

    <div className="grid gap-5 xl:grid-cols-2">
      <ProductionNotesSection form={form} />
      <ProductionSpecsSection form={form} />
    </div>

    <ProductionDetailsSection form={form} />
  </div>
  );
};

export default ProductionGeneralTab;
