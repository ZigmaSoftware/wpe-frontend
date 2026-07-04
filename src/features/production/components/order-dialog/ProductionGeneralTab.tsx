import { Suspense, lazy, useEffect } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Factory } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useDeferredMount from "@/hooks/useDeferredMount";
import type { ProductionMachine } from "@/lib/types";
import FinishedGoodsAutocomplete from "./FinishedGoodsAutocomplete";
import ProductionResourcesSection from "./ProductionResourcesSection";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  ORDER_STATUS_OPTIONS,
  WORKFLOW_STAGE_OPTIONS,
  type NamedOption,
  type ProductionItemOption,
  type ProductionTypeOption,
  type ProductionOrderFormValues,
  type WorkflowStageValue,
} from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionFieldGridClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

const GeneralTabDeferredSections = lazy(() => import("./GeneralTabDeferredSections"));

type ProductionGeneralTabProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  productionTypeOptions: ProductionTypeOption[];
  facilityOptions: NamedOption[];
  workCenterOptions: NamedOption[];
  inchargeOptions: NamedOption[];
  machines: ProductionMachine[];
  productionTypesLoading?: boolean;
  machinesLoading?: boolean;
  lookupsLoading?: boolean;
  lookupError?: string | null;
  lockedStage?: WorkflowStageValue | null;
};

const ProductionGeneralTab = ({
  form,
  productionTypeOptions,
  facilityOptions,
  workCenterOptions,
  inchargeOptions,
  machines,
  productionTypesLoading = false,
  machinesLoading = false,
  lookupsLoading = false,
  lookupError,
  lockedStage = null,
}: ProductionGeneralTabProps) => {
  const finishedGoods = useWatch({ control: form.control, name: "finished_goods" });
  const showDeferredSections = useDeferredMount();

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
      <div className="grid gap-4 xl:grid-cols-2">
        <ProductionSectionCard
          title="General Information"
          description="Define the production name, type, workflow stage, and finished goods."
          tone="amber"
          icon={Factory}
        >
          <div className={productionFieldGridClassName}>
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
                        <SelectValue placeholder={productionTypesLoading ? "Loading production types..." : "Select production type"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productionTypeOptions.length > 0 ? (
                        productionTypeOptions.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No production types available.</div>
                      )}
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
                  <FormLabel className={productionFieldLabelClassName}>Stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={lockedStage !== null}>
                    <FormControl>
                      <SelectTrigger className={productionInputClassName}>
                        <SelectValue placeholder="-" />
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
                  <FormLabel className={productionFieldLabelClassName}>Next Workflow Stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={lockedStage !== null}>
                    <FormControl>
                      <SelectTrigger className={productionInputClassName}>
                        <SelectValue placeholder="-" />
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

      {showDeferredSections ? (
        <Suspense fallback={null}>
          <GeneralTabDeferredSections form={form} />
        </Suspense>
      ) : null}
    </div>
  );
};

export default ProductionGeneralTab;
