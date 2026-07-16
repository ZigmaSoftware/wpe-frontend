import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import {
  useCreatePacket,
  useGenerateSticker,
  useInspections,
  usePackets,
  useWeighPacket,
  useWorkOrders,
} from "@/features/production/extrusion/hooks/useExtrusion";
import { packetCreateSchema, weightCaptureSchema, type PacketCreateFormValues, type WeightCaptureFormValues } from "@/features/production/extrusion/schemas";
import type { PacketRecord } from "@/features/production/extrusion/types";
import type { LookupItem } from "@/features/wpe-masters/types";

const packetDefaults: PacketCreateFormValues = { work_order: 0, inspection: 0, pieces: 0, length_per_piece: 0, packing_material: 0, tare_weight: undefined };
const weightDefaults: WeightCaptureFormValues = { actual_gross_weight: 0, source: "SCALE", is_override: false, override_reason: "" };

const ExtrusionPackingWeighingPage = () => {
  const [workOrderId, setWorkOrderId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [weighTarget, setWeighTarget] = useState<PacketRecord | null>(null);

  const workOrdersQuery = useWorkOrders({ page: 1, pageSize: 200 });
  const inspectionsQuery = useInspections({ page: 1, pageSize: 200, work_order: workOrderId ?? undefined });
  const acceptedInspections = (inspectionsQuery.data?.items ?? []).filter((i) => i.overall_result === "ACCEPTED");
  const packingMaterialsQuery = useQuery({ queryKey: ["extrusion-pw-packing-materials"], queryFn: () => productionMastersApi.packingMaterials.lookup() as Promise<LookupItem[]> });

  const packetsQuery = usePackets({ page: 1, pageSize: 100, work_order: workOrderId ?? undefined });
  const createPacket = useCreatePacket();
  const weighPacket = useWeighPacket();
  const generateSticker = useGenerateSticker();

  const createForm = useForm<PacketCreateFormValues>({ resolver: zodResolver(packetCreateSchema), defaultValues: packetDefaults });
  const weighForm = useForm<WeightCaptureFormValues>({ resolver: zodResolver(weightCaptureSchema), defaultValues: weightDefaults });

  const records = packetsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Packing & Weight Verification"
        description="Create packets from accepted inspections, calculate the permissible weight range and capture actual scale weight."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Work Order</span>
          <Select value={workOrderId ? String(workOrderId) : ""} onValueChange={(v) => setWorkOrderId(Number(v))}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select a work order" /></SelectTrigger>
            <SelectContent>
              {(workOrdersQuery.data?.items ?? []).map((wo) => (
                <SelectItem key={wo.id} value={String(wo.id)}>{wo.work_order_no} — {wo.profile_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <MasterToolbar
        search=""
        onSearchChange={() => undefined}
        createLabel="Create Packet"
        onCreate={() => {
          if (!workOrderId) {
            toast.error("Select a work order first.");
            return;
          }
          createForm.reset({ ...packetDefaults, work_order: workOrderId });
          setCreateOpen(true);
        }}
        hideCreate={false}
      />

      <MasterTable
        columns={[
          { key: "packet", title: "Packet No", render: (r) => <span className="font-mono text-xs">{r.packet_no}</span> },
          { key: "pieces", title: "Pcs / m", render: (r) => `${r.pieces} / ${r.total_meters}` },
          { key: "range", title: "Permissible Range (kg)", render: (r) => `${r.min_permissible_weight} – ${r.max_permissible_weight}` },
          { key: "actual", title: "Actual Weight (kg)", render: (r) => r.actual_gross_weight ?? "-" },
          { key: "status", title: "Status", render: (r) => <ExtrusionStatusBadge value={r.status} /> },
          { key: "sticker", title: "Sticker", render: (r) => (r.has_sticker ? <ExtrusionStatusBadge value="ACTIVE" label="Generated" /> : "-") },
          {
            key: "actions",
            title: "Actions",
            className: "w-[220px] text-right",
            render: (r) => (
              <div className="flex justify-end gap-2">
                {(r.status === "AWAITING_WEIGHT" || r.status === "WEIGHT_REJECTED") ? (
                  <Button size="sm" variant="outline" onClick={() => { weighForm.reset(weightDefaults); setWeighTarget(r); }}>
                    Weigh
                  </Button>
                ) : null}
                {r.status === "WEIGHT_ACCEPTED" && !r.has_sticker ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await generateSticker.mutateAsync(r.id);
                        toast.success("Sticker generated.");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Failed to generate sticker."));
                      }
                    }}
                  >
                    Generate Sticker
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        records={records}
        isLoading={packetsQuery.isLoading}
        isError={packetsQuery.isError}
        errorDescription="Packets could not be loaded."
        emptyTitle={workOrderId ? "No packets yet" : "Select a work order"}
        emptyDescription={workOrderId ? "Create a packet from an accepted inspection to begin weighing." : "Choose a work order above to view or create packets."}
        page={1}
        pageSize={100}
        total={records.length}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onRetry={() => packetsQuery.refetch()}
      />

      <MasterFormDialog open={createOpen} onOpenChange={setCreateOpen} title="Create Packet" description="Only accepted inspections are eligible for packing.">
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(async (values) => {
              const payload = {
                work_order: values.work_order,
                inspection: values.inspection,
                pieces: values.pieces,
                length_per_piece: values.length_per_piece,
                packing_material: values.packing_material,
                tare_weight: values.tare_weight,
              };
              try {
                await createPacket.mutateAsync(payload);
                toast.success("Packet created.");
                setCreateOpen(false);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to create packet."));
              }
            })}
            className="space-y-4"
          >
            <FormField control={createForm.control} name="inspection" render={({ field }) => (
              <FormItem>
                <FormLabel>Accepted Inspection*</FormLabel>
                <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select accepted inspection" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {acceptedInspections.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.batch_reference || `Inspection #${i.id}`} — {i.inspected_pieces} pcs</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={createForm.control} name="pieces" render={({ field }) => (
                <FormItem><FormLabel>Pieces*</FormLabel><FormControl><Input {...field} type="number" step="1" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="length_per_piece" render={({ field }) => (
                <FormItem><FormLabel>Length / Piece (m)*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="packing_material" render={({ field }) => (
                <FormItem>
                  <FormLabel>Packing Material*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select packing material" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(packingMaterialsQuery.data ?? []).map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="tare_weight" render={({ field }) => (
                <FormItem><FormLabel>Tare Weight Override (kg)</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} placeholder="Uses work order default" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createPacket.isPending}>Create Packet</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <MasterFormDialog
        open={Boolean(weighTarget)}
        onOpenChange={(open) => !open && setWeighTarget(null)}
        title={`Capture Weight — ${weighTarget?.packet_no ?? ""}`}
        description={weighTarget ? `Permissible range: ${weighTarget.min_permissible_weight} – ${weighTarget.max_permissible_weight} kg.` : ""}
      >
        <Form {...weighForm}>
          <form
            onSubmit={weighForm.handleSubmit(async (values) => {
              if (!weighTarget) return;
              const payload = {
                actual_gross_weight: values.actual_gross_weight,
                source: values.source,
                is_override: values.is_override,
                override_reason: values.override_reason,
              };
              try {
                const result = await weighPacket.mutateAsync({ id: weighTarget.id, payload });
                toast.success(result.message);
                setWeighTarget(null);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to record weight."));
              }
            })}
            className="space-y-4"
          >
            <FormField control={weighForm.control} name="actual_gross_weight" render={({ field }) => (
              <FormItem><FormLabel>Actual Gross Weight (kg)*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} autoFocus /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={weighForm.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="SCALE">Live Scale</SelectItem>
                    <SelectItem value="MANUAL">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={weighForm.control} name="is_override" render={({ field }) => (
              <FormItem className="flex items-center gap-2 rounded-xl border border-border p-3">
                <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
                <FormLabel className="!mt-0">Manual override (requires supervisor authorization)</FormLabel>
              </FormItem>
            )} />
            {weighForm.watch("is_override") ? (
              <FormField control={weighForm.control} name="override_reason" render={({ field }) => (
                <FormItem><FormLabel>Override Reason*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={weighPacket.isPending}>Record Weight</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
    </div>
  );
};

export default ExtrusionPackingWeighingPage;
