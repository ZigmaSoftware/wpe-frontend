import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import {
  unitMasterSchema,
  type UnitMasterFormValues,
} from "@/features/wpe-masters/schemas/masters";
import { getApiErrorMessage } from "@/lib/api-helpers";
import type { UnitMasterRecord } from "@/features/wpe-masters/types";

const defaultValues: UnitMasterFormValues = {
  uom_code: "",
  name: "",
  decimal_allowed: false,
  decimal_places: 0,
  is_active: true,
};

const UnitMasterPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitMasterRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UnitMasterRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitMasterRecord | null>(null);

  const form = useForm<UnitMasterFormValues>({
    resolver: zodResolver(unitMasterSchema),
    defaultValues,
  });

  const query = useQuery({
    queryKey: ["wpe-masters", "units", page, pageSize, search],
    queryFn: () => wpeMastersApi.units.list({ page, pageSize, search }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wpe-masters", "units"] });
  };

  const createMutation = useMutation({
    mutationFn: wpeMastersApi.units.create,
    onSuccess: async () => {
      toast.success("Unit created.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create unit.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UnitMasterFormValues> }) => wpeMastersApi.units.update(id, payload),
    onSuccess: async () => {
      toast.success("Unit updated.");
      await invalidate();
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update unit.")),
  });

  const toggleMutation = useMutation({
    mutationFn: wpeMastersApi.units.toggle,
    onSuccess: async () => {
      toast.success("Status updated.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update status.")),
  });

  const deleteMutation = useMutation({
    mutationFn: wpeMastersApi.units.delete,
    onSuccess: async () => {
      toast.success("Unit deleted.");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete unit.")),
  });

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Unit" description="Manage unit of measurement records used by item setup." />
      <MasterToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        createLabel="Add Unit"
        onCreate={() => {
          setEditing(null);
          form.reset(defaultValues);
          setDialogOpen(true);
        }}
      />
      <MasterTable
        columns={[
          {
            key: "uom_code",
            title: "UOM Code",
            render: (record) => <span className="font-mono text-xs text-muted-foreground">{record.uom_code}</span>,
          },
          {
            key: "name",
            title: "UOM Name",
            render: (record) => <span className="font-medium">{record.name}</span>,
          },
          {
            key: "decimal",
            title: "Decimal",
            render: (record) => `${record.decimal_allowed ? "Yes" : "No"}${record.decimal_allowed ? ` (${record.decimal_places})` : ""}`,
          },
          {
            key: "status",
            title: "Status",
            render: (record) => <MasterStatusBadge active={record.is_active} />,
          },
          {
            key: "actions",
            title: "Actions",
            className: "w-[140px] text-right",
            render: (record) => (
              <RowActions
                onEdit={() => {
                  setEditing(record);
                  form.reset({
                    uom_code: record.uom_code,
                    name: record.name,
                    decimal_allowed: record.decimal_allowed,
                    decimal_places: record.decimal_places,
                    is_active: record.is_active,
                  });
                  setDialogOpen(true);
                }}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Unit records could not be loaded."
        emptyTitle="No unit records"
        emptyDescription="Add a new unit record to get started."
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
        title={editing ? "Edit Unit" : "Create Unit"}
        description="Configure unit codes, names, and decimal precision behavior."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const payload = {
                ...values,
                decimal_places: values.decimal_allowed ? values.decimal_places : 0,
              };
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload });
              } else {
                await createMutation.mutateAsync(payload);
              }
              form.reset(defaultValues);
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="uom_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UOM Code*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="KG" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UOM Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Kilogram" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="decimal_allowed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                    <FormLabel>Decimal Allowed</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("decimal_places", 0, { shouldValidate: true });
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decimal_places"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimal Places</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value}
                        disabled={!form.watch("decimal_allowed")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {editing ? "Save Changes" : "Create Unit"}
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
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
          }
          setToggleTarget(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Unit"
        description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default UnitMasterPage;
