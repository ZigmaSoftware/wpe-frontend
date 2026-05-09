import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { userTypeSchema, type UserTypeFormValues } from "@/features/admin-master/schemas";
import type { UserTypeRecord } from "@/features/admin-master/types";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: UserTypeFormValues = {
  user_type: "",
  code: "",
  is_active: true,
  under_users: "",
  company_wise: false,
  project_wise: false,
  department_wise: false,
  user_wise: false,
};

const UserTypesPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserTypeRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserTypeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserTypeRecord | null>(null);
  const form = useForm<UserTypeFormValues>({ resolver: zodResolver(userTypeSchema), defaultValues });

  const query = useQuery({
    queryKey: adminMasterKeys.entity("user-types", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () => adminMasterApi.listUserTypes({ page: table.page, pageSize: table.pageSize, search: debouncedSearch, ordering: table.ordering }),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createUserType, queryKey: ["admin-master", "user-types"], successMessage: "User type created successfully.", errorMessage: "Unable to create user type." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<UserTypeRecord> }) => adminMasterApi.updateUserType(id, payload), queryKey: ["admin-master", "user-types"], successMessage: "User type updated successfully.", errorMessage: "Unable to update user type." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleUserType, queryKey: ["admin-master", "user-types"], successMessage: "User type status updated.", errorMessage: "Unable to update user type status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteUserType, queryKey: ["admin-master", "user-types"], successMessage: "User type deleted successfully.", errorMessage: "Unable to delete user type." });

  return (
    <div className="space-y-6">
      <PageHeader title="User Type Master" description="Configure RBAC subject types and organizational scoping flags." />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add User Type" onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }} />
      <MasterTable
        columns={[
          { key: "user_type", title: "User Type", render: (record) => <div className="font-medium">{record.user_type}</div> },
          { key: "code", title: "Code", render: (record) => <span className="font-mono text-xs">{record.code}</span> },
          { key: "under_users", title: "Under Users", render: (record) => record.under_users || "-" },
          { key: "scoping", title: "Scoping", render: (record) => [record.company_wise && "Company", record.project_wise && "Project", record.department_wise && "Department", record.user_wise && "User"].filter(Boolean).join(", ") || "-" },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset(record); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="User types could not be loaded."
        emptyTitle="No user types found"
        emptyDescription="Create user types before assigning permissions or user accounts."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit User Type" : "Create User Type"} description="User types drive RBAC resolution and organizational scope filtering.">
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
            <FormField control={form.control} name="user_type" render={({ field }) => <FormItem><FormLabel>User type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="code" render={({ field }) => <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="under_users" render={({ field }) => <FormItem><FormLabel>Under users</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            {(["company_wise", "project_wise", "department_wise", "user_wise"] as const).map((fieldName) => (
              <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>{fieldName.replaceAll("_", " ")}</FormLabel>
                </FormItem>
              )} />
            ))}
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Active status</FormLabel></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create User Type"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update user type status" description={`Change the status for ${toggleTarget?.user_type ?? "this user type"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete user type" description={`Delete ${deleteTarget?.user_type ?? "this user type"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default UserTypesPage;
