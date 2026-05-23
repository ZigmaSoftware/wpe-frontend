import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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
import ProductionPlaceholderTab from "./ProductionPlaceholderTab";
import ProductionTabs from "./ProductionTabs";
import {
  buildActualStartDateTimeValue,
  createProductionOrderDefaultValues,
  formatDateTimeLabel,
  productionOrderFormSchema,
  PRODUCTION_ORDER_TABS,
  toProductionOrderPayload,
  type CreateProductionOrderPayload,
  type NamedOption,
  type ProductionDialogTab,
  type ProductionOrderFormValues,
} from "./productionOrderForm";
import {
  productionFieldLabelClassName,
  productionHelperTextClassName,
  productionInputClassName,
  productionMetricCardClassName,
} from "./productionOrderFormStyles";

type ProductionOrderFormProps = {
  onSubmit: (payload: CreateProductionOrderPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  machines: ProductionMachine[];
  machinesLoading?: boolean;
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

const buildInchargeOptions = (users: WPEUserRecord[]): NamedOption[] => {
  const activeUsers = users.filter((user) => user.is_active);
  const filteredUsers = activeUsers.filter((user) =>
    [user.role_name, user.job_title]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes("incharge")),
  );

  const source = filteredUsers.length > 0 ? filteredUsers : activeUsers;

  return source.map((user) => ({
    id: String(user.id),
    name: user.full_name || user.username,
    description: user.role_name ?? user.job_title ?? undefined,
  }));
};

const ProductionOrderForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  machines,
  machinesLoading = false,
}: ProductionOrderFormProps) => {
  const [activeTab, setActiveTab] = useState<ProductionDialogTab>("general");
  const form = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: createProductionOrderDefaultValues(),
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
  const activeTabLabel = useMemo(
    () => PRODUCTION_ORDER_TABS.find((tab) => tab.value === activeTab)?.label ?? "General",
    [activeTab],
  );
  const referenceDataStatus = lookupsLoading ? "Loading" : lookupError ? "Limited" : "Ready";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_32px_80px_-48px_rgba(15,23,42,0.42)]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(toProductionOrderPayload(values, machines)))}
          className="flex h-full flex-col overflow-hidden bg-[#eef3f9]"
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProductionDialogTab)} className="flex h-full flex-col">
            <div className="border-b border-slate-200/80 bg-white">
              <div className="px-6 py-6 text-left lg:px-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                      <span className="inline-flex items-center rounded-full border border-[#ffd3b5] bg-[#fff4eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff6b00]">
                        Production Workspace
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>General</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>Materials Info</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span>Maintenance</span>
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-slate-950">New Production Order</h1>
                      <p className="max-w-3xl text-[15px] leading-7 text-slate-500">
                        Configure production details with assignments for materials, stages, output, scrap, cost, and
                        operational resources.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3 py-1.5 text-[#059669]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Existing order info left preserved
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-1.5 text-[#f97316]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Materials input and final order form
                      </span>
                      {form.formState.isDirty ? (
                        <span className="inline-flex items-center rounded-full bg-[#fff8e6] px-3 py-1.5 text-[#b7791f]">
                          Draft changes in progress
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px_132px] xl:grid-cols-[minmax(0,1fr)_120px_120px]">
                    <div className={productionMetricCardClassName}>
                      <FormField
                        control={form.control}
                        name="production_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={productionFieldLabelClassName}>Production ID*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter production order ID" className={productionInputClassName} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Active For</div>
                      <div className="mt-3 inline-flex rounded-full border border-[#bfd3ff] bg-[#eef4ff] px-3 py-1.5 text-sm font-semibold text-[#2d6cdf]">
                        {activeTabLabel}
                      </div>
                    </div>

                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Reference Data</div>
                      <div
                        className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${
                          referenceDataStatus === "Ready"
                            ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]"
                            : referenceDataStatus === "Limited"
                              ? "border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {referenceDataStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-1 lg:px-8">
                <ProductionTabs value={activeTab} onValueChange={setActiveTab} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
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
                <ProductionPlaceholderTab
                  title="Output"
                  description="Finished output capture and packing details will extend this placeholder."
                />
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

            <div className="border-t border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur lg:px-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className={productionHelperTextClassName}>
                  {lookupError ? lookupError : "Form state is controlled locally until the final Create Order submission."}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-slate-200 bg-white px-6 text-slate-700 hover:bg-slate-50"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-full bg-[linear-gradient(135deg,#ff8f1f_0%,#ff6b00_100%)] px-6 text-white shadow-[0_12px_24px_-16px_rgba(255,107,0,0.9)] hover:opacity-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      "Create Order"
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
