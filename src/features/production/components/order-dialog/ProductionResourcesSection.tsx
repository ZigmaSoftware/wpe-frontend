import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductionMachine } from "@/lib/types";
import ProductionSectionCard from "./ProductionSectionCard";
import ProductionShiftSelector from "./ProductionShiftSelector";
import type { NamedOption, ProductionOrderFormValues } from "./productionOrderForm";

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
    title="Date & Time & Resources"
    description="Assign the production schedule, shift, and operational resources."
  >
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <FormField
          control={form.control}
          name="resources.production_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-700">Production Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="h-11 rounded-xl border-slate-200" />
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
              <FormLabel className="text-sm font-medium text-slate-700">Shift</FormLabel>
              <FormControl>
                <ProductionShiftSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="resources.production_facility"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-700">Production Facility*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
              <FormLabel className="text-sm font-medium text-slate-700">Work Center*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
              <FormLabel className="text-sm font-medium text-slate-700">Line (Machine)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
              <FormLabel className="text-sm font-medium text-slate-700">Shift Incharge*</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder={lookupsLoading ? "Loading incharges..." : "Select shift incharge"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {inchargeOptions.map((option) => (
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
      </div>

      {lookupError ? <div className="text-xs text-amber-600">{lookupError}</div> : null}
    </div>
  </ProductionSectionCard>
);

export default ProductionResourcesSection;
