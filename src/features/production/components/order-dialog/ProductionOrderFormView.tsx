import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Suspense, lazy, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import type { LookupOption } from "@/features/admin-master/types";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { coreApi } from "@/lib/api";
import type { ProductionBatch, ProductionMachine } from "@/lib/types";
import type { LookupItem } from "@/features/wpe-masters/types";
import GeneralTab from "./GeneralTab";
import ProductionFormFooter from "./ProductionFormFooter";
import ProductionFormHeader from "./ProductionFormHeader";
import ProductionSectionSidebar from "./ProductionSectionSidebar";
import {
  buildActualStartDateTimeValue,
  createProductionOrderDefaultValues,
  formatDateTimeLabel,
  PRODUCTION_ORDER_TABS,
  productionOrderFormSchema,
  SHIFT_VALUES,
  toProductionOrderPayload,
  type CreateProductionOrderPayload,
  type NamedOption,
  type ProductionDialogTab,
  type ProductionOrderFormValues,
  type ProductionTypeOption,
} from "./productionOrderForm";

type ProductionOrderFormProps = {
  onSubmit: (payload: CreateProductionOrderPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  machines: ProductionMachine[];
  machinesLoading?: boolean;
  initialValues?: ProductionOrderFormValues;
  orderId?: number | null;
  formTitle?: string;
  formSubtitle?: string;
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

const SHIFT_INCHARGE_DEPARTMENT_BY_STAGE: Record<ProductionBatch["stage"], string> = {
  AD: "Blending",
  BL: "Blending",
  GL: "Production",
  PR: "Production",
};
const DEFAULT_SHIFT_INCHARGE_DEPARTMENT = SHIFT_INCHARGE_DEPARTMENT_BY_STAGE.AD;

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
  <div className="rounded-[22px] border border-[#e7e9ee] bg-white px-5 py-10 text-center shadow-[0_16px_36px_-30px_rgba(15,23,42,0.16)]">
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
  formSubtitle,
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

  const watchedStage = useWatch({ control: form.control, name: "stage" });
  const currentStage = (watchedStage || entryStage) as ProductionBatch["stage"] | undefined;
  const shiftInchargeDepartment = currentStage
    ? SHIFT_INCHARGE_DEPARTMENT_BY_STAGE[currentStage] ?? DEFAULT_SHIFT_INCHARGE_DEPARTMENT
    : DEFAULT_SHIFT_INCHARGE_DEPARTMENT;

  const usersQuery = useQuery({
    queryKey: ["production-order-form", "user-creation-options", shiftInchargeDepartment],
    queryFn: () => adminMasterApi.lookupUserCreationSelectOptions(shiftInchargeDepartment),
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
    const validShift = SHIFT_VALUES.includes(shift as (typeof SHIFT_VALUES)[number])
      ? (shift as (typeof SHIFT_VALUES)[number])
      : SHIFT_VALUES[0];
    form.setValue(
      "details.actual_start_time",
      formatDateTimeLabel(buildActualStartDateTimeValue(productionDate, validShift)),
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
  const resolvedSubtitle =
    formSubtitle ??
    (orderId ? "Review and update the selected production order." : "Create and plan a new production order.");
  const resolvedSubmitLabel = submitLabel ?? "Create Production Order";
  const showSectionNavigation = enabledTabs.length > 1;
  const activeTabLabel = enabledTabs.find((tab) => tab.value === activeTab)?.label ?? "Section";
  const productionIdStatus: "Pending" | "Generated" | "Saved" = !productionId.trim()
    ? "Pending"
    : isCreateMode
      ? "Generated"
      : "Saved";
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
            <MaterialsTab form={form} isActive stage={entryStage} />
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
          <div className="flex min-h-full flex-col gap-4">
            <ProductionFormHeader
              title={resolvedTitle}
              subtitle={resolvedSubtitle}
              activeSectionLabel={activeTabLabel}
              showSectionNavigation={showSectionNavigation}
              onOpenNavigation={() => setMobileSectionsOpen(true)}
              productionId={productionId}
              productionIdStatus={productionIdStatus}
              isCreateMode={isCreateMode}
              isRegeneratingId={nextCodeQuery.isLoading}
              onRegenerateId={
                isCreateMode
                  ? () => {
                      nextCodeQuery.refetch().then((result) => {
                        if (result.data) {
                          form.setValue("production_id", result.data, { shouldDirty: true });
                        }
                      });
                    }
                  : undefined
              }
            />

            {showSectionNavigation ? (
                <Sheet open={mobileSectionsOpen} onOpenChange={setMobileSectionsOpen}>
                  <SheetContent side="left" className="w-[288px] border-[#d8e0e8] bg-[#e7ecf1] p-0 sm:max-w-[288px]">
                    <SheetHeader className="border-b border-[#e7e9ee] bg-white px-5 py-4 text-left">
                      <SheetTitle className="text-base font-semibold text-slate-950">Production Sections</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 py-4">
                      <ProductionSectionSidebar
                        value={activeTab}
                        onValueChange={handleTabChange}
                        tabs={enabledTabs}
                        compact
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : null}

            <div className={`grid gap-4 ${showSectionNavigation ? "lg:grid-cols-[226px_minmax(0,1fr)]" : ""}`}>
              {showSectionNavigation ? (
                <aside className="hidden lg:block">
                  <div className="sticky top-5 h-[calc(100vh-9.5rem)]">
                    <ProductionSectionSidebar
                      value={activeTab}
                      onValueChange={handleTabChange}
                      tabs={enabledTabs}
                      className="h-full"
                    />
                  </div>
                </aside>
              ) : null}

              <div className="min-w-0">
                {renderActiveTab()}
              </div>
            </div>

            {showFooterActions ? (
              <ProductionFormFooter
                onCancel={onCancel}
                isSubmitting={isSubmitting}
                submitLabel={resolvedSubmitLabel}
              />
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductionOrderForm;
