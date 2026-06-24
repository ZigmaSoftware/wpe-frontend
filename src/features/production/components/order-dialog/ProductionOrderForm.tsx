import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Menu, RefreshCw } from "lucide-react";
import { Suspense, lazy, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import type { LookupOption } from "@/features/admin-master/types";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { coreApi } from "@/lib/api";
import type { ProductionBatch, ProductionMachine } from "@/lib/types";
import type { LookupItem } from "@/features/wpe-masters/types";
import GeneralTab from "./GeneralTab";
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
  orderId?: number | null;
  formTitle?: string;
  submitLabel?: string;
  defaultProductionType?: string;
  entryStage?: ProductionBatch["stage"] | null;
  fixedProductionFacility?: NamedOption;
  defaultWorkCenterName?: string;
  initialTab?: ProductionDialogTab;
  visibleTabs?: ProductionDialogTab[];
  outputContext?: {
    stage?: ProductionBatch["stage"] | null;
    batchId?: number | null;
    requireFinalCaptureConfirmation?: boolean;
  };
  showFooterActions?: boolean;
};

const MaterialsTab = lazy(() => import("./MaterialsTab"));
const StagesTab = lazy(() => import("./StagesTab"));
const OutputTab = lazy(() => import("./OutputTab"));
const ScrapTab = lazy(() => import("./ScrapTab"));
const CostTab = lazy(() => import("./CostTab"));
const ResourcesTab = lazy(() => import("./ResourcesTab"));

const DEFAULT_PRODUCTION_TYPE = "WPE Additive Production";
const DEFAULT_PRODUCTION_TYPE_BY_STAGE: Record<ProductionBatch["stage"], string> = {
  AD: "WPE Additive Production",
  BL: "WPE Blend Production",
  GL: "WPE Granulated Blend Production",
  PR: "WPE Production Line",
};
const REQUIRED_PRODUCTION_TYPE_OPTIONS = Object.values(DEFAULT_PRODUCTION_TYPE_BY_STAGE);

const mapNamedOptions = (items: LookupItem[]) =>
  items
    .map((item) => ({
      id: String(item.id ?? "").trim(),
      name: String(item.name ?? "").trim(),
    }))
    .filter((item) => item.id.length > 0 && item.name.length > 0);

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

export const mapProductionTypeOptions = (items: LookupItem[]): ProductionTypeOption[] =>
  {
    const options: ProductionTypeOption[] = items
      .filter((item) => {
        const id = String(item.id ?? "").trim();
        const name = String(item.name ?? "").trim();
        return id.length > 0 && name.length > 0 && name.toLowerCase() !== "all";
      })
      .map((item) => ({
        id: String(item.id).trim(),
        value: String(item.name).trim(),
        label: String(item.name).trim(),
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
  const validLocations = locations.filter((location) => String(location.id ?? "").trim() && String(location.name ?? "").trim());
  const nonWorkCenterLocations = validLocations.filter((location) => !/work center/i.test(String(location.name ?? "")));
  const source = nonWorkCenterLocations.length > 0 ? nonWorkCenterLocations : validLocations;
  return mapNamedOptions(source);
};

export const buildWorkCenterOptions = (locations: LookupOption[], workCenters: LookupOption[]) => {
  const explicitWorkCenters = mapNamedOptions(workCenters);
  if (explicitWorkCenters.length > 0) {
    return explicitWorkCenters;
  }

  const locationWorkCenters = locations.filter((location) => /work center/i.test(String(location.name ?? "")));
  return mapNamedOptions(locationWorkCenters);
};


export const buildInchargeOptions = (users: LookupOption[]): NamedOption[] =>
  users
    .filter((user) => String(user.id).trim().length > 0 && (user.name?.trim().length || user.username?.trim().length))
    .map((user) => ({
      id: String(user.id),
      name:
        user.staff_code?.trim() && user.name?.trim()
          ? `${user.staff_code.trim()} - ${user.name.trim()}`
          : user.staff_code?.trim() || user.name?.trim() || user.username?.trim() || `User ${user.id}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

const ProductionTabLoadingState = ({ label }: { label: string }) => (
  <div className="rounded-[28px] border border-slate-200/85 bg-white/90 px-5 py-10 text-center shadow-[0_28px_64px_-54px_rgba(15,23,42,0.36)] backdrop-blur">
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading {label} section...
    </div>
  </div>
);

const ProductionOrderForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  machines,
  machinesLoading = false,
  initialValues,
  orderId = null,
  formTitle,
  submitLabel,
  defaultProductionType = DEFAULT_PRODUCTION_TYPE,
  entryStage = null,
  fixedProductionFacility,
  defaultWorkCenterName,
  initialTab,
  visibleTabs,
  outputContext,
  showFooterActions = true,
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
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const form = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: initialValues ?? createProductionOrderDefaultValues(),
  });

  const locationsQuery = useQuery({
    queryKey: ["production-order-form", "locations"],
    queryFn: () => wpeMastersApi.locations.lookup(),
    staleTime: 5 * 60 * 1000,
  });

  const workCentresQuery = useQuery({
    queryKey: ["production-order-form", "work-centres"],
    queryFn: async () => {
      const res = await coreApi.get<LookupItem[]>("/api/production/work-centre-creations/lookup/");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ["production-order-form", "user-creation-options"],
    queryFn: adminMasterApi.lookupUserCreationSelectOptions,
    staleTime: 5 * 60 * 1000,
  });

  const productionTypesQuery = useQuery({
    queryKey: ["production-order-form", "production-types"],
    queryFn: () => wpeMastersApi.productionTypes.lookup(),
    staleTime: 5 * 60 * 1000,
  });

  const isCreateMode = !initialValues;

  const nextCodeQuery = useQuery({
    queryKey: ["production-order-next-code", entryStage ?? "default"],
    queryFn: async () => {
      const res = await coreApi.get<{ code: string }>("/api/production/production/next-code/", {
        params: { stage: entryStage ?? undefined },
      });
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
    if (!isCreateMode || entryStage === null) {
      return;
    }

    if (form.getValues("stage") !== entryStage) {
      form.setValue("stage", entryStage, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (form.getValues("next_workflow_stage") !== "-") {
      form.setValue("next_workflow_stage", "-", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [entryStage, form, isCreateMode]);

  useEffect(() => {
    if (!enabledTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(initialActiveTab);
    }
  }, [activeTab, enabledTabs, initialActiveTab]);

  useEffect(() => {
    setMobileSectionsOpen(false);
  }, [activeTab]);

  const productionDate = useWatch({ control: form.control, name: "resources.production_date" }) ?? "";
  const shift = useWatch({ control: form.control, name: "resources.shift" }) ?? "";
  const productionType = useWatch({ control: form.control, name: "production_type" }) ?? "";
  const productionId = useWatch({ control: form.control, name: "production_id" }) ?? "";

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
    () => (fixedProductionFacility ? [fixedProductionFacility] : buildFacilityOptions(locationsQuery.data ?? [])),
    [fixedProductionFacility, locationsQuery.data],
  );

  const workCenterOptions = useMemo(
    () => buildWorkCenterOptions(locationsQuery.data ?? [], workCentresQuery.data ?? []),
    [locationsQuery.data, workCentresQuery.data],
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
    if (!fixedProductionFacility) {
      return;
    }

    if (form.getValues("resources.production_facility") === fixedProductionFacility.id) {
      return;
    }

    form.setValue("resources.production_facility", fixedProductionFacility.id, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [fixedProductionFacility, form]);

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
    workCentresQuery.isLoading ||
    usersQuery.isLoading ||
    productionTypesQuery.isLoading;
  const lookupError =
    locationsQuery.isError || workCentresQuery.isError || usersQuery.isError || productionTypesQuery.isError
      ? "Some reference lookups could not be loaded. The form stays usable, but some selections may be limited."
      : null;

  const resolvedTitle = formTitle ?? "New Production Order";
  const resolvedSubmitLabel = submitLabel ?? "Create Production Order";
  const showSectionNavigation = enabledTabs.length > 1;
  const activeTabLabel = enabledTabs.find((tab) => tab.value === activeTab)?.label ?? "Section";
  const handleTabChange = useCallback((value: ProductionDialogTab) => {
    startTransition(() => {
      setActiveTab(value);
    });
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralTab
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
            lockedStage={entryStage}
          />
        );
      case "materials":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Materials" />}>
            <MaterialsTab form={form} isActive />
          </Suspense>
        );
      case "stages":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Stages" />}>
            <StagesTab />
          </Suspense>
        );
      case "output":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Output" />}>
            <OutputTab form={form} context={outputContext} isActive />
          </Suspense>
        );
      case "scrap":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Scrap" />}>
            <ScrapTab />
          </Suspense>
        );
      case "cost":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Cost" />}>
            <CostTab />
          </Suspense>
        );
      case "resources":
        return (
          <Suspense fallback={<ProductionTabLoadingState label="Resources" />}>
            <ResourcesTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(toProductionOrderPayload(values, machines)))}
          className="flex min-h-full flex-col"
        >
          <div className="flex min-h-full flex-col gap-6">
            <div className="rounded-[32px] border border-slate-200/85 bg-white/90 px-5 py-5 shadow-[0_34px_80px_-58px_rgba(15,23,42,0.38)] backdrop-blur sm:px-6 lg:px-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {showSectionNavigation ? (
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.35)] transition-colors hover:border-slate-300 hover:text-slate-900 lg:hidden"
                      aria-label="Open section navigation"
                      onClick={() => setMobileSectionsOpen(true)}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  ) : null}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] shadow-[0_18px_32px_-28px_rgba(37,99,235,0.7)]">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {showSectionNavigation ? (
                        <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                          {activeTabLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                        {resolvedTitle}
                      </h1>
                      <p className="text-sm text-slate-500">
                        Revamped fullscreen production form with section-based navigation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`w-full max-w-full ${showSectionNavigation ? "xl:max-w-[340px]" : "xl:max-w-[380px]"}`}>
                  <div className="space-y-3">
                    <div className={productionMetricCardClassName}>
                      <FormField
                        control={form.control}
                        name="production_id"
                        render={({ field }) => (
                          <FormItem>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <FormLabel className={productionFieldLabelClassName}>Production ID*</FormLabel>
                              <span className="text-[11px] font-medium text-slate-400">
                                {productionId?.trim() ? "Generated" : "Pending"}
                              </span>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  placeholder={isCreateMode && nextCodeQuery.isLoading ? "Generating..." : "Generated production order ID"}
                                  className={productionCompactInputClassName}
                                  disabled
                                  readOnly
                                />

                                {isCreateMode ? (
                                  <button
                                    type="button"
                                    title="Regenerate ID"
                                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 transition-colors hover:text-slate-700"
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
                </div>
              </div>
            </div>

            {showSectionNavigation ? (
                <Sheet open={mobileSectionsOpen} onOpenChange={setMobileSectionsOpen}>
                  <SheetContent side="left" className="w-[288px] border-slate-200 bg-white p-0 sm:max-w-[288px]">
                    <SheetHeader className="border-b border-slate-200 px-5 py-4 text-left">
                      <SheetTitle className="text-base font-semibold text-slate-950">Production Sections</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 py-4">
                      <ProductionTabs value={activeTab} onValueChange={handleTabChange} tabs={enabledTabs} />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : null}

            <div className={`grid gap-6 ${showSectionNavigation ? "lg:grid-cols-[248px_minmax(0,1fr)]" : ""}`}>
              {showSectionNavigation ? (
                <aside className="hidden lg:block">
                  <div className="sticky top-5 overflow-hidden rounded-[28px] border border-slate-200/85 bg-white/90 shadow-[0_28px_64px_-54px_rgba(15,23,42,0.36)] backdrop-blur">
                    <div className="border-b border-slate-200/80 px-5 py-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Sections</div>
                      <p className="mt-2 text-sm text-slate-500">Navigate each area of the production form from here.</p>
                    </div>
                    <div className="px-3 py-3">
                      <ProductionTabs value={activeTab} onValueChange={handleTabChange} tabs={enabledTabs} />
                    </div>
                  </div>
                </aside>
              ) : null}

              <div className="min-w-0">
                {renderActiveTab()}
              </div>
            </div>

            {showFooterActions ? (
              <div className="sticky bottom-0 z-20 -mx-1 border-t border-slate-200/85 bg-white/95 px-1 pb-1 pt-4 backdrop-blur">
                <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_24px_48px_-42px_rgba(15,23,42,0.4)] sm:px-5 lg:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-800 hover:bg-slate-50"
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
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductionOrderForm;
