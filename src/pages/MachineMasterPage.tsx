import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, PowerOff, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
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
    defaultValues: machine
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
  });

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
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Machine" : "New Machine"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${machine!.machine_code}` : "Register a new production machine."}
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
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
    <div className="space-y-6">
      <PageHeader
        title="Machine Master"
        description="Manage production machines — HSM, Granulator, and other process machines."
        actions={
          <Button onClick={() => { setEditMachine(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />New Machine
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, type..."
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
          <Switch checked={showAll} onCheckedChange={setShowAll} />
          Show inactive
        </label>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Machines", value: (machinesQ.data ?? []).length },
          { label: "Active", value: (machinesQ.data ?? []).filter((m) => m.is_active).length },
          { label: "HSM Units", value: (machinesQ.data ?? []).filter((m) => m.machine_type === "HIGH_SPEED_MIX").length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {machinesQ.isLoading && <LoadingState label="Loading machines..." />}
      {machinesQ.isError && <ErrorState description="Could not load machines." />}

      {!machinesQ.isLoading && !machinesQ.isError && (
        filtered.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                      <Badge className={machine.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {machine.is_active ? "Active" : "Inactive"}
                      </Badge>
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
          </div>
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
    </div>
  );
};

export default MachineMasterPage;
