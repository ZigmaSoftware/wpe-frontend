import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
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
  toProductionOrderPayload,
  type CreateProductionOrderPayload,
  type NamedOption,
  type ProductionDialogTab,
  type ProductionOrderFormValues,
} from "./productionOrderForm";

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
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-[#f3f6fa] shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(toProductionOrderPayload(values, machines)))}
          className="flex h-full flex-col overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProductionDialogTab)} className="flex h-full flex-col">
            <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8fbfd_0%,#f2f6fb_100%)]">
              <div className="px-6 py-5 text-left lg:px-8">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-slate-900">
                          Production Workspace
                        </Badge>
                        <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600">
                          General + Materials tabs implemented
                        </Badge>
                        {form.formState.isDirty ? (
                          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                            Unsaved changes
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-slate-500 hover:bg-white hover:text-slate-900"
                        onClick={onCancel}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-3xl font-semibold text-slate-950">{formTitle ?? "New Production Order"}</h1>
                      <p className="max-w-3xl text-sm text-slate-500">
                        Structured ERP-style production order creation with staged tabs for materials, stages, output, scrap,
                        cost, and resources.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                        <FileText className="h-3.5 w-3.5" />
                        Existing create-order API preserved
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Materials stay local until final Create Order
                      </span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="production_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-700">Production ID*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter production order ID" className="h-11 rounded-xl border-slate-200 bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active Tab</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Reference Data</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {lookupsLoading ? "Loading..." : lookupError ? "Limited" : "Ready"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5 lg:px-8">
                <ProductionTabs value={activeTab} onValueChange={setActiveTab} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
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

            <div className="border-t border-slate-200/80 bg-white/90 px-6 py-4 lg:px-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-slate-500">
                  {lookupError ? lookupError : "Form state is controlled locally until the final Create Order submission."}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting}>
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
