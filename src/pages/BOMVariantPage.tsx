import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { BOMVariant, BOMVariantComponent } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

// ── Item search ───────────────────────────────────────────────────────────────

type ItemOption = { id: number; item_code: string; item_name: string; unit: string };

const ItemSearch = ({ onSelect }: { onSelect: (item: ItemOption) => void }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const searchQ = useQuery({
    queryKey: ["item-search-bom", q],
    queryFn: async () => {
      if (q.trim().length < 2) return [];
      const res = await coreApi.get<unknown>(
        `/api/items/items/?search=${encodeURIComponent(q)}&page_size=15`
      );
      return normalizeListResponse<ItemOption>(res.data);
    },
    enabled: q.trim().length >= 2,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search item to add..."
          className="pl-9"
        />
      </div>
      {open && (searchQ.data?.length ?? 0) > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {searchQ.data!.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent text-sm"
              onMouseDown={() => { onSelect(item); setQ(""); setOpen(false); }}
            >
              <span className="font-medium">{item.item_name}</span>
              <span className="text-xs text-muted-foreground">{item.item_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── BOM Create form ───────────────────────────────────────────────────────────

const createSchema = z.object({
  variant_code: z.string().min(1, "Required").max(30),
  name: z.string().min(1, "Required").max(255),
  revision: z.string().default("v1"),
  notes: z.string().default(""),
  password: z.string().min(1, "Password is required"),
  confirm_password: z.string().min(1, "Required"),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
type CreateFormValues = z.infer<typeof createSchema>;

const BOMCreateDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) => {
  const [showPwd, setShowPwd] = useState(false);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { variant_code: "", name: "", revision: "v1", notes: "", password: "", confirm_password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      coreApi.post("/api/production/bom-variants/", {
        variant_code: values.variant_code,
        name: values.name,
        revision: values.revision,
        notes: values.notes,
        password: values.password,
      }),
    onSuccess: () => {
      toast.success("BOM variant created.");
      onOpenChange(false);
      form.reset();
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to create BOM variant.")),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New BOM Variant</DialogTitle>
          <DialogDescription>Create a new Bill of Materials variant. You can add components after creation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormField control={form.control} name="variant_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Code</FormLabel>
                  <FormControl><Input {...field} placeholder="BOM-001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="revision" render={({ field }) => (
                <FormItem>
                  <FormLabel>Revision</FormLabel>
                  <FormControl><Input {...field} placeholder="v1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Additive Blend Formula A" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} {...field} placeholder="••••" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirm_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type={showPwd ? "text" : "password"} {...field} placeholder="••••" />
                  </FormControl>
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
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>Create BOM Variant</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ── Change password dialog ────────────────────────────────────────────────────

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  bom,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bom: BOMVariant | null;
  onSuccess: () => void;
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => coreApi.post(`/api/production/bom-variants/${bom!.id}/set-password/`, { password: pwd }),
    onSuccess: () => {
      toast.success("Recipe password updated.");
      onOpenChange(false);
      setPwd(""); setConfirm("");
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to update password.")),
  });

  const valid = pwd.length >= 1 && pwd === confirm;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPwd(""); setConfirm(""); } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Recipe Password</DialogTitle>
          <DialogDescription>{bom?.variant_code} — {bom?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">New Password</label>
            <div className="relative mt-1">
              <Input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1"
              placeholder="Repeat new password"
            />
            {pwd && confirm && pwd !== confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
              Update Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── BOM Detail / Component editor ─────────────────────────────────────────────

type PendingComponent = {
  item: ItemOption;
  target_weight_grams: string;
  min_weight_grams: string;
  max_weight_grams: string;
  sequence: number;
  is_regrind: boolean;
  unit: string;
};

const BOMDetailDialog = ({
  open,
  onOpenChange,
  bom,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bom: BOMVariant | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingComponent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BOMVariantComponent | null>(null);

  const detailQ = useQuery({
    queryKey: ["bom-detail", bom?.id],
    queryFn: async () => {
      const res = await coreApi.get<{ data: BOMVariant } | BOMVariant>(`/api/production/bom-variants/${bom!.id}/`);
      const p = res.data as { data?: BOMVariant } & BOMVariant;
      return (p.data ?? p) as BOMVariant;
    },
    enabled: !!bom && open,
  });

  const addComponentMutation = useMutation({
    mutationFn: (comp: PendingComponent) =>
      coreApi.post(`/api/production/bom-variants/${bom!.id}/components/`, {
        item: comp.item.id,
        target_weight_grams: comp.target_weight_grams,
        min_weight_grams: comp.min_weight_grams,
        max_weight_grams: comp.max_weight_grams,
        sequence: comp.sequence,
        is_regrind: comp.is_regrind,
        unit: comp.unit,
      }),
    onSuccess: () => {
      toast.success("Component added.");
      setPending(null);
      queryClient.invalidateQueries({ queryKey: ["bom-detail", bom?.id] });
      queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to add component.")),
  });

  const removeComponentMutation = useMutation({
    mutationFn: (comp: BOMVariantComponent) =>
      coreApi.delete(`/api/production/bom-variants/${bom!.id}/components/${comp.id}/`),
    onSuccess: () => {
      toast.success("Component removed.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["bom-detail", bom?.id] });
      queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
      onSuccess();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to remove component.")),
  });

  const detail = detailQ.data;
  const components = detail?.components ?? [];

  const startAdd = (item: ItemOption) => {
    setPending({
      item,
      target_weight_grams: "",
      min_weight_grams: "195",
      max_weight_grams: "9205",
      sequence: components.length + 1,
      is_regrind: false,
      unit: "g",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {bom?.variant_code} — Components
          </DialogTitle>
          <DialogDescription>
            {bom?.name} · Rev {bom?.revision} · {components.length} component(s)
          </DialogDescription>
        </DialogHeader>

        {detailQ.isLoading && <LoadingState label="Loading BOM details..." />}
        {detailQ.isError && <ErrorState description="Could not load BOM details." />}

        {!detailQ.isLoading && !detailQ.isError && (
          <div className="space-y-4">
            {/* Components table */}
            {components.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">Seq</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Target (g)</TableHead>
                      <TableHead className="text-right">Min (g)</TableHead>
                      <TableHead className="text-right">Max (g)</TableHead>
                      <TableHead>Regrind</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="text-center text-muted-foreground">{comp.sequence}</TableCell>
                        <TableCell className="font-medium">{comp.item_name}</TableCell>
                        <TableCell className="font-mono text-xs">{comp.item_code}</TableCell>
                        <TableCell className="text-right">{comp.target_weight_grams}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{comp.min_weight_grams}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{comp.max_weight_grams}</TableCell>
                        <TableCell>
                          {comp.is_regrind ? (
                            <Badge variant="secondary" className="text-xs">Regrind</Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(comp)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No components yet"
                description="Search for an item below to add the first recipe component."
              />
            )}

            {/* Add component */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <h4 className="text-sm font-medium">Add Component</h4>
              <ItemSearch onSelect={startAdd} />

              {pending && (
                <div className="rounded-md border bg-background p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {pending.item.item_name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{pending.item.item_code}</span>
                    </p>
                    <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    {[
                      { key: "target_weight_grams", label: "Target (g)" },
                      { key: "min_weight_grams", label: "Min (g)" },
                      { key: "max_weight_grams", label: "Max (g)" },
                      { key: "sequence", label: "Sequence" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                        <Input
                          type="number"
                          step="0.001"
                          className="mt-1 h-8 text-sm"
                          value={(pending as Record<string, unknown>)[f.key] as string}
                          onChange={(e) => setPending((p) => p ? { ...p, [f.key]: e.target.value } : p)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pending.is_regrind}
                        onChange={(e) => setPending((p) => p ? { ...p, is_regrind: e.target.checked } : p)}
                        className="h-4 w-4"
                      />
                      Mark as Regrind material
                    </label>
                    <Button
                      size="sm"
                      disabled={!pending.target_weight_grams || addComponentMutation.isPending}
                      onClick={() => addComponentMutation.mutate(pending)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />Add to BOM
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          title="Remove Component"
          description={`Remove "${deleteTarget?.item_name}" from this BOM variant?`}
          confirmLabel="Remove"
          onConfirm={() => { if (deleteTarget) removeComponentMutation.mutate(deleteTarget); }}
        />
      </DialogContent>
    </Dialog>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const BOMVariantPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBOM, setDetailBOM] = useState<BOMVariant | null>(null);
  const [pwdBOM, setPwdBOM] = useState<BOMVariant | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BOMVariant | null>(null);

  const bomsQ = useQuery({
    queryKey: ["bom-variants"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/bom-variants/");
      return normalizeListResponse<BOMVariant>(res.data);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (bom: BOMVariant) => coreApi.delete(`/api/production/bom-variants/${bom.id}/`),
    onSuccess: () => {
      toast.success("BOM variant deactivated.");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["bom-variants"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Failed to deactivate.")),
  });

  const handleSuccess = () => queryClient.invalidateQueries({ queryKey: ["bom-variants"] });

  const filtered = (bomsQ.data ?? []).filter((b) => {
    if (!search.trim()) return true;
    return [b.variant_code, b.name, b.revision].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="BOM Variants"
        description="Manage Bill of Materials variants and their recipe components (password protected)."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />New BOM Variant
          </Button>
        }
      />

      {/* Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name..."
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Variants</p>
          <p className="text-2xl font-bold mt-1">{(bomsQ.data ?? []).length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold mt-1">
            {(bomsQ.data ?? []).reduce((sum, b) => sum + (b.component_count ?? 0), 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">All Password Protected</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            <Lock className="inline h-5 w-5 mr-1" />Yes
          </p>
        </div>
      </div>

      {/* Table */}
      {bomsQ.isLoading && <LoadingState label="Loading BOM variants..." />}
      {bomsQ.isError && <ErrorState description="Could not load BOM variants." />}

      {!bomsQ.isLoading && !bomsQ.isError && (
        filtered.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Variant Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Revision</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Product Item</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bom, i) => (
                  <TableRow key={bom.id}>
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs font-semibold">{bom.variant_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{bom.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{bom.revision}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {bom.component_count ?? 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bom.product_item_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setDetailBOM(bom)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />Components
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Change password"
                          onClick={() => setPwdBOM(bom)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeactivateTarget(bom)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No BOM variants"
            description={search ? "Try adjusting your search." : "Create the first BOM variant to define recipe components."}
          />
        )
      )}

      {/* Dialogs */}
      <BOMCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />

      <BOMDetailDialog
        open={!!detailBOM}
        onOpenChange={(o) => { if (!o) setDetailBOM(null); }}
        bom={detailBOM}
        onSuccess={handleSuccess}
      />

      <ChangePasswordDialog
        open={!!pwdBOM}
        onOpenChange={(o) => { if (!o) setPwdBOM(null); }}
        bom={pwdBOM}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
        title="Deactivate BOM Variant"
        description={`Deactivate "${deactivateTarget?.variant_code}"? It will no longer appear in production order assignment.`}
        confirmLabel="Deactivate"
        onConfirm={() => { if (deactivateTarget) deactivateMutation.mutate(deactivateTarget); }}
      />
    </div>
  );
};

export default BOMVariantPage;
