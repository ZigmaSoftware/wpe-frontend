import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import ReasonPromptDialog from "@/features/production/extrusion/components/ReasonPromptDialog";
import { extrusionApi } from "@/features/production/extrusion/api/extrusionApi";
import {
  useApproveScrapTransaction,
  useCreateScrapTransaction,
  useInspections,
  usePackets,
  useReverseScrapTransaction,
  useScrapTransactions,
  useWorkOrders,
} from "@/features/production/extrusion/hooks/useExtrusion";
import { scrapTransactionSchema, type ScrapTransactionFormValues } from "@/features/production/extrusion/schemas";
import type { ScrapTransactionRecord } from "@/features/production/extrusion/types";
import type { LookupItem } from "@/features/wpe-masters/types";
import { useQuery } from "@tanstack/react-query";

const defaultValues: ScrapTransactionFormValues = {
  source_stage: "PACKING",
  work_order: 0,
  inspection: null,
  packet: null,
  production_date: new Date().toISOString().slice(0, 10),
  shift: "",
  scrap_category: 0,
  scrap_reason: 0,
  actual_scrap_weight: 0,
  remarks: "",
};

const STAGE_LABELS: Record<string, string> = {
  QC_INSPECTION: "QC Inspection Scrap",
  PACKING: "Packing Scrap",
  WEIGHT_VERIFICATION: "Weight Verification Scrap",
  SHIFT_END_QC: "Shift-End QC Scrap",
};

const ExtrusionScrapPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<ScrapTransactionRecord | null>(null);

  const query = useScrapTransactions({ page: 1, pageSize: 100 });
  const workOrdersQuery = useWorkOrders({ page: 1, pageSize: 200 });
  const categoriesQuery = useQuery({ queryKey: ["extrusion-scrap-categories-lookup-2"], queryFn: () => extrusionApi.scrapCategories.lookup() as Promise<LookupItem[]> });
  const reasonsQuery = useQuery({ queryKey: ["extrusion-scrap-reasons-lookup"], queryFn: () => extrusionApi.scrapReasons.lookup() as Promise<LookupItem[]> });
  const createMutation = useCreateScrapTransaction();
  const approveMutation = useApproveScrapTransaction();
  const reverseMutation = useReverseScrapTransaction();

  const form = useForm<ScrapTransactionFormValues>({ resolver: zodResolver(scrapTransactionSchema), defaultValues });
  const selectedWorkOrder = form.watch("work_order");
  const sourceStage = form.watch("source_stage");

  const inspectionsQuery = useInspections({ page: 1, pageSize: 200, work_order: selectedWorkOrder || undefined });
  const packetsQuery = usePackets({ page: 1, pageSize: 200, work_order: selectedWorkOrder || undefined });

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Scrap Management"
        description="Record scrap using actual weight only — tare weight is never requested or applied."
      />

      <MasterToolbar search="" onSearchChange={() => undefined} createLabel="Record Scrap" onCreate={() => { form.reset(defaultValues); setDialogOpen(true); }} />

      <MasterTable
        columns={[
          { key: "wo", title: "Work Order", render: (r) => <span className="font-mono text-xs">{r.work_order_no}</span> },
          { key: "stage", title: "Source Stage", render: (r) => STAGE_LABELS[r.source_stage] ?? r.source_stage },
          { key: "ref", title: "Packet / Inspection", render: (r) => r.packet_no ?? `Inspection #${r.inspection ?? "-"}` },
          { key: "category", title: "Category / Reason", render: (r) => `${r.scrap_category_name} — ${r.scrap_reason_name}` },
          { key: "weight", title: "Actual Weight (kg)", render: (r) => r.actual_scrap_weight },
          { key: "status", title: "Status", render: (r) => <ExtrusionStatusBadge value={r.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[180px] text-right",
            render: (r) => (
              <div className="flex justify-end gap-2">
                {r.status === "CONFIRMED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await approveMutation.mutateAsync(r.id);
                        toast.success("Scrap approved.");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Failed to approve scrap."));
                      }
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
                {r.status !== "REVERSED" ? (
                  <Button size="sm" variant="ghost" onClick={() => setReverseTarget(r)}>Reverse</Button>
                ) : null}
              </div>
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Scrap transactions could not be loaded."
        emptyTitle="No scrap transactions"
        emptyDescription="Record scrap from any stage — QC inspection, packing, weight verification or shift-end QC."
        page={1}
        pageSize={100}
        total={records.length}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Record Scrap" description="Only actual scrap weight is captured — tare weight is not applicable.">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                source_stage: values.source_stage,
                work_order: values.work_order,
                inspection: values.inspection,
                packet: values.packet,
                production_date: values.production_date,
                shift: values.shift,
                scrap_category: values.scrap_category,
                scrap_reason: values.scrap_reason,
                actual_scrap_weight: values.actual_scrap_weight,
                remarks: values.remarks,
              };
              try {
                await createMutation.mutateAsync(payload);
                toast.success("Scrap recorded.");
                setDialogOpen(false);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to record scrap."));
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="source_stage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrap Source*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="work_order" render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Order*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(workOrdersQuery.data?.items ?? []).map((wo) => <SelectItem key={wo.id} value={String(wo.id)}>{wo.work_order_no}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {sourceStage === "QC_INSPECTION" ? (
                <FormField control={form.control} name="inspection" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection*</FormLabel>
                    <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select inspection" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(inspectionsQuery.data?.items ?? []).map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.batch_reference || `Inspection #${i.id}`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="packet" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packet*</FormLabel>
                    <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select packet" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(packetsQuery.data?.items ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.packet_no}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="scrap_category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrap Category*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(categoriesQuery.data ?? []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="scrap_reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrap Reason*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(reasonsQuery.data ?? []).map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="actual_scrap_weight" render={({ field }) => (
                <FormItem><FormLabel>Actual Scrap Weight (kg)*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="production_date" render={({ field }) => (
                <FormItem><FormLabel>Production Date*</FormLabel><FormControl><Input {...field} type="date" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="shift" render={({ field }) => (
                <FormItem><FormLabel>Shift</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Record Scrap</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ReasonPromptDialog
        open={Boolean(reverseTarget)}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        title="Reverse Scrap Transaction"
        description="Reversal requires authorized approval and is recorded in the audit trail."
        confirmLabel="Reverse"
        isSubmitting={reverseMutation.isPending}
        onConfirm={async (reason) => {
          if (reverseTarget) {
            try {
              await reverseMutation.mutateAsync({ id: reverseTarget.id, reason });
              toast.success("Scrap transaction reversed.");
              setReverseTarget(null);
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Failed to reverse scrap transaction."));
            }
          }
        }}
      />
    </div>
  );
};

export default ExtrusionScrapPage;
