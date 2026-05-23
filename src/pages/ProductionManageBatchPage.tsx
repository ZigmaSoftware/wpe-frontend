import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
  productionMetricCardClassName,
} from "@/features/production/components/order-dialog/productionOrderFormStyles";
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type {
  BatchWeightEntry,
  BOMVariant,
  ProductionBatch,
  ProductionMachine,
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
    label: "Raw Mix",
    description: "Prepare additive and raw-material mix for the batch.",
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

const dialogContentClassName =
  "overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-0 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.42)]";
const dialogHeaderClassName = "border-b border-slate-200/75 px-6 py-5 text-left";
const dialogBodyClassName = "px-6 py-6";
const productionDialogTextareaClassName =
  "min-h-[88px] rounded-xl border-slate-200/90 bg-white text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-300 focus-visible:border-[#2d6cdf] focus-visible:ring-[#2d6cdf]/20";

const batchSchema = z.object({
  stage: z.enum(STAGES),
  bom_variant: z.number().nullable().default(null),
  machine: z.number().nullable().default(null),
  notes: z.string().default(""),
});

type BatchFormValues = z.infer<typeof batchSchema>;

const regrindSchema = z.object({
  item_id: z.number({ required_error: "Item required" }),
  item_display: z.string().default(""),
  quantity_grams: z.string().min(1, "Required"),
  source_lot_no: z.string().default(""),
  notes: z.string().default(""),
  stage: z.enum(STAGES),
});

type RegrindFormValues = z.infer<typeof regrindSchema>;
type ItemOption = { id: number; item_code: string; item_name: string };

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

  const orderId = Number(orderIdParam);
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0;

  const [activeStage, setActiveStage] = useState<ProductionBatch["stage"]>("AD");
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [weightEntryOpen, setWeightEntryOpen] = useState(false);
  const [regrindOpen, setRegrindOpen] = useState(false);
  const [weightValues, setWeightValues] = useState<Record<number, string>>({});

  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { stage: "AD", bom_variant: null, machine: null, notes: "" },
  });
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

  const machinesQ = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      const response = await coreApi.get<unknown>("/api/production/machines/");
      return normalizeListResponse<ProductionMachine>(response.data);
    },
  });

  const bomVariantsQ = useQuery({
    queryKey: ["bom-variants"],
    queryFn: async () => {
      const response = await coreApi.get<unknown>("/api/production/bom-variants/");
      return normalizeListResponse<BOMVariant>(response.data);
    },
  });

  const batchesQ = useQuery({
    queryKey: ["production-batches", orderId],
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/orders/${orderId}/batches/`);
      return normalizeListResponse<ProductionBatchExt>(response.data);
    },
    enabled: hasValidOrderId,
  });

  const selectedBatch = (batchesQ.data ?? []).find((batch) => batch.id === selectedBatchId) ?? null;

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
    if (!batchesQ.data?.length) return;
    if ((batchesQ.data ?? []).some((batch) => batch.stage === activeStage)) return;

    const nextStage = STAGES.find((stage) => (batchesQ.data ?? []).some((batch) => batch.stage === stage));
    if (nextStage) {
      setActiveStage(nextStage);
    }
  }, [activeStage, batchesQ.data]);

  useEffect(() => {
    if (!selectedBatchId || !batchesQ.data) return;
    if ((batchesQ.data ?? []).some((batch) => batch.id === selectedBatchId)) return;

    setSelectedBatchId(null);
    setWeightEntryOpen(false);
    setRegrindOpen(false);
  }, [batchesQ.data, selectedBatchId]);

  const invalidateProductionContext = () => {
    queryClient.invalidateQueries({ queryKey: ["production-batches", orderId] });
    queryClient.invalidateQueries({ queryKey: ["production-order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
  };

  const createBatchMutation = useMutation({
    mutationFn: (values: BatchFormValues) =>
      coreApi.post(`/api/production/orders/${orderId}/batches/`, {
        stage: values.stage,
        bom_variant: values.bom_variant ?? undefined,
        machine: values.machine ?? undefined,
        notes: values.notes,
      }),
    onSuccess: (_, values) => {
      toast.success("Batch created.");
      setCreateBatchOpen(false);
      batchForm.reset({ stage: values.stage, bom_variant: null, machine: null, notes: "" });
      invalidateProductionContext();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create batch.")),
  });

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
    onSuccess: () => {
      toast.success("Batch confirmed and completed.");
      setWeightEntryOpen(false);
      invalidateProductionContext();
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

  const batchesByStage = (stage: ProductionBatch["stage"]) =>
    (batchesQ.data ?? []).filter((batch) => batch.stage === stage);

  const order = orderQ.data;

  return (
    <div className="-m-4 min-h-full bg-[#eef3f8] p-4 lg:-m-6 lg:p-6">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full px-3 text-slate-600 hover:bg-white hover:text-slate-900"
            onClick={() => navigate("/app/production")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Production
          </Button>
        </div>

        <div className="min-h-[calc(100vh-9rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_32px_80px_-48px_rgba(15,23,42,0.42)]">
            <div className="border-b border-slate-200/80 bg-white">
              <div className="px-6 py-6 lg:px-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                      <span className="inline-flex items-center rounded-full border border-[#cfe0ff] bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2d6cdf]">
                        Production Workspace
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>Production</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span>Manage Batch</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-slate-950">Manage Batches</h1>
                        {order ? <StatusBadge status={order.status} classes={ORDER_STATUS_CLASSES} /> : null}
                      </div>
                      <p className="max-w-3xl text-[15px] leading-7 text-slate-500">
                        Create, weigh, confirm, and track AD → BL → GL batches for the selected production order without leaving the
                        Production workspace.
                      </p>
                    </div>

                    {order ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center rounded-full bg-[#fff7ed] px-3 py-1.5 font-medium text-[#f97316]">
                          {order.production_type}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#eef4ff] px-3 py-1.5 font-medium text-[#2d6cdf]">
                          Shift: {order.shift}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#ecfdf5] px-3 py-1.5 font-medium text-[#059669]">
                          Batch No: {order.batch_number || "Not assigned"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Production ID</div>
                      <div className="mt-3 font-mono text-lg font-semibold text-slate-950">
                        {order ? order.production_id : "--"}
                      </div>
                    </div>

                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Production Date</div>
                      <div className="mt-3 text-lg font-semibold text-slate-950">
                        {order ? formatDate(order.production_date) : "--"}
                      </div>
                    </div>

                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Planned Qty</div>
                      <div className="mt-3 text-lg font-semibold text-slate-950">
                        {order ? formatDecimal(order.planned_quantity) : "--"}
                      </div>
                    </div>

                    <div className={productionMetricCardClassName}>
                      <div className={productionFieldLabelClassName}>Last Updated</div>
                      <div className="mt-3 text-lg font-semibold text-slate-950">
                        {order ? formatDate(order.updated_at) : "--"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#eef3f9] px-4 py-5 sm:px-6 lg:px-8">
              {!hasValidOrderId ? (
                <ErrorState
                  title="Invalid production order"
                  description="The Manage Batch route is missing a valid order identifier."
                  action={
                    <Button variant="outline" onClick={() => navigate("/app/production")}>
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
                    <Button variant="outline" onClick={() => navigate("/app/production")}>
                      Return to Production
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                    <div className="grid gap-3 md:grid-cols-3">
                      {STAGES.map((stage) => {
                        const stageBatches = batchesByStage(stage);
                        const stageMeta = STAGE_META[stage];

                        return (
                          <div key={stage} className={productionMetricCardClassName}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className={productionFieldLabelClassName}>{stage}</div>
                                <div className="mt-2 text-lg font-semibold text-slate-950">
                                  {stageMeta.label}
                                </div>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageMeta.accentClassName}`}>
                                {stageBatches.length}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-500">{stageMeta.description}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        className="h-11 rounded-xl bg-[#2d6cdf] px-5 text-white shadow-[0_18px_35px_-20px_rgba(45,108,223,0.85)] hover:bg-[#255fc8]"
                        onClick={() => {
                          batchForm.reset({ stage: activeStage, bom_variant: null, machine: null, notes: "" });
                          setCreateBatchOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Batch
                      </Button>
                    </div>
                  </div>

                  {batchesQ.isLoading ? (
                    <LoadingState label="Loading batches..." />
                  ) : batchesQ.isError ? (
                    <ErrorState description="Could not load batches." />
                  ) : (
                    <div className={`${productionCardBaseClassName} bg-[#f7faff]`}>
                      <Tabs
                        value={activeStage}
                        onValueChange={(value) => setActiveStage(value as ProductionBatch["stage"])}
                        className="flex flex-col"
                      >
                        <div className="border-b border-slate-200/75 px-5 py-4">
                          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-[#e8eef7] p-1">
                            {STAGES.map((stage) => {
                              const stageMeta = STAGE_META[stage];

                              return (
                                <TabsTrigger
                                  key={stage}
                                  value={stage}
                                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
                                >
                                  {stage} — {stageMeta.label} ({batchesByStage(stage).length})
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </div>

                        <div className="px-5 py-5">
                          {STAGES.map((stage) => (
                            <TabsContent key={stage} value={stage} className="mt-0 outline-none">
                              {batchesByStage(stage).length === 0 ? (
                                <EmptyState
                                  title={`No ${stage} batches`}
                                  description="Create a batch using the New Batch button above."
                                />
                              ) : (
                                <div className="space-y-4">
                                  {batchesByStage(stage).map((batch) => {
                                    const stageMeta = STAGE_META[batch.stage];

                                    return (
                                      <div
                                        key={batch.id}
                                        className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.38)]"
                                      >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                          <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <p className="font-mono text-base font-semibold text-slate-950">
                                                {batch.batch_no}
                                              </p>
                                              <span
                                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${stageMeta.mutedClassName}`}
                                              >
                                                {batch.stage} · {stageMeta.label}
                                              </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                              <span>Machine: {batch.machine_name || "Not assigned"}</span>
                                              <span>BOM: {batch.bom_variant_name || "None"}</span>
                                              <span>Total: {batch.total_weight_grams ?? "0"}g</span>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge status={batch.status} classes={BATCH_STATUS_CLASSES} />

                                            {batch.status === "PENDING" ? (
                                              <Button
                                                size="sm"
                                                className="rounded-xl bg-[#2d6cdf] text-white hover:bg-[#255fc8]"
                                                onClick={() => startBatchMutation.mutate(batch)}
                                                disabled={startBatchMutation.isPending}
                                              >
                                                Start
                                              </Button>
                                            ) : null}

                                            {batch.status === "IN_PROGRESS" ? (
                                              <>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="rounded-xl"
                                                  onClick={() => openWeightEntry(batch)}
                                                >
                                                  Weigh
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="rounded-xl"
                                                  onClick={() => openRegrind(batch)}
                                                >
                                                  Regrind
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                                                  onClick={() => confirmBatchMutation.mutate(batch)}
                                                  disabled={confirmBatchMutation.isPending}
                                                >
                                                  Confirm
                                                </Button>
                                              </>
                                            ) : null}

                                            {batch.status === "COMPLETED" ? (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl"
                                                onClick={() => openWeightEntry(batch)}
                                              >
                                                View Weights
                                              </Button>
                                            ) : null}
                                          </div>
                                        </div>

                                        {batch.weight_entries.length > 0 ? (
                                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                            {batch.weight_entries.map((entry) => (
                                              <div
                                                key={entry.id}
                                                className={`rounded-2xl border px-3 py-3 text-sm ${
                                                  entry.is_valid === true
                                                    ? "border-green-200 bg-green-50"
                                                    : entry.is_valid === false
                                                      ? "border-red-200 bg-red-50"
                                                      : "border-slate-200 bg-slate-50"
                                                }`}
                                              >
                                                <p className="truncate font-medium text-slate-900">{entry.item_name}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                  {entry.entered_weight_grams ? `${entry.entered_weight_grams}g` : "—"} /{" "}
                                                  {entry.target_weight_grams}g
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TabsContent>
                          ))}
                        </div>
                      </Tabs>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={createBatchOpen} onOpenChange={(open) => !open && setCreateBatchOpen(false)}>
        <DialogContent className={`max-w-xl ${dialogContentClassName}`}>
          <DialogHeader className={dialogHeaderClassName}>
            <DialogTitle className="text-xl font-semibold text-slate-950">Create New Batch</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              For order: <span className="font-medium text-slate-700">{order?.production_id ?? "--"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className={dialogBodyClassName}>
            <Form {...batchForm}>
              <form
                onSubmit={batchForm.handleSubmit((values) => {
                  setActiveStage(values.stage);
                  createBatchMutation.mutate(values);
                })}
                className="space-y-4"
              >
                <FormField
                  control={batchForm.control}
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
                          <SelectItem value="AD">AD — Raw Mix</SelectItem>
                          <SelectItem value="BL">BL — Blending</SelectItem>
                          <SelectItem value="GL">GL — Granulation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="bom_variant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={productionFieldLabelClassName}>BOM Variant</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className={productionCompactInputClassName}>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(bomVariantsQ.data ?? []).map((bom) => (
                            <SelectItem key={bom.id} value={String(bom.id)}>
                              {bom.variant_code} — {bom.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className={productionHelperTextClassName}>Optional. Keeps the existing payload structure unchanged.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="machine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={productionFieldLabelClassName}>Machine</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className={productionCompactInputClassName}>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(machinesQ.data ?? []).map((machine) => (
                            <SelectItem key={machine.id} value={String(machine.id)}>
                              {machine.machine_code} — {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={batchForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={productionFieldLabelClassName}>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} className={productionDialogTextareaClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateBatchOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#2d6cdf] text-white hover:bg-[#255fc8]"
                    disabled={createBatchMutation.isPending}
                  >
                    Create Batch
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={weightEntryOpen} onOpenChange={(open) => !open && setWeightEntryOpen(false)}>
        <DialogContent className={`max-w-4xl ${dialogContentClassName}`}>
          <DialogHeader className={dialogHeaderClassName}>
            <DialogTitle className="text-xl font-semibold text-slate-950">
              Weight Entries — {selectedBatch?.batch_no}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Stage: {selectedBatch?.stage} · BOM: {selectedBatch?.bom_variant_name ?? "None"} · Status:{" "}
              {selectedBatch ? <StatusBadge status={selectedBatch.status} classes={BATCH_STATUS_CLASSES} /> : "--"}
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
              Regrind Material — {selectedBatch?.batch_no}
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
