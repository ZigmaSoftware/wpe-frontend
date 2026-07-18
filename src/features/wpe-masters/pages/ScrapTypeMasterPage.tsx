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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { ScrapTypeMasterRecord, ScrapTypeValue } from "@/features/wpe-masters/types";

const SCRAP_TYPE_OPTIONS: Array<{ value: ScrapTypeValue; label: string }> = [
  { value: "STARTUP", label: "Startup" },
  { value: "SETUP", label: "Setup" },
  { value: "PROCESS", label: "Process" },
  { value: "DOWNTIME", label: "Downtime" },
];

const typeLabel = (value: ScrapTypeValue | string) =>
  SCRAP_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const schema = z.object({
  type: z.enum(["STARTUP", "SETUP", "PROCESS", "DOWNTIME"], {
    required_error: "Type is required.",
  }),
  name: z.string().trim().min(1, "Name is required.").max(200, "Name must be 200 characters or fewer."),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  type: "STARTUP",
  name: "",
  is_active: true,
};

const ScrapTypeMasterPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScrapTypeMasterRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ScrapTypeMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScrapTypeMasterRecord | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const query = useQuery({
    queryKey: ["wpe-masters", "scrap-types", page, pageSize, search],
    queryFn: () => wpeMastersApi.scrapTypes.list({ page, pageSize, search, ordering: "scrap_type,name" }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wpe-masters", "scrap-types"] });

  const createMutation = useMutation({
    mutationFn: wpeMastersApi.scrapTypes.create,
    onSuccess: async () => {
      toast.success("Scrap Type created.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create Scrap Type.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FormValues> }) =>
      wpeMastersApi.scrapTypes.update(id, payload),
    onSuccess: async () => {
      toast.success("Scrap Type updated.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update Scrap Type.")),
  });

  const toggleMutation = useMutation({
    mutationFn: wpeMastersApi.scrapTypes.toggle,
    onSuccess: async () => {
      toast.success("Status updated.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update status.")),
  });

  const deleteMutation = useMutation({
    mutationFn: wpeMastersApi.scrapTypes.delete,
    onSuccess: async () => {
      toast.success("Scrap Type deleted.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete Scrap Type.")),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (record: ScrapTypeMasterRecord) => {
    setEditing(record);
    form.reset({ type: record.type, name: record.name, is_active: record.is_active });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scrap Type" description="Manage production scrap categories used during PR scrap capture." />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel="Add Scrap Type"
        onCreate={openCreate}
      />
      <MasterTable
        columns={[
          { key: "type", title: "Type", render: (record) => typeLabel(record.type) },
          { key: "name", title: "Name", render: (record) => <span className="font-medium">{record.name}</span> },
          { key: "status", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          {
            key: "actions",
            title: "Action",
            className: "w-[120px] text-right",
            render: (record) => (
              <RowActions
                onEdit={() => openEdit(record)}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
                isActive={record.is_active}
              />
            ),
          },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Scrap Type records could not be loaded."
        emptyTitle="No Scrap Type records"
        emptyDescription="Add a scrap type to begin PR scrap capture."
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
        title={editing ? "Edit Scrap Type" : "Add Scrap Type"}
        description="Create and maintain scrap type records."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = { ...values, name: values.name.trim() };
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              form.reset(defaultValues);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SCRAP_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Scrap Type name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                  <FormLabel>Active Status*</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create Scrap Type"}
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
        onConfirm={() => {
          if (toggleTarget) toggleMutation.mutate(toggleTarget.id);
          setToggleTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Scrap Type"
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default ScrapTypeMasterPage;
