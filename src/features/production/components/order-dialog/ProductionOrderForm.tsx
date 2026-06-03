import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LookupItem } from "@/features/wpe-masters/types";
import { coreApi } from "@/lib/api";
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
  PRODUCTION_ORDER_TABS,
  productionOrderFormSchema,
  toProductionOrderPayload,
  type CreateProductionOrderPayload,
  type NamedOption,
  type ProductionDialogTab,
  type ProductionOrderFormValues,
  type ProductionTypeOption,
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
  defaultProductionType?: string;
  defaultWorkCenterName?: string;
  initialTab?: ProductionDialogTab;
  visibleTabs?: ProductionDialogTab[];
};

const DEFAULT_PRODUCTION_TYPE = "WPE Additive Production";
const REQUIRED_PRODUCTION_TYPE_OPTIONS = [DEFAULT_PRODUCTION_TYPE, "WPE Blend Production"] as const;

const mapNamedOptions = (items: LookupItem[]) =>
  items.map((item) => ({
    id: String(item.id),
    name: item.name,
  }));

const formatProductionTypeLabel = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return value;
  }

  if (/^[A-Z0-9_]+$/.test(normalized)) {
    return normalized
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  }

  return normalized;
};

const mapProductionTypeOptions = (items: LookupItem[]): ProductionTypeOption[] =>
  {
    const options: ProductionTypeOption[] = items
      .filter((item) => {
        const name = item.name.trim();
        return name.length > 0 && name.toLowerCase() !== "all";
      })
      .map((item) => ({
        id: String(item.id),
        value: item.name,
        label: item.name,
      }));

    const knownValues = new Set(options.map((option) => option.value.trim().toLowerCase()));
    REQUIRED_PRODUCTION_TYPE_OPTIONS.forEach((requiredValue) => {
      if (knownValues.has(requiredValue.toLowerCase())) {
        return;
      }

      options.push({
        id: `fallback-production-type-${requiredValue.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        value: requiredValue,
        label: requiredValue,
        description: "Fallback production type",
      });
    });

    return options;
  };

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

export const buildInchargeOptions = (users: LookupItem[]): NamedOption[] =>
  users
    .filter((user) => String(user.id).trim().length > 0 && (user.name?.trim().length || user.username?.trim().length))
    .map((user) => ({
      id: String(user.id),
      name: user.name?.trim() || user.username?.trim() || `User ${user.id}`,
      description: user.username?.trim() || undefined,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

const ProductionOrderForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  machines,
  machinesLoading = false,
  initialValues,
  formTitle,
  submitLabel,
  defaultProductionType = DEFAULT_PRODUCTION_TYPE,
  defaultWorkCenterName,
  initialTab,
  visibleTabs,
}: ProductionOrderFormProps) => {
  const enabledTabs = useMemo(
    () => (visibleTabs?.length ? PRODUCTION_ORDER_TABS.filter((tab) => visibleTabs.includes(tab.value)) : PRODUCTION_ORDER_TABS),
    [visibleTabs],
  );
  const initialActiveTab = useMemo<ProductionDialogTab>(
    () =>
      (initialTab && enabledTabs.some((tab) => tab.value === initialTab) ? initialTab : enabledTabs[0]?.value) ?? "general",
    [enabledTabs, initialTab],
  );
  const [activeTab, setActiveTab] = useState<ProductionDialogTab>(initialActiveTab);
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
    queryFn: () => wpeMastersApi.users.lookup(),
  });

  const productionTypesQuery = useQuery({
    queryKey: ["production-order-form", "production-types"],
    queryFn: () => wpeMastersApi.productionTypes.lookup(),
  });

  const isCreateMode = !initialValues;

  const nextCodeQuery = useQuery({
    queryKey: ["production-order-next-code"],
    queryFn: async () => {
      const res = await coreApi.get<{ code: string }>("/api/production/production/next-code/");
      return res.data.code;
    },
    enabled: isCreateMode,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isCreateMode && nextCodeQuery.data && !form.getValues("production_id")) {
      form.setValue("production_id", nextCodeQuery.data, { shouldDirty: false });
    }
  }, [isCreateMode, nextCodeQuery.data, form]);

  useEffect(() => {
    if (!enabledTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(initialActiveTab);
    }
  }, [activeTab, enabledTabs, initialActiveTab]);

  const productionDate = form.watch("resources.production_date");
  const shift = form.watch("resources.shift");
  const productionType = form.watch("production_type");

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
    () => buildInchargeOptions(usersQuery.data ?? []),
    [usersQuery.data],
  );

  const productionTypeOptions = useMemo(() => {
    const options = mapProductionTypeOptions(productionTypesQuery.data ?? []);
    const currentValue = productionType.trim();
    if (!currentValue || currentValue.toLowerCase() === "all" || options.some((option) => option.value === currentValue)) {
      return options;
    }

    return [
      {
        id: `current-production-type-${currentValue}`,
        value: currentValue,
        label: formatProductionTypeLabel(currentValue),
        description: "Current saved production type",
      },
      ...options,
    ];
  }, [productionType, productionTypesQuery.data]);

  const defaultProductionTypeOption = useMemo(
    () =>
      productionTypeOptions.find(
        (option) => option.value.trim().toLowerCase() === defaultProductionType.toLowerCase(),
      ) ?? productionTypeOptions[0],
    [defaultProductionType, productionTypeOptions],
  );

  useEffect(() => {
    const currentValue = productionType.trim();
    if ((currentValue && currentValue.toLowerCase() !== "all") || !defaultProductionTypeOption) {
      return;
    }

    form.setValue("production_type", defaultProductionTypeOption.value, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [defaultProductionTypeOption, form, productionType]);

  useEffect(() => {
    if (!defaultWorkCenterName) {
      return;
    }

    const currentWorkCenter = form.getValues("resources.work_center").trim();
    if (currentWorkCenter) {
      return;
    }

    const matchingWorkCenter = workCenterOptions.find(
      (option) => option.name.trim().toLowerCase() === defaultWorkCenterName.trim().toLowerCase(),
    );
    if (!matchingWorkCenter) {
      return;
    }

    form.setValue("resources.work_center", matchingWorkCenter.id, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [defaultWorkCenterName, form, workCenterOptions]);

  const lookupsLoading =
    locationsQuery.isLoading ||
    warehousesQuery.isLoading ||
    usersQuery.isLoading ||
    productionTypesQuery.isLoading;
  const lookupError =
    locationsQuery.isError || warehousesQuery.isError || usersQuery.isError || productionTypesQuery.isError
      ? "Some reference lookups could not be loaded. The form stays usable, but some selections may be limited."
      : null;

  const resolvedTitle = formTitle ?? "New Production Order";
  const resolvedSubmitLabel = submitLabel ?? "Create Production Order";

  return (
    <div className="flex min-h-full flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(toProductionOrderPayload(values, machines)))}
          className="flex min-h-full flex-col"
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ProductionDialogTab)}
            className="flex min-h-full flex-col gap-4"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px] xl:items-start">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ffd9c1] bg-[#fff3eb] text-[#ff6b00] shadow-[0_18px_32px_-28px_rgba(255,107,0,0.7)]">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-slate-950">
                    {resolvedTitle}
                  </h1>
                </div>
              </div>

                  <div className={productionMetricCardClassName}>
                    <FormField
                      control={form.control}
                      name="production_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={productionFieldLabelClassName}>Production ID*</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder={isCreateMode && nextCodeQuery.isLoading ? "Generating..." : "Enter production order ID"}
                                className={productionCompactInputClassName}
                                disabled={isCreateMode && nextCodeQuery.isLoading}
                              />
                              
                              {isCreateMode ? (
                                <button
                                  type="button"
                                  title="Regenerate ID"
                                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                  onClick={() => {
                                    nextCodeQuery.refetch().then((result) => {
                                      if (result.data) form.setValue("production_id", result.data, { shouldDirty: true });
                                    });
                                  }}
                                >
                                  <RefreshCw className={`h-3.5 w-3.5 ${nextCodeQuery.isLoading ? "animate-spin" : ""}`} />
                                </button>
                              ) : null}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              </div>

            {enabledTabs.length > 1 ? (
              <div className="rounded-[24px] border border-slate-200/90 bg-white px-4 shadow-[0_26px_54px_-48px_rgba(15,23,42,0.32)] sm:px-5 lg:px-6">
                <ProductionTabs value={activeTab} onValueChange={setActiveTab} tabs={enabledTabs} />
              </div>
            ) : null}

            <div className="flex-1">
              <TabsContent value="general" className="mt-0 outline-none">
                <ProductionGeneralTab
                  form={form}
                  productionTypeOptions={productionTypeOptions}
                  facilityOptions={facilityOptions}
                  workCenterOptions={workCenterOptions}
                  inchargeOptions={inchargeOptions}
                  machines={machines}
                  productionTypesLoading={productionTypesQuery.isLoading}
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
              <TabsContent value="output" forceMount className="mt-0 outline-none">
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

            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_26px_54px_-48px_rgba(15,23,42,0.32)] sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="h-11 rounded-2xl bg-[linear-gradient(135deg,#ff8f1f_0%,#ff6b00_100%)] px-6 text-[15px] font-semibold text-white shadow-[0_22px_34px_-24px_rgba(255,107,0,0.95)] hover:opacity-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {`${resolvedSubmitLabel}...`}
                  </>
                ) : (
                  resolvedSubmitLabel
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default ProductionOrderForm;
