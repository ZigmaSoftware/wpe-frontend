import type { UseFormReturn } from "react-hook-form";
import { CalendarDays } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductionMachine } from "@/lib/types";
import ProductionSectionCard from "./ProductionSectionCard";
import ProductionShiftSelector from "./ProductionShiftSelector";
import type { NamedOption, ProductionOrderFormValues } from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionFieldGridClassName,
  productionHelperTextClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

type ProductionResourcesSectionProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
  facilityOptions: NamedOption[];
  workCenterOptions: NamedOption[];
  inchargeOptions: NamedOption[];
  machines: ProductionMachine[];
  machinesLoading?: boolean;
  lookupsLoading?: boolean;
  lookupError?: string | null;
};

const ProductionResourcesSection = ({
  form,
  facilityOptions,
  workCenterOptions,
  inchargeOptions,
  machines,
  machinesLoading = false,
  lookupsLoading = false,
  lookupError,
}: ProductionResourcesSectionProps) => (
  <ProductionSectionCard
    title="Schedule & Resources"
    description="Assign when and where this production will take place."
    tone="blue"
    icon={CalendarDays}
  >
    <div className="space-y-4">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="resources.production_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Production Date*</FormLabel>
              <FormControl>
                <Input {...field} type="date" className={productionInputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resources.shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Shift</FormLabel>
              <FormControl>
                <ProductionShiftSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className={productionFieldGridClassName}>
        <FormField
          control={form.control}
          name="resources.production_facility"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Production Facility*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={productionInputClassName}>
                    <SelectValue placeholder={lookupsLoading ? "Loading facilities..." : "Select production facility"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {facilityOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
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
          name="resources.work_center"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Work Center*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={productionInputClassName}>
                    <SelectValue placeholder={lookupsLoading ? "Loading work centers..." : "Select work center"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workCenterOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
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
          name="resources.line_machine_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Line (Machine)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={productionInputClassName}>
                    <SelectValue placeholder={machinesLoading ? "Loading machines..." : "Select machine"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={String(machine.id)}>
                      {machine.name} {machine.machine_code ? `(${machine.machine_code})` : ""}
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
          name="resources.shift_incharge"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={productionFieldLabelClassName}>Shift Incharge*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={productionInputClassName}>
                    <SelectValue placeholder={lookupsLoading ? "Loading incharges..." : "Select shift incharge"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {inchargeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                      {option.description ? ` (${option.description})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {lookupError ? <div className={productionHelperTextClassName}>{lookupError}</div> : null}
    </div>
  </ProductionSectionCard>
);

export default ProductionResourcesSection;
