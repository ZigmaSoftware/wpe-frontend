import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import type { MasterRecord, TableParams } from "@/features/wpe-masters/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface MasterApiResource {
  list: (params: TableParams) => Promise<{ items: MasterRecord[]; total: number }>;
  create: (payload: { name: string; is_active?: boolean }) => Promise<MasterRecord>;
  update: (id: number, payload: Partial<{ name: string; is_active?: boolean }>) => Promise<MasterRecord>;
  delete: (id: number) => Promise<void>;
  toggle: (id: number) => Promise<MasterRecord>;
}

interface Props {
  title: string;
  description: string;
  queryKey: string;
  api: MasterApiResource;
}

const defaultValues: FormValues = { name: "", is_active: true };

const SimpleMasterPage = ({ title, description, queryKey, api }: Props) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<MasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterRecord | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const qkey = ["wpe-masters", queryKey, page, pageSize, search];

  const query = useQuery({
    queryKey: qkey,
    queryFn: () => api.list({ page, pageSize, search }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wpe-masters", queryKey] });

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => { toast.success(`${title} created.`); invalidate(); setDialogOpen(false); },
    onError: () => toast.error(`Failed to create ${title}.`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FormValues> }) => api.update(id, payload),
    onSuccess: () => { toast.success(`${title} updated.`); invalidate(); setDialogOpen(false); },
    onError: () => toast.error(`Failed to update ${title}.`),
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggle,
    onSuccess: () => { toast.success("Status updated."); invalidate(); },
    onError: () => toast.error("Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: api.delete,
    onSuccess: () => { toast.success(`${title} deleted.`); invalidate(); },
    onError: () => toast.error(`Failed to delete ${title}.`),
  });

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <MasterToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        createLabel={`Add ${title}`}
        onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }}
      />
      <MasterTable
        columns={[
          { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "is_active", title: "Status", render: (r) => <MasterStatusBadge active={r.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[120px] text-right",
            render: (r) => (
              <RowActions
                onEdit={() => { setEditing(r); form.reset({ name: r.name, is_active: r.is_active }); setDialogOpen(true); }}
                onToggle={() => setToggleTarget(r)}
                onDelete={() => setDeleteTarget(r)}
                isActive={r.is_active}
              />
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription={`${title} records could not be loaded.`}
        emptyTitle={`No ${title} records`}
        emptyDescription={`Add a new record to get started.`}
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
        title={editing ? `Edit ${title}` : `Add ${title}`}
        description={`${editing ? "Update the" : "Create a new"} ${title} record.`}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: values });
              } else {
                await createMutation.mutateAsync(values);
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={`Enter ${title} name`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : `Create ${title}`}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Toggle status"
        description={`Change the active status for "${toggleTarget?.name}"?`}
        onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${title}`}
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
};

export default SimpleMasterPage;
