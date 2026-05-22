import type { UseFormReturn } from "react-hook-form";
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
  type ProductionOrderFormValues,
} from "./productionOrderForm";

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
}: ProductionGeneralTabProps) => (
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
    <div className="space-y-5">
      <ProductionSectionCard
        title="Production"
        description="Set the production order control fields and finished goods target."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Status*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                <FormLabel className="text-sm font-medium text-slate-700">Production Type*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                <FormLabel className="text-sm font-medium text-slate-700">Stage*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                <FormLabel className="text-sm font-medium text-slate-700">Next Workflow Stage*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                  <FormLabel className="text-sm font-medium text-slate-700">Finished Goods</FormLabel>
                  <FinishedGoodsAutocomplete
                    value={field.value}
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

      <ProductionPlanTable form={form} />
      <ProductionNotesSection form={form} />
    </div>

    <div className="space-y-5">
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
      <ProductionBaseOrderSection form={form} />
      <ProductionSpecsSection form={form} />
      <ProductionDetailsSection form={form} />
    </div>
  </div>
);

export default ProductionGeneralTab;
