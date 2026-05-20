import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { DepartmentField } from "@/features/admin-master/components/DepartmentField";
import { userAccountSchema, type UserAccountFormValues } from "@/features/admin-master/schemas";
import type { UserAccountRecord, UserAccountWritePayload } from "@/features/admin-master/types";
import { useCompanyOptions, useDepartmentOptions, useStaffOptions, useUserTypeOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: UserAccountFormValues = {
  staff: 0,
  username: "",
  password: "",
  confirm_password: "",
  user_type: 0,
  mobile_no: "",
  email: "",
  first_name: "",
  last_name: "",
  company: null,
  department: null,
  project: "",
  under_users: "",
  account_status: "active",
  force_password_change: false,
  is_team_head: false,
  team_members: [],
  designation: "",
};

const UserAccountsPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccountRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserAccountRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAccountRecord | null>(null);
  const form = useForm<UserAccountFormValues>({ resolver: zodResolver(userAccountSchema), defaultValues });
  const staffOptions = useStaffOptions();
  const userTypeOptions = useUserTypeOptions();
  const companyOptions = useCompanyOptions();
  const departmentOptions = useDepartmentOptions();

  const query = useQuery({
    queryKey: adminMasterKeys.entity("user-accounts", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () => adminMasterApi.listUserAccounts({ page: table.page, pageSize: table.pageSize, search: debouncedSearch, ordering: table.ordering }),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createUserAccount, queryKey: ["admin-master", "user-accounts"], successMessage: "User account created successfully.", errorMessage: "Unable to create user account." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<UserAccountWritePayload> }) => adminMasterApi.updateUserAccount(id, payload), queryKey: ["admin-master", "user-accounts"], successMessage: "User account updated successfully.", errorMessage: "Unable to update user account." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleUserAccount, queryKey: ["admin-master", "user-accounts"], successMessage: "User account status updated.", errorMessage: "Unable to update user account status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteUserAccount, queryKey: ["admin-master", "user-accounts"], successMessage: "User account deleted successfully.", errorMessage: "Unable to delete user account." });

  const accountRecords = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return (
    <div className="space-y-6">
      <PageHeader title="User Account Creation" description="Provision authenticated users mapped to staff, user type, and organizational scope." />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add User Account" onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }} />
      <MasterTable
        columns={[
          { key: "username", title: "Username", render: (record) => <div className="font-medium">{record.username}</div> },
          { key: "staff_name", title: "Staff", render: (record) => record.staff_name || "-" },
          { key: "user_type_name", title: "User Type", render: (record) => record.user_type_name || "-" },
          { key: "company_name", title: "Company", render: (record) => record.company_name || "-" },
          { key: "account_status", title: "Account Status", render: (record) => record.account_status },
          { key: "last_login", title: "Last Login", render: (record) => record.last_login || "-" },
          { key: "is_active", title: "Active", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset({ ...defaultValues, ...record, password: "", confirm_password: "", first_name: "", last_name: "" }); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
        ]}
        records={accountRecords}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="User accounts could not be loaded."
        emptyTitle="No user accounts found"
        emptyDescription="Create user accounts after staff and user types are configured."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit User Account" : "Create User Account"} description="Passwords are only required when creating a new account or intentionally changing credentials." size="lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (values) => {
            try {
              const payload: UserAccountWritePayload = {
                ...values,
                password: values.password || undefined,
                confirm_password: values.confirm_password || undefined,
              };
              if (editing) await updateMutation.mutateAsync({ id: editing.id, payload });
              else await createMutation.mutateAsync(payload);
              setDialogOpen(false);
              form.reset(defaultValues);
            } catch (error) {
              applyBackendErrors(error, form.setError);
            }
          })} className="space-y-4">
            <FormField control={form.control} name="staff" render={({ field }) => <FormItem><FormLabel>Staff</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger></FormControl><SelectContent>{(staffOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="username" render={({ field }) => <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="user_type" render={({ field }) => <FormItem><FormLabel>User type</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger></FormControl><SelectContent>{(userTypeOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="company" render={({ field }) => <FormItem><FormLabel>Company</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No company</SelectItem>{(companyOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="department" render={({ field }) => <DepartmentField value={field.value} onChange={field.onChange} options={departmentOptions.data ?? []} />} />
            <FormField control={form.control} name="project" render={({ field }) => <FormItem><FormLabel>Project</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="under_users" render={({ field }) => <FormItem><FormLabel>Under users</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="account_status" render={({ field }) => <FormItem><FormLabel>Account status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="locked">Locked</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="confirm_password" render={({ field }) => <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="mobile_no" render={({ field }) => <FormItem><FormLabel>Mobile no</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="first_name" render={({ field }) => <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="last_name" render={({ field }) => <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FormField control={form.control} name="designation" render={({ field }) => <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField
              control={form.control}
              name="team_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team members</FormLabel>
                  <FormControl>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {accountRecords.filter((record) => !editing || record.id !== editing.id).map((record) => {
                        const checked = field.value.includes(record.id);
                        return (
                          <label key={record.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                            <Checkbox checked={checked} onCheckedChange={(next) => field.onChange(next ? [...field.value, record.id] : field.value.filter((id) => id !== record.id))} />
                            <span>{record.username}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField control={form.control} name="force_password_change" render={({ field }) => <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Force password change</FormLabel></FormItem>} />
              <FormField control={form.control} name="is_team_head" render={({ field }) => <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Is team head</FormLabel></FormItem>} />
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create User Account"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update user account status" description={`Change the status for ${toggleTarget?.username ?? "this account"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete user account" description={`Delete ${deleteTarget?.username ?? "this account"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default UserAccountsPage;
