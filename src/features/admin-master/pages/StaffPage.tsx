import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { DepartmentField } from "@/features/admin-master/components/DepartmentField";
import { staffSchema, type StaffFormValues } from "@/features/admin-master/schemas";
import type { StaffRecord } from "@/features/admin-master/types";
import { useDepartmentOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: StaffFormValues = {
  staff_name: "",
  mobile_no: "",
  email: "",
  department: null,
  designation: "",
  is_active: true,
};

const StaffPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<StaffRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRecord | null>(null);
  const departmentOptions = useDepartmentOptions();
  const form = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema), defaultValues });

  const query = useQuery({
    queryKey: adminMasterKeys.entity("staff", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () => adminMasterApi.listStaff({ page: table.page, pageSize: table.pageSize, search: debouncedSearch, ordering: table.ordering }),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createStaff, queryKey: ["admin-master", "staff"], successMessage: "Staff created successfully.", errorMessage: "Unable to create staff." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<StaffRecord> }) => adminMasterApi.updateStaff(id, payload), queryKey: ["admin-master", "staff"], successMessage: "Staff updated successfully.", errorMessage: "Unable to update staff." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleStaff, queryKey: ["admin-master", "staff"], successMessage: "Staff status updated.", errorMessage: "Unable to update staff status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteStaff, queryKey: ["admin-master", "staff"], successMessage: "Staff deleted successfully.", errorMessage: "Unable to delete staff." });

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Master" description="Manage staff profiles used for user-account creation and ownership mapping." />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Staff" onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }} />
      <MasterTable
        columns={[
          { key: "staff_id", title: "Staff ID", render: (record) => <span className="font-mono text-xs">{record.staff_id || "-"}</span> },
          { key: "staff_name", title: "Staff Name", render: (record) => <div className="font-medium">{record.staff_name}</div> },
          { key: "mobile_no", title: "Mobile", render: (record) => record.mobile_no || "-" },
          { key: "email", title: "Email", render: (record) => record.email || "-" },
          { key: "designation", title: "Designation", render: (record) => record.designation || "-" },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset(record); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Staff could not be loaded."
        emptyTitle="No staff found"
        emptyDescription="Create staff members before provisioning user accounts."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Staff" : "Create Staff"} description="Department lookup will switch to manual ID entry until the backend exposes a department endpoint.">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (values) => {
            try {
              if (editing) await updateMutation.mutateAsync({ id: editing.id, payload: values });
              else await createMutation.mutateAsync(values);
              setDialogOpen(false);
              form.reset(defaultValues);
            } catch (error) {
              applyBackendErrors(error, form.setError);
            }
          })} className="space-y-4">
            <FormField control={form.control} name="staff_name" render={({ field }) => <FormItem><FormLabel>Staff name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="mobile_no" render={({ field }) => <FormItem><FormLabel>Mobile no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="department" render={({ field }) => <DepartmentField value={field.value} onChange={field.onChange} options={departmentOptions.data ?? []} />} />
            <FormField control={form.control} name="designation" render={({ field }) => <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>Active status</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create Staff"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update staff status" description={`Change the status for ${toggleTarget?.staff_name ?? "this staff member"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete staff" description={`Delete ${deleteTarget?.staff_name ?? "this staff member"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default StaffPage;
