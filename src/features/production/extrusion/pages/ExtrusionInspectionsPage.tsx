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
import { getApiErrorMessage, formatDateTime } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import { useCreateInspection, useInspections, useWorkOrders } from "@/features/production/extrusion/hooks/useExtrusion";
import { inspectionSchema, type InspectionFormValues } from "@/features/production/extrusion/schemas";
import type { InspectionResult } from "@/features/production/extrusion/types";

const defaultValues: InspectionFormValues = {
  work_order: 0,
  batch_reference: "",
  inspected_pieces: 0,
  straightness_result: "NA",
  flatness_result: "NA",
  section_weight_result: "NA",
  length_result: "NA",
  visual_result: "NA",
  dimensional_result: "NA",
  rejection_decision: "NONE",
  rejection_reason: "",
  remarks: "",
};

const ResultSelect = ({ label, value, onChange }: { label: string; value: InspectionResult; onChange: (v: InspectionResult) => void }) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <Select value={value} onValueChange={(v) => onChange(v as InspectionResult)}>
      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
      <SelectContent>
        <SelectItem value="PASS">Pass</SelectItem>
        <SelectItem value="FAIL">Fail</SelectItem>
        <SelectItem value="NA">Not Applicable</SelectItem>
      </SelectContent>
    </Select>
  </FormItem>
);

const ExtrusionInspectionsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);

  const workOrdersQuery = useWorkOrders({ page: 1, pageSize: 200 });
  const query = useInspections({ page, pageSize, search });
  const createMutation = useCreateInspection();

  const form = useForm<InspectionFormValues>({ resolver: zodResolver(inspectionSchema), defaultValues });
  const overallPreview = (() => {
    const mandatory: InspectionResult[] = [
      form.watch("straightness_result"),
      form.watch("flatness_result"),
      form.watch("section_weight_result"),
      form.watch("length_result"),
      form.watch("visual_result"),
    ];
    return mandatory.some((v) => v === "FAIL") ? "REJECTED" : "ACCEPTED";
  })();

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Quality Inspection"
        description="Record straightness, flatness, section weight, length and visual results. Overall result is system-derived."
      />
      <MasterToolbar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} createLabel="Record Inspection" onCreate={() => { form.reset(defaultValues); setDialogOpen(true); }} />
      <MasterTable
        columns={[
          { key: "wo", title: "Work Order", render: (r) => <span className="font-mono text-xs">{r.work_order_no}</span> },
          { key: "batch", title: "Batch Ref", render: (r) => r.batch_reference || "-" },
          { key: "pieces", title: "Pieces", render: (r) => r.inspected_pieces },
          { key: "overall", title: "Overall Result", render: (r) => <ExtrusionStatusBadge value={r.overall_result} /> },
          { key: "decision", title: "Decision", render: (r) => (r.rejection_decision !== "NONE" ? r.rejection_decision : "-") },
          { key: "by", title: "Inspected By / At", render: (r) => `${r.inspected_by_name || "-"} — ${formatDateTime(r.inspected_at)}` },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Inspections could not be loaded."
        emptyTitle="No inspections"
        emptyDescription="Record a quality inspection to make a work order's output eligible for packing."
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Record Quality Inspection" description="Mandatory parameters (straightness, flatness, section weight, length, visual) determine the overall result.">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                work_order: values.work_order,
                batch_reference: values.batch_reference,
                inspected_pieces: values.inspected_pieces,
                straightness_result: values.straightness_result,
                flatness_result: values.flatness_result,
                section_weight_result: values.section_weight_result,
                length_result: values.length_result,
                visual_result: values.visual_result,
                dimensional_result: values.dimensional_result,
                rejection_decision: values.rejection_decision,
                rejection_reason: values.rejection_reason,
                remarks: values.remarks,
              };
              try {
                await createMutation.mutateAsync(payload);
                toast.success("Inspection recorded.");
                setDialogOpen(false);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to record inspection."));
              }
            })}
            className="space-y-4"
          >
            <FormField control={form.control} name="work_order" render={({ field }) => (
              <FormItem>
                <FormLabel>Work Order*</FormLabel>
                <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(workOrdersQuery.data?.items ?? []).map((wo) => (
                      <SelectItem key={wo.id} value={String(wo.id)}>{wo.work_order_no} — {wo.profile_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="batch_reference" render={({ field }) => (
                <FormItem><FormLabel>Batch Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="inspected_pieces" render={({ field }) => (
                <FormItem><FormLabel>Inspected Pieces</FormLabel><FormControl><Input {...field} type="number" step="1" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="straightness_result" render={({ field }) => <ResultSelect label="Straightness" value={field.value} onChange={field.onChange} />} />
              <FormField control={form.control} name="flatness_result" render={({ field }) => <ResultSelect label="Flatness" value={field.value} onChange={field.onChange} />} />
              <FormField control={form.control} name="section_weight_result" render={({ field }) => <ResultSelect label="Section Weight" value={field.value} onChange={field.onChange} />} />
              <FormField control={form.control} name="length_result" render={({ field }) => <ResultSelect label="Length" value={field.value} onChange={field.onChange} />} />
              <FormField control={form.control} name="visual_result" render={({ field }) => <ResultSelect label="Visual" value={field.value} onChange={field.onChange} />} />
              <FormField control={form.control} name="dimensional_result" render={({ field }) => <ResultSelect label="Dimensional (optional)" value={field.value} onChange={field.onChange} />} />
            </div>

            <div className="rounded-xl border border-border p-3 text-sm">
              Overall result (system-derived): <ExtrusionStatusBadge value={overallPreview} />
            </div>

            {overallPreview === "REJECTED" ? (
              <>
                <FormField control={form.control} name="rejection_decision" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Decision*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="REWORK">Rework</SelectItem>
                        <SelectItem value="HOLD">Hold</SelectItem>
                        <SelectItem value="SCRAP">Scrap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rejection_reason" render={({ field }) => (
                  <FormItem><FormLabel>Rejection Reason*</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
              </>
            ) : null}

            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Save Inspection</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
    </div>
  );
};

export default ExtrusionInspectionsPage;
