import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
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
import RowActions from "@/features/common-master/components/RowActions";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import { useCreateWorkOrder, useReleaseWorkOrder, useWorkOrders } from "@/features/production/extrusion/hooks/useExtrusion";
import { workOrderSchema, type WorkOrderFormValues } from "@/features/production/extrusion/schemas";
import type { ExtrusionWorkOrderListRecord } from "@/features/production/extrusion/types";
import type { LookupItem } from "@/features/wpe-masters/types";

const defaultValues: WorkOrderFormValues = {
  profile: 0,
  extrusion_line: 0,
  production_date: new Date().toISOString().slice(0, 10),
  shift: "Shift 1 (6:00 am - 2:00 pm)",
  planned_pieces: 0,
  planned_meters: 0,
  packing_material: 0,
  expected_tare_weight: 0,
  expected_section_weight_per_meter: 0,
  tolerance_type: "FIXED",
  tolerance_value: 0,
  notes: "",
  consumables: [{ item: 0, quantity: 0, uom: "" }],
};

const ExtrusionWorkOrdersPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<ExtrusionWorkOrderListRecord | null>(null);

  const profilesQuery = useQuery({ queryKey: ["extrusion-wo-profiles"], queryFn: () => productionMastersApi.profileCreations.lookup() as Promise<LookupItem[]> });
  const linesQuery = useQuery({ queryKey: ["extrusion-wo-lines"], queryFn: () => productionMastersApi.productionLines.lookup() as Promise<LookupItem[]> });
  const packingMaterialsQuery = useQuery({ queryKey: ["extrusion-wo-packing-materials"], queryFn: () => productionMastersApi.packingMaterials.lookup() as Promise<LookupItem[]> });
  const itemsQuery = useQuery({ queryKey: ["extrusion-wo-items"], queryFn: () => wpeMastersApi.itemCreations.lookup() as Promise<LookupItem[]> });

  const query = useWorkOrders({ page, pageSize, search });
  const createMutation = useCreateWorkOrder();
  const releaseMutation = useReleaseWorkOrder();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "consumables" });

  const openCreate = () => {
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Work Orders"
        description="Create and release extrusion work orders with profile, line, consumables and tare-weight information."
      />
      <MasterToolbar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} createLabel="Create Work Order" onCreate={openCreate} />
      <MasterTable
        columns={[
          { key: "wo", title: "Work Order", render: (r) => <span className="font-mono text-xs">{r.work_order_no}</span> },
          { key: "profile", title: "Profile", render: (r) => `${r.profile_name} (${r.profile_code})` },
          { key: "line", title: "Line", render: (r) => r.extrusion_line_name },
          { key: "date", title: "Date / Shift", render: (r) => `${r.production_date} — ${r.shift}` },
          { key: "planned", title: "Planned Pcs / m", render: (r) => `${r.planned_pieces} / ${r.planned_meters}` },
          { key: "packets", title: "Packets", render: (r) => r.packet_count },
          { key: "status", title: "Status", render: (r) => <ExtrusionStatusBadge value={r.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (r) => (
              <RowActions
                onEdit={r.status === "DRAFT" ? () => setReleaseTarget(r) : undefined}
              />
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Work orders could not be loaded."
        emptyTitle="No work orders"
        emptyDescription="Create a work order to begin extrusion production."
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Create Extrusion Work Order" description="Fields marked * are mandatory before release.">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                profile: values.profile,
                extrusion_line: values.extrusion_line,
                production_date: values.production_date,
                shift: values.shift,
                planned_pieces: values.planned_pieces,
                planned_meters: values.planned_meters,
                packing_material: values.packing_material,
                expected_tare_weight: values.expected_tare_weight,
                expected_section_weight_per_meter: values.expected_section_weight_per_meter,
                tolerance_type: values.tolerance_type,
                tolerance_value: values.tolerance_value,
                notes: values.notes,
                consumables: values.consumables.map((consumable) => ({
                  item: consumable.item,
                  quantity: consumable.quantity,
                  uom: consumable.uom ?? "",
                })),
              };
              try {
                await createMutation.mutateAsync(payload);
                toast.success("Work order created.");
                setDialogOpen(false);
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Failed to create work order."));
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="profile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(profilesQuery.data ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="extrusion_line" render={({ field }) => (
                <FormItem>
                  <FormLabel>Extrusion Line*</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select line" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(linesQuery.data ?? []).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="production_date" render={({ field }) => (
                <FormItem><FormLabel>Production Date*</FormLabel><FormControl><Input {...field} type="date" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="shift" render={({ field }) => (
                <FormItem><FormLabel>Shift*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="planned_pieces" render={({ field }) => (
                <FormItem><FormLabel>Planned Pieces</FormLabel><FormControl><Input {...field} type="number" step="1" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="planned_meters" render={({ field }) => (
                <FormItem><FormLabel>Planned Meters</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="packing_material" render={({ field }) => (
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
              <FormField control={form.control} name="expected_tare_weight" render={({ field }) => (
                <FormItem><FormLabel>Expected Tare Weight (kg)*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expected_section_weight_per_meter" render={({ field }) => (
                <FormItem><FormLabel>Section Weight / Meter (kg)*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tolerance_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tolerance Type*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Weight</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tolerance_value" render={({ field }) => (
                <FormItem><FormLabel>Tolerance Value*</FormLabel><FormControl><Input {...field} type="number" step="0.001" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-2 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <FormLabel>Consumables* (at least one required before release)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ item: 0, quantity: 0, uom: "" })}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {fields.map((fieldRow, index) => (
                <div key={fieldRow.id} className="grid grid-cols-[1fr_120px_100px_auto] gap-2">
                  <Select
                    value={String(form.watch(`consumables.${index}.item`) || "")}
                    onValueChange={(v) => form.setValue(`consumables.${index}.item`, Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                    <SelectContent>
                      {(itemsQuery.data ?? []).map((it) => <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.001" placeholder="Qty" {...form.register(`consumables.${index}.quantity`)} />
                  <Input placeholder="UOM" {...form.register(`consumables.${index}.uom`)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>Create Work Order</Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(releaseTarget)}
        onOpenChange={(open) => !open && setReleaseTarget(null)}
        title="Release Work Order"
        description={`Release "${releaseTarget?.work_order_no}"? Release is blocked unless consumables, packing material and tare weight are present.`}
        confirmLabel="Release"
        onConfirm={async () => {
          if (releaseTarget) {
            try {
              await releaseMutation.mutateAsync(releaseTarget.id);
              toast.success("Work order released.");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Failed to release work order."));
            }
          }
          setReleaseTarget(null);
        }}
      />
    </div>
  );
};

export default ExtrusionWorkOrdersPage;
