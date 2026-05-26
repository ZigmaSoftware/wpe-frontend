import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LookupItem, WPEUserRecord } from "@/features/wpe-masters/types";
import type { ProductionMachine } from "@/lib/types";
import ProductionGeneralTab from "./ProductionGeneralTab";
import ProductionMaterialsTab from "./ProductionMaterialsTab";
import ProductionOutputTab from "./ProductionOutputTab";
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";
import ProductionTabs from "./ProductionTabs";
import {
  buildActualStartDateTimeValue,
  createProductionOrderDefaultValues,
  formatDateTimeLabel,
  productionOrderFormSchema,
  toProductionOrderPayload,
  type CreateProductionOrderPayload,
  type NamedOption,
  type ProductionDialogTab,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionCompactInputClassName,
  productionFieldLabelClassName,
  productionMetricCardClassName,
} from "./productionOrderFormStyles";

type ProductionOrderFormProps = {
  onSubmit: (payload: CreateProductionOrderPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  machines: ProductionMachine[];
  machinesLoading?: boolean;
  initialValues?: ProductionOrderFormValues;
  formTitle?: string;
  submitLabel?: string;
};

const mapNamedOptions = (items: LookupItem[]) =>
  items.map((item) => ({
    id: String(item.id),
    name: item.name,
  }));

const buildFacilityOptions = (locations: LookupItem[]) => {
  const nonWorkCenterLocations = locations.filter((location) => !/work center/i.test(location.name));
  const source = nonWorkCenterLocations.length > 0 ? nonWorkCenterLocations : locations;
  return mapNamedOptions(source);
};

const buildWorkCenterOptions = (warehouses: LookupItem[], locations: LookupItem[]) => {
  const warehouseWorkCenters = warehouses.filter((warehouse) => /work center|wip/i.test(warehouse.name));
  if (warehouseWorkCenters.length > 0) {
    return mapNamedOptions(warehouseWorkCenters);
  }

  return mapNamedOptions(locations.filter((location) => /work center|wip/i.test(location.name)));
};

const buildInchargeOptions = (users: WPEUserRecord[]): NamedOption[] =>
  users
    .filter((user) => user.is_active && user.role_name?.toLowerCase() === "blending incharge")
    .map((user) => ({
      id: String(user.id),
      name: user.full_name || user.username,
      description: user.role_name ?? undefined,
    }));

const ProductionOrderForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  machines,
  machinesLoading = false,
  initialValues,
  formTitle,
  submitLabel,
}: ProductionOrderFormProps) => {
  const [activeTab, setActiveTab] = useState<ProductionDialogTab>("general");
  const form = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: initialValues ?? createProductionOrderDefaultValues(),
  });

  const locationsQuery = useQuery({
    queryKey: ["production-order-form", "locations"],
    queryFn: () => wpeMastersApi.locations.lookup(),
  });

  const warehousesQuery = useQuery({
    queryKey: ["production-order-form", "warehouses"],
    queryFn: () => wpeMastersApi.warehouses.lookup(),
  });

  const usersQuery = useQuery({
    queryKey: ["production-order-form", "wpe-users"],
    queryFn: () => wpeMastersApi.users.list({ page: 1, pageSize: 200 }),
  });

  const productionDate = form.watch("resources.production_date");
  const shift = form.watch("resources.shift");

  useEffect(() => {
    form.setValue(
      "details.actual_start_time",
      formatDateTimeLabel(buildActualStartDateTimeValue(productionDate, shift)),
      {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      },
    );
  }, [form, productionDate, shift]);

  const facilityOptions = useMemo(
    () => buildFacilityOptions(locationsQuery.data ?? []),
    [locationsQuery.data],
  );

  const workCenterOptions = useMemo(
    () => buildWorkCenterOptions(warehousesQuery.data ?? [], locationsQuery.data ?? []),
    [locationsQuery.data, warehousesQuery.data],
  );

  const inchargeOptions = useMemo(
    () => buildInchargeOptions(usersQuery.data?.items ?? []),
    [usersQuery.data?.items],
  );

  const lookupsLoading = locationsQuery.isLoading || warehousesQuery.isLoading || usersQuery.isLoading;
  const lookupError =
    locationsQuery.isError || warehousesQuery.isError || usersQuery.isError
      ? "Some reference lookups could not be loaded. The form stays usable, but resource selections may be limited."
      : null;

  return (
    <div className="flex min-h-full flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(toProductionOrderPayload(values, machines)))}
          className="flex min-h-full flex-col bg-[#eef3f9]"
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ProductionDialogTab)}
            className="flex min-h-full flex-col"
          >
            <div className="border-b border-slate-200/80 bg-white">
              <div className="px-4 py-3 text-left sm:px-5 lg:px-6 lg:py-3.5">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
                  <div className="space-y-1">
                    <h1 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] text-slate-950 sm:text-[1.5rem]">
                      {formTitle ?? "New Production Order"}
                    </h1>
                  </div>

                  <div className={productionMetricCardClassName}>
                    <FormField
                      control={form.control}
                      name="production_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={productionFieldLabelClassName}>Production ID*</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter production order ID"
                              className={productionCompactInputClassName}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 pb-0 lg:px-6">
                <ProductionTabs value={activeTab} onValueChange={setActiveTab} />
              </div>
            </div>

            <div className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
              <TabsContent value="general" className="mt-0 outline-none">
                <ProductionGeneralTab
                  form={form}
                  facilityOptions={facilityOptions}
                  workCenterOptions={workCenterOptions}
                  inchargeOptions={inchargeOptions}
                  machines={machines}
                  machinesLoading={machinesLoading}
                  lookupsLoading={lookupsLoading}
                  lookupError={lookupError}
                />
              </TabsContent>
              <TabsContent value="materials" className="mt-0 outline-none">
                <ProductionMaterialsTab form={form} />
              </TabsContent>
              <TabsContent value="stages" className="mt-0 outline-none">
                <ProductionPlaceholderTab
                  title="Stages"
                  description="Stage routing, checkpoints, and execution controls are prepared here."
                />
              </TabsContent>
              <TabsContent value="output" className="mt-0 outline-none">
                <ProductionOutputTab form={form} />
              </TabsContent>
              <TabsContent value="scrap" className="mt-0 outline-none">
                <ProductionPlaceholderTab
                  title="Scrap"
                  description="Scrap classification, yield loss, and recovery handling will fit into this tab."
                />
              </TabsContent>
              <TabsContent value="cost" className="mt-0 outline-none">
                <ProductionPlaceholderTab
                  title="Cost"
                  description="Cost rollups, overhead allocation, and ERP cost traceability can be layered in next."
                />
              </TabsContent>
              <TabsContent value="resources" className="mt-0 outline-none">
                <ProductionPlaceholderTab
                  title="Resources"
                  description="Resource calendars, labor assignment, and machine loading will be added here."
                />
              </TabsContent>
            </div>

            <div className="border-t border-slate-200/80 bg-white/95 px-5 py-3 backdrop-blur lg:px-6">
              <div className="flex justify-end">
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-full bg-[linear-gradient(135deg,#ff8f1f_0%,#ff6b00_100%)] px-5 text-white shadow-[0_12px_24px_-16px_rgba(255,107,0,0.9)] hover:opacity-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {submitLabel ? `${submitLabel}...` : "Creating Order..."}
                      </>
                    ) : (
                      submitLabel ?? "Create Order"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default ProductionOrderForm;
