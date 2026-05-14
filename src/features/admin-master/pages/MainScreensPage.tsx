import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { mainScreenSchema, type MainScreenFormValues } from "@/features/admin-master/schemas";
import type { MainScreenRecord } from "@/features/admin-master/types";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: MainScreenFormValues = {
  screen_name: "",
  code: "",
  order_no: 1,
  is_active: true,
};

const MainScreensPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MainScreenRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<MainScreenRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MainScreenRecord | null>(null);
  const form = useForm<MainScreenFormValues>({ resolver: zodResolver(mainScreenSchema), defaultValues });

  const query = useQuery({
    queryKey: adminMasterKeys.entity("main-screens", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () => adminMasterApi.listMainScreens({ page: table.page, pageSize: table.pageSize, search: debouncedSearch, ordering: table.ordering }),
  });

  const createMutation = useAdminMutation({
    mutationFn: adminMasterApi.createMainScreen,
    queryKey: ["admin-master", "main-screens"],
    successMessage: "Main screen created successfully.",
    errorMessage: "Unable to create main screen.",
  });
  const updateMutation = useAdminMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<MainScreenRecord> }) => adminMasterApi.updateMainScreen(id, payload),
    queryKey: ["admin-master", "main-screens"],
    successMessage: "Main screen updated successfully.",
    errorMessage: "Unable to update main screen.",
  });
  const toggleMutation = useAdminMutation({
    mutationFn: adminMasterApi.toggleMainScreen,
    queryKey: ["admin-master", "main-screens"],
    successMessage: "Main screen status updated.",
    errorMessage: "Unable to update main screen status.",
  });
  const deleteMutation = useAdminMutation({
    mutationFn: adminMasterApi.deleteMainScreen,
    queryKey: ["admin-master", "main-screens"],
    successMessage: "Main screen deleted successfully.",
    errorMessage: "Unable to delete main screen.",
  });

  const records = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return (
    <div className="space-y-6">
      <PageHeader title="Main Screen Master" description="Manage top-level admin menu groups and screen codes." />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Main Screen" onCreate={() => {
        setEditing(null);
        form.reset(defaultValues);
        setDialogOpen(true);
      }} />
      <MasterTable
        columns={[
          { key: "screen_name", title: "Screen Name", render: (record) => <div className="font-medium">{record.screen_name}</div> },
          { key: "code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.code}</span> },
          { key: "order_no", title: "Order", render: (record) => record.order_no },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => {
            setEditing(record);
            form.reset(record);
            setDialogOpen(true);
          }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Main screens could not be loaded."
        emptyTitle="No main screens found"
        emptyDescription="Create the first main screen to start composing admin navigation."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Main Screen" : "Create Main Screen"} description="This master controls first-level admin navigation and route grouping.">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (values) => {
            try {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: values });
              } else {
                await createMutation.mutateAsync(values);
              }
              setDialogOpen(false);
              form.reset(defaultValues);
            } catch (error) {
              applyBackendErrors(error, form.setError);
            }
          })} className="space-y-4">
            <FormField control={form.control} name="screen_name" render={({ field }) => <FormItem><FormLabel>Screen name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="code" render={({ field }) => <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="order_no" render={({ field }) => <FormItem><FormLabel>Order no</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>Active status</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create Main Screen"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update main screen status" description={`Change the status for ${toggleTarget?.screen_name ?? "this main screen"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete main screen" description={`Delete ${deleteTarget?.screen_name ?? "this main screen"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default MainScreensPage;
