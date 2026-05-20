import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { LookupItem, WPEUserRecord, WPEUserWritePayload } from "@/features/wpe-masters/types";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
  job_title: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone_no: z.string().optional(),
  location: z.number().nullable().optional(),
  default_branch: z.number().nullable().optional(),
  authorized_branches: z.array(z.number()).default([]),
  authorized_price_books: z.array(z.number()).default([]),
  authorized_warehouses: z.array(z.number()).default([]),
  authorized_production_types: z.array(z.number()).default([]),
  authorized_sale_types: z.array(z.number()).default([]),
  authorized_purchase_types: z.array(z.number()).default([]),
  role: z.number().nullable().optional(),
  is_active: z.boolean().default(true),
}).refine((d) => {
  if (d.password || d.confirm_password) return d.password === d.confirm_password;
  return true;
}, { message: "Passwords do not match", path: ["confirm_password"] });

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  full_name: "",
  username: "",
  password: "",
  confirm_password: "",
  job_title: "",
  email: "",
  phone_no: "",
  location: null,
  default_branch: null,
  authorized_branches: [],
  authorized_price_books: [],
  authorized_warehouses: [],
  authorized_production_types: [],
  authorized_sale_types: [],
  authorized_purchase_types: [],
  role: null,
  is_active: true,
};

interface MultiCheckboxFieldProps {
  label: string;
  options: LookupItem[];
  value: number[];
  onChange: (v: number[]) => void;
}

const MultiCheckboxField = ({ label, options, value, onChange }: MultiCheckboxFieldProps) => {
  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => {
            const opt = options.find((o) => o.id === id);
            return opt ? <Badge key={id} variant="secondary" className="text-xs">{opt.name}</Badge> : null;
          })}
        </div>
      )}
      <ScrollArea className="h-40 rounded-md border border-input p-2">
        <div className="space-y-1">
          {options.map((opt) => (
            <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
              <Checkbox
                checked={value.includes(opt.id)}
                onCheckedChange={() => toggle(opt.id)}
              />
              <span>{opt.name}</span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const WPEUserCreationPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WPEUserRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<WPEUserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WPEUserRecord | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const query = useQuery({
    queryKey: ["wpe-masters", "users", page, pageSize, search],
    queryFn: () => wpeMastersApi.users.list({ page, pageSize, search }),
  });

  const { data: locations } = useQuery({ queryKey: ["wpe-lookup", "locations"], queryFn: wpeMastersApi.locations.lookup });
  const { data: branches } = useQuery({ queryKey: ["wpe-lookup", "branches"], queryFn: wpeMastersApi.branches.lookup });
  const { data: priceBooks } = useQuery({ queryKey: ["wpe-lookup", "price-books"], queryFn: wpeMastersApi.priceBooks.lookup });
  const { data: warehouses } = useQuery({ queryKey: ["wpe-lookup", "warehouses"], queryFn: wpeMastersApi.warehouses.lookup });
  const { data: productionTypes } = useQuery({ queryKey: ["wpe-lookup", "production-types"], queryFn: wpeMastersApi.productionTypes.lookup });
  const { data: saleTypes } = useQuery({ queryKey: ["wpe-lookup", "sale-types"], queryFn: wpeMastersApi.saleTypes.lookup });
  const { data: purchaseTypes } = useQuery({ queryKey: ["wpe-lookup", "purchase-types"], queryFn: wpeMastersApi.purchaseTypes.lookup });
  const { data: roles } = useQuery({ queryKey: ["wpe-lookup", "roles"], queryFn: wpeMastersApi.roles.lookup });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wpe-masters", "users"] });

  const createMutation = useMutation({
    mutationFn: wpeMastersApi.users.create,
    onSuccess: () => { toast.success("User created successfully."); invalidate(); setDialogOpen(false); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to create user.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<WPEUserWritePayload> }) => wpeMastersApi.users.update(id, payload),
    onSuccess: () => { toast.success("User updated successfully."); invalidate(); setDialogOpen(false); },
    onError: () => toast.error("Failed to update user."),
  });

  const toggleMutation = useMutation({
    mutationFn: wpeMastersApi.users.toggle,
    onSuccess: () => { toast.success("User status updated."); invalidate(); },
    onError: () => toast.error("Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: wpeMastersApi.users.delete,
    onSuccess: () => { toast.success("User deleted."); invalidate(); },
    onError: () => toast.error("Failed to delete user."),
  });

  const records = query.data?.items ?? [];

  const openEdit = (record: WPEUserRecord) => {
    setEditing(record);
    form.reset({
      full_name: record.full_name,
      username: record.username,
      password: "",
      confirm_password: "",
      job_title: record.job_title,
      email: record.email,
      phone_no: record.phone_no,
      location: record.location,
      default_branch: record.default_branch,
      authorized_branches: record.authorized_branches.map((b) => b.id),
      authorized_price_books: record.authorized_price_books.map((b) => b.id),
      authorized_warehouses: record.authorized_warehouses.map((b) => b.id),
      authorized_production_types: record.authorized_production_types.map((b) => b.id),
      authorized_sale_types: record.authorized_sale_types.map((b) => b.id),
      authorized_purchase_types: record.authorized_purchase_types.map((b) => b.id),
      role: record.role,
      is_active: record.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (values: FormValues) => {
    const payload: WPEUserWritePayload = {
      ...values,
      password: values.password || undefined,
      confirm_password: values.confirm_password || undefined,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WPE User Creation"
        description="Create and manage WPE users with location, branch, warehouse, and role authorizations."
      />
      <MasterToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        createLabel="Add User"
        onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }}
      />
      <MasterTable
        columns={[
          { key: "full_name", title: "Full Name", render: (r) => <span className="font-medium">{r.full_name}</span> },
          { key: "username", title: "Username", render: (r) => r.username || "-" },
          { key: "job_title", title: "Job Title", render: (r) => r.job_title || "-" },
          { key: "email", title: "Email", render: (r) => r.email || "-" },
          { key: "phone_no", title: "Phone", render: (r) => r.phone_no || "-" },
          { key: "role_name", title: "Role", render: (r) => r.role_name || "-" },
          { key: "location_name", title: "Location", render: (r) => r.location_name || "-" },
          { key: "is_active", title: "Status", render: (r) => <MasterStatusBadge active={r.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (r) => (
              <RowActions
                onEdit={() => openEdit(r)}
                onToggle={() => setToggleTarget(r)}
                onDelete={() => setDeleteTarget(r)}
              />
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Users could not be loaded."
        emptyTitle="No users found"
        emptyDescription="Create the first WPE user."
        page={page}
        pageSize={pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRetry={() => query.refetch()}
      />

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit User" : "Create User"}
        description="Fill in all user details and set authorizations."
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Full name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Username" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password {!editing && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl><Input type="password" {...field} value={field.value ?? ""} placeholder={editing ? "Leave blank to keep" : "Password"} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirm_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input type="password" {...field} value={field.value ?? ""} placeholder="Confirm password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="job_title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="Job title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone No</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="Phone number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} placeholder="Email address" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {(locations ?? []).map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {(roles ?? []).map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="default_branch" render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Branch</FormLabel>
                  <Select
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select default branch" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {(branches ?? []).map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center gap-3 pt-6">
                  <FormLabel>Active</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            <Separator />
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Authorizations</div>

            <FormField control={form.control} name="authorized_branches" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Branches"
                  options={branches ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="authorized_price_books" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Price Books"
                  options={priceBooks ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="authorized_warehouses" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Warehouses"
                  options={warehouses ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="authorized_production_types" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Production Types"
                  options={productionTypes ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="authorized_sale_types" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Sale Types"
                  options={saleTypes ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="authorized_purchase_types" render={({ field }) => (
              <FormItem>
                <MultiCheckboxField
                  label="Authorized Purchase Types"
                  options={purchaseTypes ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Toggle user status"
        description={`Change active status for "${toggleTarget?.full_name}"?`}
        onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user"
        description={`Permanently delete "${deleteTarget?.full_name}"? This will also delete their login account.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
};

export default WPEUserCreationPage;
