import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Power, PowerOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import AppPageShell from "@/components/erp/AppPageShell";
import FormPanel from "@/components/erp/FormPanel";
import SectionCard from "@/components/erp/SectionCard";
import StatusBadge from "@/components/erp/StatusBadge";
import Toolbar from "@/components/erp/Toolbar";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── Schema ────────────────────────────────────────────────────────────────────

const machineSchema = z.object({
  machine_code: z.string().min(1, "Required").max(30),
  name: z.string().min(1, "Required").max(100),
  machine_type: z.string().min(1, "Required"),
  applicable_stages: z.string().min(1, "Required"),
  location: z.string().default(""),
  notes: z.string().default(""),
  is_active: z.boolean().default(true),
});
type MachineFormValues = z.infer<typeof machineSchema>;

const MACHINE_TYPES = [
  { value: "HIGH_SPEED_MIX", label: "High Speed Mix (HSM)" },
  { value: "GRANULATOR", label: "Granulator" },
  { value: "EXTRUDER", label: "Extruder" },
  { value: "MIXER", label: "Mixer" },
];

const STAGE_OPTIONS = [
  { value: "AD,BL", label: "AD + BL" },
  { value: "AD,BL,GL", label: "AD + BL + GL" },
  { value: "BL,GL", label: "BL + GL" },
  { value: "GL", label: "GL only" },
  { value: "AD", label: "AD only" },
];

// ── Machine form dialog ───────────────────────────────────────────────────────

const MachineFormDialog = ({
  open,
  onOpenChange,
  machine,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  machine: ProductionMachine | null;
  onSuccess: () => void;
}) => {
  const isEdit = !!machine;

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machine_code: "",
      name: "",
      machine_type: "HIGH_SPEED_MIX",
      applicable_stages: "AD,BL",
      location: "",
      notes: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      machine
        ? {
            machine_code: machine.machine_code,
            name: machine.name,
            machine_type: machine.machine_type,
            applicable_stages: machine.applicable_stages,
            location: machine.location ?? "",
            notes: machine.notes ?? "",
            is_active: machine.is_active,
          }
        : {
            machine_code: "",
            name: "",
            machine_type: "HIGH_SPEED_MIX",
            applicable_stages: "AD,BL",
            location: "",
            notes: "",
            is_active: true,
          },
    );
  }, [form, machine, open]);

  const mutation = useMutation({
    mutationFn: (values: MachineFormValues) =>
      isEdit
        ? coreApi.patch(`/api/production/machines/${machine!.id}/`, values)
        : coreApi.post("/api/production/machines/", values),
    onSuccess: () => {
      toast.success(isEdit ? "Machine updated." : "Machine created.");
      onOpenChange(false);
      form.reset();
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Operation failed.")),
  });

  return (
    <FormPanel
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
        }
        onOpenChange(nextOpen);
      }}
      title={isEdit ? "Edit Machine" : "New Machine"}
      description={isEdit ? `Editing ${machine!.machine_code}` : "Register a new production machine."}
      size="lg"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="machine_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine Code</FormLabel>
                  <FormControl><Input {...field} disabled={isEdit} placeholder="MCH-001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine Name</FormLabel>
                  <FormControl><Input {...field} placeholder="HSM 500 (Unit 1)" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="machine_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MACHINE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="applicable_stages" render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable Stages</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STAGE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input {...field} placeholder="Production Floor Bay-A" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isEdit && (
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 md:col-span-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {isEdit ? "Update Machine" : "Create Machine"}
              </Button>
            </div>
          </form>
        </Form>
    </FormPanel>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const MachineMasterPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<ProductionMachine | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductionMachine | null>(null);

  const machinesQ = useQuery({
    queryKey: ["machines-master", showAll],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(
        `/api/production/machines/${showAll ? "?show_all=true" : ""}`
      );
      return normalizeListResponse<ProductionMachine>(res.data);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (machine: ProductionMachine) =>
      coreApi.delete(`/api/production/machines/${machine.id}/`),
    onSuccess: () => {
      toast.success("Machine deactivated.");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["machines-master"] });
      queryClient.invalidateQueries({ queryKey: ["production-machines"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to deactivate.")),
  });

  const reactivateMutation = useMutation({
    mutationFn: (machine: ProductionMachine) =>
      coreApi.patch(`/api/production/machines/${machine.id}/`, { is_active: true }),
    onSuccess: () => {
      toast.success("Machine reactivated.");
      queryClient.invalidateQueries({ queryKey: ["machines-master"] });
      queryClient.invalidateQueries({ queryKey: ["production-machines"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to reactivate.")),
  });

  const openEdit = (machine: ProductionMachine) => {
    setEditMachine(machine);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["machines-master"] });
    queryClient.invalidateQueries({ queryKey: ["production-machines"] });
  };

  const filtered = (machinesQ.data ?? []).filter((m) => {
    if (!search.trim()) return true;
    return [m.machine_code, m.name, m.machine_type, m.location ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const typeLabel = (type: string) =>
    MACHINE_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <AppPageShell>
      <PageHeader
        title="Machine Master"
        description="Manage production machines — HSM, Granulator, and other process machines."
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        createLabel="New Machine"
        onCreate={() => {
          setEditMachine(null);
          setFormOpen(true);
        }}
        searchPlaceholder="Search by code, name, or machine type..."
        filters={
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-muted-foreground">
            <Switch checked={showAll} onCheckedChange={setShowAll} />
            Show inactive
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Machines", value: (machinesQ.data ?? []).length },
          { label: "Active", value: (machinesQ.data ?? []).filter((m) => m.is_active).length },
          { label: "HSM Units", value: (machinesQ.data ?? []).filter((m) => m.machine_type === "HIGH_SPEED_MIX").length },
        ].map((s) => (
          <SectionCard key={s.label} title={s.label}>
            <p className="text-2xl font-bold">{s.value}</p>
          </SectionCard>
        ))}
      </div>

      {machinesQ.isLoading && <LoadingState label="Loading machines..." />}
      {machinesQ.isError && <ErrorState description="Could not load machines." />}

      {!machinesQ.isLoading && !machinesQ.isError && (
        filtered.length > 0 ? (
          <SectionCard title="Machine Registry" description="Production machines remain available for assignment until explicitly deactivated.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((machine, i) => (
                  <TableRow key={machine.id} className={!machine.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{machine.machine_code}</TableCell>
                    <TableCell className="font-medium">{machine.name}</TableCell>
                    <TableCell className="text-sm">{typeLabel(machine.machine_type)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {machine.applicable_stages.split(",").map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s.trim()}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{machine.location || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge active={machine.is_active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(machine)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {machine.is_active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeactivateTarget(machine)}
                          >
                            <PowerOff className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={() => reactivateMutation.mutate(machine)}
                            disabled={reactivateMutation.isPending}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        ) : (
          <EmptyState
            title="No machines found"
            description={search ? "Try adjusting your search." : "Add your first machine to begin."}
          />
        )
      )}

      {/* Form dialog */}
      <MachineFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditMachine(null); }}
        machine={editMachine}
        onSuccess={handleFormSuccess}
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Deactivate Machine"
        description={`Deactivate "${deactivateTarget?.name}"? It will be hidden from production order assignment.`}
        confirmLabel="Deactivate"
        onConfirm={() => { if (deactivateTarget) deactivateMutation.mutate(deactivateTarget); }}
      />
    </AppPageShell>
  );
};

export default MachineMasterPage;
