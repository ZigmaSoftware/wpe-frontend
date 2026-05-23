import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
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
import { coreApi } from "@/lib/api";
import { formatDate, formatDateTime, formatDecimal, getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { BatchWeightEntry, BOMVariant, ProductionBatch, ProductionMachine, ProductionOrder, RegrindEntry } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── Extended types ─────────────────────────────────────────────────────────────

type ProductionBatchExt = ProductionBatch & {
  bom_variant_code?: string | null;
  total_weight_grams?: number;
  all_weights_valid?: boolean;
};

type DashboardData = {
  planned: number;
  in_progress: number;
  completed: number;
  closed: number;
  total_machines: number;
  total_bom_variants: number;
};

// ── Status badges ──────────────────────────────────────────────────────────────

const ORDER_STATUS_CLASSES: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PLAN_COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const BATCH_STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status, classes }: { status: string; classes: Record<string, string> }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes[status] ?? "bg-gray-100 text-gray-700"}`}>
    {status.replace(/_/g, " ")}
  </span>
);

// ── Create batch form ──────────────────────────────────────────────────────────

const batchSchema = z.object({
  stage: z.enum(["AD", "BL", "GL"]),
  bom_variant: z.number().nullable().default(null),
  machine: z.number().nullable().default(null),
  notes: z.string().default(""),
});
type BatchFormValues = z.infer<typeof batchSchema>;

// ── Regrind form ───────────────────────────────────────────────────────────────

const regrindSchema = z.object({
  item_id: z.number({ required_error: "Item required" }),
  item_display: z.string().default(""),
  quantity_grams: z.string().min(1, "Required"),
  source_lot_no: z.string().default(""),
  notes: z.string().default(""),
  stage: z.enum(["AD", "BL", "GL"]),
});
type RegrindFormValues = z.infer<typeof regrindSchema>;

// ── Item search for regrind ────────────────────────────────────────────────────

type ItemOption = { id: number; item_code: string; item_name: string };

const ItemSearch = ({ onSelect }: { onSelect: (item: ItemOption) => void }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const searchQ = useQuery({
    queryKey: ["item-search-regrind", q],
    queryFn: async () => {
      if (q.trim().length < 2) return [];
      const res = await coreApi.get<unknown>(`/api/items/items/?search=${encodeURIComponent(q)}&page_size=15`);
      return normalizeListResponse<ItemOption>(res.data);
    },
    enabled: q.trim().length >= 2,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search item..." className="pl-9" />
      </div>
      {open && (searchQ.data?.length ?? 0) > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {searchQ.data!.map((item) => (
            <button key={item.id} type="button" className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent text-sm" onMouseDown={() => { onSelect(item); setQ(""); setOpen(false); }}>
              <span className="font-medium">{item.item_name}</span>
              <span className="text-xs text-muted-foreground">{item.item_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const ProductionPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [batchesOpen, setBatchesOpen] = useState(false);

  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatchExt | null>(null);
  const [weightEntryOpen, setWeightEntryOpen] = useState(false);
  const [regrindOpen, setRegrindOpen] = useState(false);

  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeTarget, setRecipeTarget] = useState<BOMVariant | null>(null);
  const [recipePassword, setRecipePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recipe, setRecipe] = useState<BOMVariant | null>(null);

  const [weightValues, setWeightValues] = useState<Record<number, string>>({});

  const batchForm = useForm<BatchFormValues>({ resolver: zodResolver(batchSchema), defaultValues: { stage: "AD", bom_variant: null, machine: null, notes: "" } });
  const regrindForm = useForm<RegrindFormValues>({ resolver: zodResolver(regrindSchema), defaultValues: { item_id: 0, item_display: "", quantity_grams: "", source_lot_no: "", notes: "", stage: "AD" } });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const dashQ = useQuery({
    queryKey: ["production-dashboard"],
    queryFn: async () => {
      const res = await coreApi.get<{ data: DashboardData } | DashboardData>("/api/production/dashboard/");
      const p = res.data as { data?: DashboardData } & DashboardData;
      return (p.data ?? p) as DashboardData;
    },
  });

  const ordersQ = useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/production/");
      return normalizeListResponse<ProductionOrder>(res.data);
    },
  });

  const machinesQ = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/machines/");
      return normalizeListResponse<ProductionMachine>(res.data);
    },
  });

  const bomVariantsQ = useQuery({
    queryKey: ["bom-variants"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/bom-variants/");
      return normalizeListResponse<BOMVariant>(res.data);
    },
  });

  const batchesQ = useQuery({
    queryKey: ["production-batches", selectedOrder?.id],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(`/api/production/orders/${selectedOrder!.id}/batches/`);
      return normalizeListResponse<ProductionBatchExt>(res.data);
    },
    enabled: !!selectedOrder,
  });

  const regrindEntriesQ = useQuery({
    queryKey: ["regrind-entries", selectedOrder?.id, selectedBatch?.id],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(`/api/production/orders/${selectedOrder!.id}/batches/${selectedBatch!.id}/regrind/`);
      return normalizeListResponse<RegrindEntry>(res.data);
    },
    enabled: !!selectedOrder && !!selectedBatch && regrindOpen,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createBatchMutation = useMutation({
    mutationFn: (values: BatchFormValues) =>
      coreApi.post(`/api/production/orders/${selectedOrder!.id}/batches/`, {
        stage: values.stage,
        bom_variant: values.bom_variant ?? undefined,
        machine: values.machine ?? undefined,
        notes: values.notes,
      }),
    onSuccess: () => {
      toast.success("Batch created.");
      setCreateBatchOpen(false);
      batchForm.reset({ stage: "AD", bom_variant: null, machine: null, notes: "" });
      queryClient.invalidateQueries({ queryKey: ["production-batches", selectedOrder?.id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to create batch.")),
  });

  const startBatchMutation = useMutation({
    mutationFn: (batch: ProductionBatchExt) =>
      coreApi.post(`/api/production/orders/${selectedOrder!.id}/batches/${batch.id}/start/`),
    onSuccess: () => {
      toast.success("Batch started.");
      queryClient.invalidateQueries({ queryKey: ["production-batches", selectedOrder?.id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to start batch.")),
  });

  const confirmBatchMutation = useMutation({
    mutationFn: (batch: ProductionBatchExt) =>
      coreApi.post(`/api/production/orders/${selectedOrder!.id}/batches/${batch.id}/confirm/`),
    onSuccess: () => {
      toast.success("Batch confirmed and completed.");
      setWeightEntryOpen(false);
      queryClient.invalidateQueries({ queryKey: ["production-batches", selectedOrder?.id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to confirm batch.")),
  });

  const saveWeightMutation = useMutation({
    mutationFn: ({ entry, weight }: { entry: BatchWeightEntry; weight: string }) =>
      coreApi.post(
        `/api/production/orders/${selectedOrder!.id}/batches/${selectedBatch!.id}/weights/${entry.id}/`,
        { entered_weight_grams: weight }
      ),
    onSuccess: (_, { entry }) => {
      toast.success(`Weight saved for ${entry.item_name}.`);
      setWeightValues((prev) => ({ ...prev, [entry.id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["production-batches", selectedOrder?.id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to save weight.")),
  });

  const addRegrindMutation = useMutation({
    mutationFn: (values: RegrindFormValues) =>
      coreApi.post(`/api/production/orders/${selectedOrder!.id}/batches/${selectedBatch!.id}/regrind/`, {
        item_id: values.item_id,
        quantity_grams: values.quantity_grams,
        source_lot_no: values.source_lot_no,
        notes: values.notes,
        stage: values.stage,
      }),
    onSuccess: () => {
      toast.success("Regrind entry added.");
      regrindForm.reset({ item_id: 0, item_display: "", quantity_grams: "", source_lot_no: "", notes: "", stage: selectedBatch?.stage ?? "AD" });
      queryClient.invalidateQueries({ queryKey: ["regrind-entries", selectedOrder?.id, selectedBatch?.id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to add regrind.")),
  });

  const verifyRecipeMutation = useMutation({
    mutationFn: async () => {
      const res = await coreApi.post<{ data: BOMVariant }>(`/api/production/bom-variants/${recipeTarget!.id}/recipe/`, { password: recipePassword });
      return res.data.data ?? res.data;
    },
    onSuccess: (data) => {
      setRecipe(data as BOMVariant);
      setRecipePassword("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Invalid password.")),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const openBatches = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setBatchesOpen(true);
  };

  const openWeightEntry = (batch: ProductionBatchExt) => {
    setSelectedBatch(batch);
    setWeightValues({});
    setWeightEntryOpen(true);
  };

  const openRegrind = (batch: ProductionBatchExt) => {
    setSelectedBatch(batch);
    regrindForm.reset({ item_id: 0, item_display: "", quantity_grams: "", source_lot_no: "", notes: "", stage: batch.stage });
    setRegrindOpen(true);
  };

  const openRecipe = (bom: BOMVariant) => {
    setRecipeTarget(bom);
    setRecipe(null);
    setRecipePassword("");
    setRecipeOpen(true);
  };

  const filteredOrders = (ordersQ.data ?? []).filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return [o.production_id, o.production_type, o.batch_number ?? ""].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  const batchesByStage = (stage: "AD" | "BL" | "GL") =>
    (batchesQ.data ?? []).filter((b) => b.stage === stage);

  const dash = dashQ.data;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Manage production orders, batches, and weighment entries."
        actions={<Button onClick={() => navigate("/app/production/neworder")}><Plus className="mr-2 h-4 w-4" />New Order</Button>}
      />

      {/* Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Planned" value={dash?.planned ?? 0} />
        <StatCard label="In Progress" value={dash?.in_progress ?? 0} />
        <StatCard label="Completed" value={dash?.completed ?? 0} />
        <StatCard label="BOM Variants" value={dash?.total_bom_variants ?? 0} />
      </div>

      {/* BOM Variants quick view */}
      {(bomVariantsQ.data?.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">BOM Variants</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {bomVariantsQ.data!.map((bom) => (
              <button
                key={bom.id}
                onClick={() => openRecipe(bom)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{bom.variant_code}</span>
                <span className="text-muted-foreground">{bom.name}</span>
                <Badge variant="outline" className="ml-1 text-xs">{bom.component_count ?? 0} components</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search production ID, type, batch..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PLANNED">Planned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PLAN_COMPLETED">Completed</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {ordersQ.isLoading && <LoadingState label="Loading production orders..." />}
      {ordersQ.isError && <ErrorState description="Could not load production orders." />}

      {!ordersQ.isLoading && !ordersQ.isError && (
        filteredOrders.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Production ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Planned Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, i) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{order.production_id}</TableCell>
                    <TableCell>{order.production_type}</TableCell>
                    <TableCell>{formatDate(order.production_date)}</TableCell>
                    <TableCell>{order.shift}</TableCell>
                    <TableCell>{formatDecimal(order.planned_quantity)}</TableCell>
                    <TableCell><StatusBadge status={order.status} classes={ORDER_STATUS_CLASSES} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openBatches(order)}>
                          Manage Batches
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/app/production/${order.id}/edit`)}>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No production orders" description="Create a new order to begin tracking production batches." />
        )
      )}

      {/* ── Batch management dialog ── */}
      <Dialog open={batchesOpen} onOpenChange={(open) => { if (!open) setBatchesOpen(false); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Batches — {selectedOrder?.production_id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && <StatusBadge status={selectedOrder.status} classes={ORDER_STATUS_CLASSES} />}
              &nbsp; Manage AD → BL → GL batches for this production order.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => { batchForm.reset({ stage: "AD", bom_variant: null, machine: null, notes: "" }); setCreateBatchOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" />New Batch
            </Button>
          </div>

          {batchesQ.isLoading && <LoadingState label="Loading batches..." />}
          {batchesQ.isError && <ErrorState description="Could not load batches." />}

          {!batchesQ.isLoading && !batchesQ.isError && (
            <Tabs defaultValue="AD" className="mt-2">
              <TabsList>
                <TabsTrigger value="AD">AD — Raw Mix ({batchesByStage("AD").length})</TabsTrigger>
                <TabsTrigger value="BL">BL — Blending ({batchesByStage("BL").length})</TabsTrigger>
                <TabsTrigger value="GL">GL — Granulation ({batchesByStage("GL").length})</TabsTrigger>
              </TabsList>

              {(["AD", "BL", "GL"] as const).map((stage) => (
                <TabsContent key={stage} value={stage} className="max-h-[60vh] overflow-y-auto">
                  {batchesByStage(stage).length === 0 ? (
                    <EmptyState title={`No ${stage} batches`} description="Create a batch using the New Batch button above." />
                  ) : (
                    <div className="space-y-3">
                      {batchesByStage(stage).map((batch) => (
                        <div key={batch.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="space-y-0.5">
                              <p className="font-mono text-sm font-medium">{batch.batch_no}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {batch.machine_name && <span>Machine: {batch.machine_name}</span>}
                                {batch.bom_variant_name && <span>· BOM: {batch.bom_variant_name}</span>}
                                {batch.total_weight_grams !== undefined && <span>· Total: {batch.total_weight_grams}g</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusBadge status={batch.status} classes={BATCH_STATUS_CLASSES} />
                              {batch.status === "PENDING" && (
                                <Button size="sm" onClick={() => startBatchMutation.mutate(batch)} disabled={startBatchMutation.isPending}>
                                  Start
                                </Button>
                              )}
                              {batch.status === "IN_PROGRESS" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openWeightEntry(batch)}>Weigh</Button>
                                  <Button size="sm" variant="outline" onClick={() => openRegrind(batch)}>Regrind</Button>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmBatchMutation.mutate(batch)} disabled={confirmBatchMutation.isPending}>
                                    Confirm
                                  </Button>
                                </>
                              )}
                              {batch.status === "COMPLETED" && (
                                <Button size="sm" variant="outline" onClick={() => openWeightEntry(batch)}>View Weights</Button>
                              )}
                            </div>
                          </div>
                          {/* Compact weight summary */}
                          {batch.weight_entries.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
                              {batch.weight_entries.map((we) => (
                                <div key={we.id} className={`rounded px-2 py-1 text-xs ${we.is_valid === true ? "bg-green-50 border border-green-200" : we.is_valid === false ? "bg-red-50 border border-red-200" : "bg-slate-50 border"}`}>
                                  <p className="font-medium truncate">{we.item_name}</p>
                                  <p className="text-muted-foreground">
                                    {we.entered_weight_grams ? `${we.entered_weight_grams}g` : "—"} / {we.target_weight_grams}g
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create Batch dialog ── */}
      <Dialog open={createBatchOpen} onOpenChange={(open) => { if (!open) setCreateBatchOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>For order: {selectedOrder?.production_id}</DialogDescription>
          </DialogHeader>
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit((v) => createBatchMutation.mutate(v))} className="space-y-4">
              <FormField control={batchForm.control} name="stage" render={({ field }) => (
                <FormItem><FormLabel>Stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="AD">AD — Raw Mix</SelectItem>
                      <SelectItem value="BL">BL — Blending</SelectItem>
                      <SelectItem value="GL">GL — Granulation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={batchForm.control} name="bom_variant" render={({ field }) => (
                <FormItem><FormLabel>BOM Variant (optional)</FormLabel>
                  <Select value={field.value ? String(field.value) : "none"} onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(bomVariantsQ.data ?? []).map((bom) => (
                        <SelectItem key={bom.id} value={String(bom.id)}>{bom.variant_code} — {bom.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={batchForm.control} name="machine" render={({ field }) => (
                <FormItem><FormLabel>Machine (optional)</FormLabel>
                  <Select value={field.value ? String(field.value) : "none"} onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(machinesQ.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.machine_code} — {m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={batchForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateBatchOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createBatchMutation.isPending}>Create Batch</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Weight entry dialog ── */}
      <Dialog open={weightEntryOpen} onOpenChange={(open) => { if (!open) setWeightEntryOpen(false); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Weight Entries — {selectedBatch?.batch_no}</DialogTitle>
            <DialogDescription>
              Stage: {selectedBatch?.stage} · BOM: {selectedBatch?.bom_variant_name ?? "None"} ·
              Status: {selectedBatch && <StatusBadge status={selectedBatch.status} classes={BATCH_STATUS_CLASSES} />}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {(selectedBatch?.weight_entries ?? []).length === 0 ? (
              <EmptyState title="No weight entries" description="This batch has no BOM components linked." />
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
                    {selectedBatch?.status === "IN_PROGRESS" && <TableHead className="w-40">Enter Weight</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBatch!.weight_entries.map((we) => (
                    <TableRow key={we.id}>
                      <TableCell className="font-medium text-sm">{we.item_name}</TableCell>
                      <TableCell className="font-mono text-xs">{we.item_code}</TableCell>
                      <TableCell className="text-right">{we.target_weight_grams}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{we.min_weight_grams}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{we.max_weight_grams}</TableCell>
                      <TableCell className="text-right font-medium">
                        {we.entered_weight_grams ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {we.is_valid === true && <span className="text-green-600 text-xs font-medium">✓ Valid</span>}
                        {we.is_valid === false && <span className="text-red-600 text-xs font-medium" title={we.validation_notes}>✗ Invalid</span>}
                        {we.is_valid === null && <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      {selectedBatch?.status === "IN_PROGRESS" && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-7 text-xs w-24"
                              placeholder="grams"
                              value={weightValues[we.id] ?? ""}
                              onChange={(e) => setWeightValues((prev) => ({ ...prev, [we.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={!weightValues[we.id] || saveWeightMutation.isPending}
                              onClick={() => saveWeightMutation.mutate({ entry: we, weight: weightValues[we.id] })}
                            >
                              Save
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {selectedBatch?.status === "IN_PROGRESS" && (
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-muted-foreground">
                {selectedBatch.all_weights_valid ? "All weights valid — ready to confirm." : "Some weights are missing or invalid."}
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={confirmBatchMutation.isPending}
                onClick={() => confirmBatchMutation.mutate(selectedBatch)}
              >
                Confirm Batch
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Regrind dialog ── */}
      <Dialog open={regrindOpen} onOpenChange={(open) => { if (!open) setRegrindOpen(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regrind Material — {selectedBatch?.batch_no}</DialogTitle>
            <DialogDescription>Add LDPE/HDPE regrind material entries for this batch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Form {...regrindForm}>
              <form onSubmit={regrindForm.handleSubmit((v) => addRegrindMutation.mutate(v))} className="space-y-3 rounded-lg border p-3">
                <h4 className="font-medium text-sm">Add Regrind Entry</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <ItemSearch onSelect={(item) => {
                      regrindForm.setValue("item_id", item.id);
                      regrindForm.setValue("item_display", `${item.item_name} (${item.item_code})`);
                    }} />
                    {regrindForm.watch("item_display") && (
                      <p className="text-xs text-muted-foreground mt-1">{regrindForm.watch("item_display")}</p>
                    )}
                  </FormItem>
                  <FormField control={regrindForm.control} name="quantity_grams" render={({ field }) => (
                    <FormItem><FormLabel>Quantity (g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={regrindForm.control} name="source_lot_no" render={({ field }) => (
                    <FormItem><FormLabel>Source Lot No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={regrindForm.control} name="stage" render={({ field }) => (
                    <FormItem><FormLabel>Stage</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="AD">AD</SelectItem>
                          <SelectItem value="BL">BL</SelectItem>
                          <SelectItem value="GL">GL</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                  <FormField control={regrindForm.control} name="notes" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={addRegrindMutation.isPending || !regrindForm.watch("item_id")}>Add Regrind</Button>
                </div>
              </form>
            </Form>

            {/* Existing entries */}
            <div>
              <h4 className="font-medium text-sm mb-2">Existing Entries</h4>
              {regrindEntriesQ.isLoading && <LoadingState label="Loading..." />}
              {!regrindEntriesQ.isLoading && (regrindEntriesQ.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No regrind entries yet.</p>
              )}
              {(regrindEntriesQ.data ?? []).length > 0 && (
                <div className="rounded-md border overflow-hidden">
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
                      {regrindEntriesQ.data!.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{entry.item_name}</TableCell>
                          <TableCell>{entry.quantity_grams}</TableCell>
                          <TableCell>{entry.source_lot_no || "—"}</TableCell>
                          <TableCell>{entry.is_valid ? <span className="text-green-600 text-xs">✓</span> : <span className="text-red-600 text-xs" title={entry.validation_notes}>✗</span>}</TableCell>
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

      {/* ── Recipe (BOM) dialog ── */}
      <Dialog open={recipeOpen} onOpenChange={(open) => { if (!open) { setRecipeOpen(false); setRecipe(null); setRecipePassword(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recipe — {recipeTarget?.variant_code}</DialogTitle>
            <DialogDescription>{recipeTarget?.name} · Rev {recipeTarget?.revision}</DialogDescription>
          </DialogHeader>

          {!recipe ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">This recipe is password-protected. Enter the access password to view component details.</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={recipePassword}
                  onChange={(e) => setRecipePassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (recipePassword) verifyRecipeMutation.mutate(); } }}
                  placeholder="Enter recipe password"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRecipeOpen(false)}>Cancel</Button>
                <Button disabled={!recipePassword || verifyRecipeMutation.isPending} onClick={() => verifyRecipeMutation.mutate()}>
                  View Recipe
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center gap-4 text-sm">
                <span><span className="text-muted-foreground">Product:</span> {recipe.product_item_name ?? "—"}</span>
                <span><span className="text-muted-foreground">Components:</span> {recipe.components?.length ?? 0}</span>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Seq</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Target (g)</TableHead>
                      <TableHead className="text-right">Min (g)</TableHead>
                      <TableHead className="text-right">Max (g)</TableHead>
                      <TableHead>Regrind</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recipe.components ?? []).map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="text-muted-foreground text-center">{comp.sequence}</TableCell>
                        <TableCell className="font-medium">{comp.item_name}</TableCell>
                        <TableCell className="font-mono text-xs">{comp.item_code}</TableCell>
                        <TableCell className="text-right">{comp.target_weight_grams}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{comp.min_weight_grams}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{comp.max_weight_grams}</TableCell>
                        <TableCell>{comp.is_regrind ? <Badge variant="secondary">Regrind</Badge> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setRecipe(null)}>Lock Recipe</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProductionPage;
