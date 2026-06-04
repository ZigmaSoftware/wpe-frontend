import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Columns2, PanelLeftOpen, PanelRightOpen, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  productionCardBaseClassName,
  productionCompactInputClassName,
  productionFieldLabelClassName,
  productionHelperTextClassName,
} from "@/features/production/components/order-dialog/productionOrderFormStyles";
import {
  PRODUCTION_AD_WEIGHTAGE_ROUTE,
  getProductionEditRoute,
  getProductionManageBatchRoute,
  getProductionStageRoute,
} from "@/features/production/utils/routes";
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type {
  BatchWeightEntry,
  ProductionBatch,
  ProductionOrder,
  RegrindEntry,
} from "@/lib/types";
import { toast } from "@/components/ui/sonner";
import { BATCH_STATUS_CLASSES, ORDER_STATUS_CLASSES, StatusBadge, type ProductionBatchExt } from "./productionShared";

const STAGES = ["AD", "BL", "GL"] as const satisfies ReadonlyArray<ProductionBatch["stage"]>;

const STAGE_META: Record<
  ProductionBatch["stage"],
  {
    label: string;
    description: string;
    accentClassName: string;
    mutedClassName: string;
  }
> = {
  AD: {
    label: "Raw Weightage",
    description: "Prepare additive and raw-material weightage for the batch.",
    accentClassName: "border-[#ffd7bf] bg-[#fff4eb] text-[#f97316]",
    mutedClassName: "border-[#ffe8d8] bg-[#fffaf5] text-[#c76d2b]",
  },
  BL: {
    label: "Blending",
    description: "Control mixing, weighment checks, and regrind usage.",
    accentClassName: "border-[#cfe0ff] bg-[#eef4ff] text-[#2d6cdf]",
    mutedClassName: "border-[#dce8ff] bg-[#f8fbff] text-[#496ca8]",
  },
  GL: {
    label: "Granulation",
    description: "Track granulation completion and output verification.",
    accentClassName: "border-[#c6f1d9] bg-[#ecfdf5] text-[#059669]",
    mutedClassName: "border-[#d8f7e6] bg-[#f4fdf8] text-[#2b8a63]",
  },
};

const STAGE_PRODUCTION_TYPE_LABELS: Record<ProductionBatch["stage"], string> = {
  AD: "WPE Additive Production",
  BL: "WPE Blend Production",
  GL: "WPE Granulated Blend Production",
};

const dialogContentClassName =
  "overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-0 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.42)]";
const dialogHeaderClassName = "border-b border-slate-200/75 px-6 py-5 text-left";
const dialogBodyClassName = "px-6 py-6";
const productionDialogTextareaClassName =
  "min-h-[88px] rounded-xl border-slate-200/90 bg-white text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-500 focus-visible:border-[#2d6cdf] focus-visible:ring-[#2d6cdf]/20";

const regrindSchema = z.object({
  item_id: z.number({ required_error: "Item required" }),
  item_display: z.string().default(""),
  quantity_grams: z.string().min(1, "Required"),
  source_lot_no: z.string().default(""),
  notes: z.string().default(""),
  stage: z.enum(STAGES),
});

type RegrindFormValues = z.infer<typeof regrindSchema>;
type BatchSplitView = "left" | "split" | "right";
type ItemOption = { id: number; item_code: string; item_name: string };

const compactHeaderMetricClassName =
  "rounded-lg border border-slate-200/85 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

const ItemSearch = ({ onSelect }: { onSelect: (item: ItemOption) => void }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const searchQ = useQuery({
    queryKey: ["item-search-regrind", query],
    queryFn: async () => {
      if (query.trim().length < 2) return [];
      const response = await coreApi.get<unknown>(
        `/api/items/items/?search=${encodeURIComponent(query)}&page_size=15`,
      );
      return normalizeListResponse<ItemOption>(response.data);
    },
    enabled: query.trim().length >= 2,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search item..."
          className={`pl-9 ${productionCompactInputClassName}`}
        />
      </div>

      {open && (searchQ.data?.length ?? 0) > 0 ? (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
          {searchQ.data!.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col px-4 py-3 text-left text-sm hover:bg-slate-50"
              onMouseDown={() => {
                onSelect(item);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="font-medium text-slate-900">{item.item_name}</span>
              <span className="text-xs text-slate-500">{item.item_code}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const ProductionManageBatchPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orderId: orderIdParam } = useParams();
  const [searchParams] = useSearchParams();

  const orderId = Number(orderIdParam);
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0;
  const routeStage = searchParams.get("stage")?.toUpperCase() ?? "";
  const activeStageFilter = STAGES.includes(routeStage as ProductionBatch["stage"])
    ? (routeStage as ProductionBatch["stage"])
    : null;
  const backRoute = activeStageFilter ? getProductionStageRoute(activeStageFilter) : PRODUCTION_AD_WEIGHTAGE_ROUTE;

  const [detailTab, setDetailTab] = useState<"general" | "movement" | "transactions" | "summary">("general");
  const [viewMode, setViewMode] = useState<BatchSplitView>("split");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [weightEntryOpen, setWeightEntryOpen] = useState(false);
  const [regrindOpen, setRegrindOpen] = useState(false);
  const [weightValues, setWeightValues] = useState<Record<number, string>>({});
  const regrindForm = useForm<RegrindFormValues>({
    resolver: zodResolver(regrindSchema),
    defaultValues: {
      item_id: 0,
      item_display: "",
      quantity_grams: "",
      source_lot_no: "",
      notes: "",
      stage: "AD",
    },
  });

  const orderQ = useQuery({
    queryKey: ["production-order", orderId],
    queryFn: async () => {
      const response = await coreApi.get<ProductionOrder>(`/api/production/production/${orderId}/`);
      return response.data;
    },
    enabled: hasValidOrderId,
  });

  const batchesQ = useQuery({
    queryKey: ["production-batches", orderId, activeStageFilter ?? "all"],
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/orders/${orderId}/batches/`, {
        params: { stage: activeStageFilter ?? undefined },
      });
      return normalizeListResponse<ProductionBatchExt>(response.data);
    },
    enabled: hasValidOrderId,
  });

  const regrindEntriesQ = useQuery({
    queryKey: ["regrind-entries", orderId, selectedBatchId],
    queryFn: async () => {
      const response = await coreApi.get<unknown>(
        `/api/production/orders/${orderId}/batches/${selectedBatchId}/regrind/`,
      );
      return normalizeListResponse<RegrindEntry>(response.data);
    },
    enabled: hasValidOrderId && selectedBatchId !== null && regrindOpen,
  });

  useEffect(() => {
    const batches = batchesQ.data ?? [];

    if (!batches.length) {
      if (selectedBatchId !== null) {
        setSelectedBatchId(null);
      }
      setWeightEntryOpen(false);
      setRegrindOpen(false);
      return;
    }

    if (selectedBatchId && batches.some((batch) => batch.id === selectedBatchId)) {
      return;
    }

    setSelectedBatchId(batches[0].id);
    setWeightEntryOpen(false);
    setRegrindOpen(false);
  }, [batchesQ.data, selectedBatchId]);

  const invalidateProductionContext = () => {
    queryClient.invalidateQueries({ queryKey: ["production-batches", orderId] });
    queryClient.invalidateQueries({ queryKey: ["production-order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    queryClient.invalidateQueries({ queryKey: ["production-stage-records"] });
    queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
  };

  const startBatchMutation = useMutation({
    mutationFn: (batch: ProductionBatchExt) =>
      coreApi.post(`/api/production/orders/${orderId}/batches/${batch.id}/start/`),
    onSuccess: () => {
      toast.success("Batch started.");
      invalidateProductionContext();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to start batch.")),
  });

  const confirmBatchMutation = useMutation({
    mutationFn: (batch: ProductionBatchExt) =>
      coreApi.post(`/api/production/orders/${orderId}/batches/${batch.id}/confirm/`),
    onSuccess: (_, batch) => {
      toast.success("Batch confirmed and completed.");
      setWeightEntryOpen(false);
      invalidateProductionContext();
      if (batch.stage === "AD") {
        navigate(getProductionManageBatchRoute(orderId, "BL"));
      } else if (batch.stage === "BL") {
        navigate(getProductionManageBatchRoute(orderId, "GL"));
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to confirm batch.")),
  });

  const saveWeightMutation = useMutation({
    mutationFn: ({ entry, weight }: { entry: BatchWeightEntry; weight: string }) =>
      coreApi.post(`/api/production/orders/${orderId}/batches/${selectedBatchId}/weights/${entry.id}/`, {
        entered_weight_grams: weight,
      }),
    onSuccess: (_, { entry }) => {
      toast.success(`Weight saved for ${entry.item_name}.`);
      setWeightValues((current) => ({ ...current, [entry.id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["production-batches", orderId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save weight.")),
  });

  const addRegrindMutation = useMutation({
    mutationFn: (values: RegrindFormValues) =>
      coreApi.post(`/api/production/orders/${orderId}/batches/${selectedBatchId}/regrind/`, {
        item_id: values.item_id,
        quantity_grams: values.quantity_grams,
        source_lot_no: values.source_lot_no,
        notes: values.notes,
        stage: values.stage,
      }),
    onSuccess: () => {
      toast.success("Regrind entry added.");
      regrindForm.reset({
        item_id: 0,
        item_display: "",
        quantity_grams: "",
        source_lot_no: "",
        notes: "",
        stage: selectedBatch?.stage ?? "AD",
      });
      queryClient.invalidateQueries({ queryKey: ["regrind-entries", orderId, selectedBatchId] });
      queryClient.invalidateQueries({ queryKey: ["production-batches", orderId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to add regrind.")),
  });

  const openWeightEntry = (batch: ProductionBatchExt) => {
    setSelectedBatchId(batch.id);
    setWeightValues({});
    setWeightEntryOpen(true);
  };

  const openRegrind = (batch: ProductionBatchExt) => {
    setSelectedBatchId(batch.id);
    regrindForm.reset({
      item_id: 0,
      item_display: "",
      quantity_grams: "",
      source_lot_no: "",
      notes: "",
      stage: batch.stage,
    });
    setRegrindOpen(true);
  };

  const allBatches = batchesQ.data ?? [];
  const order = orderQ.data;
  const resolveDisplayBatchNo = (batch?: ProductionBatchExt | null) =>
    batch?.display_batch_no?.trim() || batch?.batch_no || order?.batch_number?.trim() || "Not assigned";
  const resolveBatchStatusLabel = (batch?: ProductionBatchExt | null) =>
    batch?.display_status?.trim() || batch?.status || "-";
  const resolveStageProductionType = (stage?: ProductionBatch["stage"] | null) =>
    (stage ? STAGE_PRODUCTION_TYPE_LABELS[stage] : null) || order?.production_type || "-";
  const selectedBatch = allBatches.find((batch) => batch.id === selectedBatchId) ?? null;
  const displayedBatch = selectedBatch ?? allBatches[0] ?? null;
  const displayedStage = displayedBatch?.stage ?? activeStageFilter ?? null;
  const productionFor = (() => {
    if (!order) return "-";
    const mapped = (order as unknown as Record<string, unknown>).production_for;
    if (typeof mapped === "string" && mapped.trim().length > 0) return mapped;
    return resolveStageProductionType(displayedStage);
  })();
  const displayedStageMeta = displayedBatch ? STAGE_META[displayedBatch.stage] : null;
  const displayedProductionType = resolveStageProductionType(displayedStage);
  const aggregateWeight = allBatches.reduce((total, batch) => total + (batch.total_weight_grams ?? 0), 0);
  const aggregateOkCount = allBatches.reduce(
    (total, batch) => total + (batch.weight_entries ?? []).filter((entry) => entry.is_valid === true).length,
    0,
  );
  const aggregateRejectedCount = allBatches.reduce(
    (total, batch) => total + (batch.weight_entries ?? []).filter((entry) => entry.is_valid === false).length,
    0,
  );
  const selectedTotalWeight = displayedBatch?.total_weight_grams ?? aggregateWeight;
  const okCount = displayedBatch
    ? (displayedBatch.weight_entries ?? []).filter((entry) => entry.is_valid === true).length
    : aggregateOkCount;
  const rejectedCount = displayedBatch
    ? (displayedBatch.weight_entries ?? []).filter((entry) => entry.is_valid === false).length
    : aggregateRejectedCount;
  const currentManageStage: ProductionBatch["stage"] = activeStageFilter ?? displayedStage ?? "AD";
  const detailSubtitle = displayedBatch
    ? `${resolveDisplayBatchNo(displayedBatch)} • ${displayedBatch.stage} — ${displayedStageMeta?.label}`
    : "No batches created for this production order yet";
  const detailMachine = displayedBatch?.machine_name || order?.line_name || "-";
  const detailPlanId = displayedBatch?.production_order ?? orderId;
  const detailBatchValue = displayedBatch
    ? resolveDisplayBatchNo(displayedBatch)
    : order?.batch_number || (allBatches.length > 0 ? `${allBatches.length} linked batch${allBatches.length === 1 ? "" : "es"}` : "-");
  const splitLayoutClassName =
    viewMode === "left"
      ? "xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
      : viewMode === "right"
        ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        : "xl:grid-cols-2";
  const headerActionLabel =
    currentManageStage === "AD" ? "Batch" : currentManageStage === "BL" ? "Bin Assign" : "Bag Assign";
  const backButtonLabel =
    currentManageStage === "AD"
      ? "Back to AD list"
      : currentManageStage === "BL"
        ? "Back to BL list"
        : "Back to Production";
  const pageTitle =
    currentManageStage === "AD"
      ? "AD - Manage Batch"
      : currentManageStage === "BL"
        ? "BL - Manage Batch"
        : "Manage Batches";
  const batchListTitle =
    currentManageStage === "AD"
      ? "AD - Batch List"
      : currentManageStage === "BL"
        ? "BL - Batch List"
        : "Production / Batch List";
  const handleHeaderAction = () =>
    navigate(getProductionEditRoute(orderId), {
      state: {
        backTo: getProductionManageBatchRoute(orderId, currentManageStage),
        ...(currentManageStage === "AD" || currentManageStage === "BL" || currentManageStage === "GL"
          ? {
              initialTab: "output",
              visibleTabs: ["output"],
              outputStage: currentManageStage,
              outputBatchId: currentManageStage === "AD" ? null : displayedBatch?.id ?? selectedBatchId ?? null,
            }
          : {}),
      },
    });

  return (
    <div className="-m-4 min-h-full bg-[#eef3f8] py-2 lg:-m-6 lg:py-3">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-full px-2.5 text-sm font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900"
            onClick={() => navigate(backRoute)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backButtonLabel}
          </Button>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-slate-200/80 bg-white">
            <div className="px-3 py-2.5 sm:px-4 lg:px-5 lg:py-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[1.15rem] font-semibold leading-tight tracking-[-0.02em] text-slate-950 sm:text-[1.25rem]">
                      {pageTitle}
                    </h1>
                    {order ? <StatusBadge status={order.status} classes={ORDER_STATUS_CLASSES} /> : null}
                  </div>
                  <p className="max-w-3xl text-[12px] leading-5 text-slate-500">
                    Create, weigh, confirm, and track AD → BL → GL batches for the selected production order.
                  </p>

                  {order ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center rounded-full bg-[#fff7ed] px-2 py-0.5 font-medium text-[#f97316]">
                        {displayedProductionType}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-2 py-0.5 font-medium text-[#2d6cdf]">
                        Shift: {order.shift}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#ecfdf5] px-2 py-0.5 font-medium text-[#059669]">
                        Batch No: {resolveDisplayBatchNo(displayedBatch)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className={compactHeaderMetricClassName}>
                    <div className={productionFieldLabelClassName}>Production ID</div>
                    <div className="mt-2 font-mono text-base font-semibold text-slate-950">
                      {order ? order.production_id : "--"}
                    </div>
                  </div>

                  <div className={compactHeaderMetricClassName}>
                    <div className={productionFieldLabelClassName}>Production Date</div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {order ? formatDate(order.production_date) : "--"}
                    </div>
                  </div>

                  <div className={compactHeaderMetricClassName}>
                    <div className={productionFieldLabelClassName}>Planned Qty</div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {order ? formatDecimal(order.planned_quantity) : "--"}
                    </div>
                  </div>

                  <div className={compactHeaderMetricClassName}>
                    <div className={productionFieldLabelClassName}>Last Updated</div>
                    <div className="mt-2 text-base font-semibold text-slate-950">
                      {order ? formatDate(order.updated_at) : "--"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#eef3f9] py-4">
              {!hasValidOrderId ? (
                <ErrorState
                  title="Invalid production order"
                  description="The Manage Batch route is missing a valid order identifier."
                  action={
                    <Button variant="outline" onClick={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
                      Return to Production
                    </Button>
                  }
                />
              ) : orderQ.isLoading ? (
                <LoadingState label="Loading production order..." />
              ) : orderQ.isError ? (
                <ErrorState
                  description={getApiErrorMessage(orderQ.error, "Could not load the selected production order.")}
                  action={
                    <Button variant="outline" onClick={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
                      Return to Production
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4 px-4 sm:px-5 lg:px-6">
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-1 rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur">
                      {([
                        { value: "left", label: "Left focused", Icon: PanelLeftOpen },
                        { value: "split", label: "Split view", Icon: Columns2 },
                        { value: "right", label: "Right focused", Icon: PanelRightOpen },
                      ] as const).map((option) => {
                        const isActive = viewMode === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-label={option.label}
                            title={option.label}
                            className={`group relative flex h-9 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
                              isActive
                                ? "border-slate-900 bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.9)]"
                                : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                            onClick={() => setViewMode(option.value)}
                          >
                            <option.Icon className={`h-[1.05rem] w-[1.05rem] ${isActive ? "" : "transition-transform duration-200 group-hover:scale-105"}`} strokeWidth={2.1} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`grid gap-4 ${splitLayoutClassName}`}>
                    <div className={`${productionCardBaseClassName} overflow-hidden bg-white`}>
                      <div className="border-b border-slate-200/70 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-[15px] font-semibold leading-tight text-slate-950">{batchListTitle}</h2>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {activeStageFilter
                                ? `Select a ${activeStageFilter} batch from the list to review its details.`
                                : "Select a batch from the list to review its details."}
                            </p>
                          </div>
                          <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {allBatches.length}
                          </span>
                        </div>
                      </div>

                      {allBatches.length === 0 ? (
                        <div className="p-4">
                          <EmptyState title="No batches created" description="Create a new batch to start the production workflow." />
                        </div>
                      ) : (
                        <div className="max-h-[720px] overflow-auto">
                            <Table>
                            <TableHeader className="bg-slate-50/90">
                              <TableRow>
                                <TableHead>Prd ID</TableHead>
                                <TableHead>Batch ID</TableHead>
                                <TableHead>Production Status</TableHead>
                                <TableHead>Start Date Time</TableHead>
                                <TableHead>Ended Date Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allBatches.map((batch) => {
                                const isSelected = displayedBatch?.id === batch.id;
                                const stageMeta = STAGE_META[batch.stage];

                                return (
                                  <TableRow
                                    key={batch.id}
                                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? "bg-[#eef4ff]" : ""}`}
                                    onClick={() => setSelectedBatchId(batch.id)}
                                  >
                                    <TableCell className="align-top font-mono text-[12px] text-slate-600">
                                      {order?.production_id ?? "-"}
                                    </TableCell>
                                    <TableCell className="align-top">
                                      <div className="text-[12px] font-semibold text-slate-900">{resolveDisplayBatchNo(batch)}</div>
                                      <div className="mt-1 text-[11px] text-slate-500">
                                        {batch.stage} — {stageMeta.label}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge status={resolveBatchStatusLabel(batch)} classes={BATCH_STATUS_CLASSES} />
                                    </TableCell>
                                    <TableCell className="text-[12px] text-slate-600">{formatDateTime(batch.started_at)}</TableCell>
                                    <TableCell className="text-[12px] text-slate-600">{formatDateTime(batch.completed_at)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className={`${productionCardBaseClassName} overflow-hidden bg-white`}>
                      <div className="border-b border-slate-200/70 px-4 py-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-[15px] font-semibold leading-tight text-slate-950">
                                {order?.production_id ?? "-"} / {productionFor}
                              </h2>
                              {displayedBatch ? (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${displayedStageMeta?.accentClassName}`}>
                                  {displayedBatch.stage}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-500">{detailSubtitle}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-md px-3 text-xs"
                              onClick={handleHeaderAction}
                            >
                              {currentManageStage === "AD" || currentManageStage === "BL" ? (
                                <Plus className="mr-2 h-3.5 w-3.5" />
                              ) : null}
                              {headerActionLabel}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as typeof detailTab)}>
                        <div className="border-b border-slate-200/70 px-4 py-2">
                          <TabsList className="h-10 rounded-lg bg-slate-100 p-1">
                            <TabsTrigger value="general" className="h-8 px-3 text-[11px]">General</TabsTrigger>
                            <TabsTrigger value="movement" className="h-8 px-3 text-[11px]">Material Movement</TabsTrigger>
                            <TabsTrigger value="transactions" className="h-8 px-3 text-[11px]">PRDN Transactions</TabsTrigger>
                            <TabsTrigger value="summary" className="h-8 px-3 text-[11px]">Summary</TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="general" className="m-0 p-4">
                          {!displayedBatch ? (
                            <EmptyState
                              title="No batch selected"
                              description="Create a new batch, then select it from the left-side list to review details."
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                                <div className="flex items-center gap-2 text-[12px] text-slate-600">
                                  <span>Batch Status:</span>
                                  <StatusBadge status={resolveBatchStatusLabel(displayedBatch)} classes={BATCH_STATUS_CLASSES} />
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {displayedBatch.status === "PENDING" ? (
                                    <Button
                                      size="sm"
                                      className="h-8 rounded-md bg-[#2d6cdf] px-2.5 text-xs text-white hover:bg-[#255fc8]"
                                      onClick={() => startBatchMutation.mutate(displayedBatch)}
                                      disabled={startBatchMutation.isPending}
                                    >
                                      Start
                                    </Button>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
                                <div className="rounded-lg border border-slate-200/80">
                                  <div className="border-b border-slate-200/70 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-800">
                                    Production Order: <StatusBadge status={order?.status ?? "PLANNED"} classes={ORDER_STATUS_CLASSES} />
                                  </div>
                                  <div className="grid grid-cols-[200px_minmax(0,1fr)] text-[12px] leading-5">
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Finished Goods / Production For</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2 font-medium text-slate-900">{productionFor}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Production Type</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{displayedProductionType}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Production Status</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{order?.status?.replace(/_/g, " ") || "-"}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Batch</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{detailBatchValue}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Production Date</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{order ? formatDate(order.production_date) : "-"}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Shift</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{order?.shift || "-"}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Line No / Machine</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{detailMachine}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Start Date Time</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{displayedBatch.started_at ? formatDateTime(displayedBatch.started_at) : (order?.start_date_time ? formatDateTime(order.start_date_time) : "-")}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Plan ID</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{detailPlanId}</div>
                                    <div className="border-b border-r border-slate-200/70 px-3 py-2 text-slate-600">Planned Qty</div>
                                    <div className="border-b border-slate-200/70 px-3 py-2">{order ? formatDecimal(order.planned_quantity) : "-"}</div>
                                    <div className="border-r border-slate-200/70 px-3 py-2 text-slate-600">Total Weight</div>
                                    <div className="px-3 py-2">{formatDecimal(selectedTotalWeight)} g</div>
                                  </div>
                                </div>

                                <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4">
                                  <div className="mb-3 text-[12px] font-semibold text-slate-900">Totals</div>
                                  <div className="space-y-2 text-[12px]">
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>Plan Qty</span><span className="font-semibold">{order ? formatDecimal(order.planned_quantity) : "-"}</span></div>
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>Prdn Qty</span><span className="font-semibold">{order ? formatDecimal(order.total_quantity) : "-"}</span></div>
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>Total Weight</span><span className="font-semibold">{formatDecimal(selectedTotalWeight)}</span></div>
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>OK</span><span className="font-semibold text-emerald-700">{okCount}</span></div>
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>Rejected</span><span className="font-semibold text-red-600">{rejectedCount}</span></div>
                                    <div className="flex items-center justify-between rounded bg-white px-3 py-2"><span>Stacked</span><span className="font-semibold">-</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="movement" className="m-0 p-4">
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-[12px] text-slate-500">
                            Material Movement will be added for the {displayedStageMeta?.label.toLowerCase() ?? "selected batch"} workspace in the next step.
                          </div>
                        </TabsContent>
                        <TabsContent value="transactions" className="m-0 p-4">
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-[12px] text-slate-500">
                            PRDN Transactions will be added for the {displayedStageMeta?.label.toLowerCase() ?? "selected batch"} workspace in the next step.
                          </div>
                        </TabsContent>
                        <TabsContent value="summary" className="m-0 p-4">
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-[12px] text-slate-500">
                            Summary will be added for the {displayedStageMeta?.label.toLowerCase() ?? "selected batch"} workspace in the next step.
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <Dialog open={weightEntryOpen} onOpenChange={(open) => !open && setWeightEntryOpen(false)}>
        <DialogContent className={`max-w-4xl ${dialogContentClassName}`}>
          <DialogHeader className={dialogHeaderClassName}>
            <DialogTitle className="text-xl font-semibold text-slate-950">
              Weight Entries — {resolveDisplayBatchNo(selectedBatch)}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Stage: {selectedBatch?.stage} · BOM: {selectedBatch?.bom_variant_name ?? "None"} · Status:{" "}
              {selectedBatch ? <StatusBadge status={resolveBatchStatusLabel(selectedBatch)} classes={BATCH_STATUS_CLASSES} /> : "--"}
            </DialogDescription>
          </DialogHeader>

          <div className={dialogBodyClassName}>
            <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white">
              {(selectedBatch?.weight_entries ?? []).length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No weight entries" description="This batch has no BOM components linked." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Target (g)</TableHead>
                      <TableHead className="text-right">Min (g)</TableHead>
                      <TableHead className="text-right">Max (g)</TableHead>
                      <TableHead className="text-right">Entered (g)</TableHead>
                      <TableHead>Valid</TableHead>
                      {selectedBatch?.status === "IN_PROGRESS" ? <TableHead className="w-40">Enter Weight</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBatch?.weight_entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm font-medium">{entry.item_name}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.item_code}</TableCell>
                        <TableCell className="text-right">{entry.target_weight_grams}</TableCell>
                        <TableCell className="text-right text-slate-500">{entry.min_weight_grams}</TableCell>
                        <TableCell className="text-right text-slate-500">{entry.max_weight_grams}</TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.entered_weight_grams ?? <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          {entry.is_valid === true ? (
                            <span className="text-xs font-medium text-green-600">Valid</span>
                          ) : entry.is_valid === false ? (
                            <span className="text-xs font-medium text-red-600" title={entry.validation_notes}>
                              Invalid
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        {selectedBatch?.status === "IN_PROGRESS" ? (
                          <TableCell>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                className={`h-9 w-24 text-xs ${productionCompactInputClassName}`}
                                placeholder="grams"
                                value={weightValues[entry.id] ?? ""}
                                onChange={(event) =>
                                  setWeightValues((current) => ({
                                    ...current,
                                    [entry.id]: event.target.value,
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                className="h-9 rounded-xl px-3 text-xs"
                                disabled={!weightValues[entry.id] || saveWeightMutation.isPending}
                                onClick={() => saveWeightMutation.mutate({ entry, weight: weightValues[entry.id] })}
                              >
                                Save
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {selectedBatch?.status === "IN_PROGRESS" ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/75 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {selectedBatch.all_weights_valid ? "All weights valid — ready to confirm." : "Some weights are missing or invalid."}
                </p>
                <Button
                  className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                  disabled={confirmBatchMutation.isPending}
                  onClick={() => confirmBatchMutation.mutate(selectedBatch)}
                >
                  Confirm Batch
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={regrindOpen} onOpenChange={(open) => !open && setRegrindOpen(false)}>
        <DialogContent className={`max-w-3xl ${dialogContentClassName}`}>
          <DialogHeader className={dialogHeaderClassName}>
            <DialogTitle className="text-xl font-semibold text-slate-950">
              Regrind Material — {resolveDisplayBatchNo(selectedBatch)}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Add LDPE/HDPE regrind material entries for this batch.
            </DialogDescription>
          </DialogHeader>

          <div className={`${dialogBodyClassName} space-y-5`}>
            <Form {...regrindForm}>
              <form
                onSubmit={regrindForm.handleSubmit((values) => addRegrindMutation.mutate(values))}
                className="rounded-[24px] border border-slate-200/90 bg-[#f8fbff] p-5"
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-950">Add Regrind Entry</h3>
                  <p className="mt-1 text-sm text-slate-500">Keep the current batch workflow and payload exactly as-is.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormItem>
                    <FormLabel className={productionFieldLabelClassName}>Item</FormLabel>
                    <ItemSearch
                      onSelect={(item) => {
                        regrindForm.setValue("item_id", item.id);
                        regrindForm.setValue("item_display", `${item.item_name} (${item.item_code})`);
                      }}
                    />
                    {regrindForm.watch("item_display") ? (
                      <p className={productionHelperTextClassName}>{regrindForm.watch("item_display")}</p>
                    ) : null}
                  </FormItem>

                  <FormField
                    control={regrindForm.control}
                    name="quantity_grams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Quantity (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className={productionCompactInputClassName} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regrindForm.control}
                    name="source_lot_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Source Lot No</FormLabel>
                        <FormControl>
                          <Input {...field} className={productionCompactInputClassName} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regrindForm.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={productionFieldLabelClassName}>Stage</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={productionCompactInputClassName}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AD">AD</SelectItem>
                            <SelectItem value="BL">BL</SelectItem>
                            <SelectItem value="GL">GL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={regrindForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className={productionFieldLabelClassName}>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} className={productionDialogTextareaClassName} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#2d6cdf] text-white hover:bg-[#255fc8]"
                    disabled={addRegrindMutation.isPending || !regrindForm.watch("item_id")}
                  >
                    Add Regrind
                  </Button>
                </div>
              </form>
            </Form>

            <div className="rounded-[24px] border border-slate-200/90 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-950">Existing Entries</h3>
                <p className="mt-1 text-sm text-slate-500">Recorded regrind entries for the selected batch.</p>
              </div>

              {regrindEntriesQ.isLoading ? (
                <LoadingState label="Loading regrind entries..." />
              ) : (regrindEntriesQ.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-500">No regrind entries yet.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty (g)</TableHead>
                        <TableHead>Lot No</TableHead>
                        <TableHead>Valid</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Added At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regrindEntriesQ.data?.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{entry.item_name}</TableCell>
                          <TableCell>{entry.quantity_grams}</TableCell>
                          <TableCell>{entry.source_lot_no || "—"}</TableCell>
                          <TableCell>
                            {entry.is_valid ? (
                              <span className="text-xs font-medium text-green-600">Valid</span>
                            ) : (
                              <span className="text-xs font-medium text-red-600" title={entry.validation_notes}>
                                Invalid
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{entry.added_by_username ?? "—"}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(entry.added_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionManageBatchPage;
