import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import {
  useCompanyOptions,
  useUserCreationSelectOptions,
  useUserTypeOptions,
} from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { userCreationSchema, type UserCreationFormValues } from "@/features/admin-master/schemas";
import type { LookupOption, UserCreationRecord, UserCreationWritePayload } from "@/features/admin-master/types";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { cn } from "@/lib/utils";

const defaultValues: UserCreationFormValues = {
  staff: 0,
  user_type: 0,
  company: 0,
  username: "",
  password: "",
  confirm_password: "",
  account_status: "active",
  mobile_no: "",
  email: "",
};

const accountStatusClassNames: Record<UserCreationRecord["account_status"], string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  locked: "border-amber-200 bg-amber-50 text-amber-700",
};

const formatAccountStatus = (value: UserCreationRecord["account_status"]) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const StaffSelectField = ({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (next: number) => void;
  options: LookupOption[];
}) => {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  return (
    <FormItem>
      <FormLabel>FullName</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between px-3 font-normal"
            >
              <span className="truncate text-left">
                {selectedOption
                  ? [selectedOption.staff_code, selectedOption.name].filter(Boolean).join(" · ")
                  : "Search or select staff"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] max-w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search staff..." />
            <CommandList>
              <CommandEmpty>No staff found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.staff_code ?? ""} ${option.name} ${option.mobile ?? ""} ${option.email ?? ""}`}
                    onSelect={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className="items-start gap-3 px-3 py-2.5"
                  >
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", value === option.id ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-900">
                        {[option.staff_code, option.name].filter(Boolean).join(" · ") || option.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
                        {option.mobile ? <span>{option.mobile}</span> : null}
                        {option.email ? <span>{option.email}</span> : null}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};

const UserCreationPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserCreationRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserCreationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserCreationRecord | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<UserCreationFormValues>({ resolver: zodResolver(userCreationSchema), defaultValues });
  const userCreationSelectOptions = useUserCreationSelectOptions();
  const userTypeOptions = useUserTypeOptions();
  const companyOptions = useCompanyOptions();
  const selectedStaffId = form.watch("staff");
  const syncedStaffIdRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: adminMasterKeys.entity("user-creation", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () =>
      adminMasterApi.listUserCreations({
        page: table.page,
        pageSize: table.pageSize,
        search: debouncedSearch,
        ordering: table.ordering,
      }),
  });

  const createMutation = useAdminMutation({
    mutationFn: adminMasterApi.createUserCreation,
    queryKey: ["admin-master", "user-creation"],
    successMessage: "User created successfully.",
    errorMessage: "Unable to create user.",
  });
  const updateMutation = useAdminMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserCreationWritePayload> }) =>
      adminMasterApi.updateUserCreation(id, payload),
    queryKey: ["admin-master", "user-creation"],
    successMessage: "User updated successfully.",
    errorMessage: "Unable to update user.",
  });
  const toggleMutation = useAdminMutation({
    mutationFn: adminMasterApi.toggleUserCreation,
    queryKey: ["admin-master", "user-creation"],
    successMessage: "User status updated.",
    errorMessage: "Unable to update user status.",
  });
  const deleteMutation = useAdminMutation({
    mutationFn: adminMasterApi.deleteUserCreation,
    queryKey: ["admin-master", "user-creation"],
    successMessage: "User deleted successfully.",
    errorMessage: "Unable to delete user.",
  });

  const userRecords = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const staffOptions = useMemo(() => userCreationSelectOptions.data ?? [], [userCreationSelectOptions.data]);
  const selectedStaffOption = useMemo(
    () => staffOptions.find((option) => option.id === selectedStaffId) ?? null,
    [selectedStaffId, staffOptions],
  );
  const availableUserTypes = useMemo(() => userTypeOptions.data ?? [], [userTypeOptions.data]);

  useEffect(() => {
    if (!selectedStaffOption) {
      syncedStaffIdRef.current = null;
      return;
    }

    form.setValue("mobile_no", selectedStaffOption.mobile ?? "", { shouldValidate: true });
    form.setValue("email", selectedStaffOption.email ?? "", { shouldValidate: true });

    if (!userTypeOptions.isFetched) {
      return;
    }

    const staffChanged = syncedStaffIdRef.current !== selectedStaffOption.id;
    if (!staffChanged || editing) {
      syncedStaffIdRef.current = selectedStaffOption.id;
      return;
    }

    const matchedUserType = availableUserTypes.find(
      (option) =>
        option.department_id === (selectedStaffOption.department_id ?? null) &&
        option.role_id === (selectedStaffOption.role_id ?? null),
    );

    form.setValue("user_type", matchedUserType?.id ?? 0, { shouldValidate: true });
    syncedStaffIdRef.current = selectedStaffOption.id;
  }, [availableUserTypes, editing, form, selectedStaffOption, userTypeOptions.isFetched]);

  const openCreateDialog = () => {
    setEditing(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (record: UserCreationRecord) => {
    setEditing(record);
    setShowPassword(false);
    setShowConfirmPassword(false);
    form.reset({
      ...defaultValues,
      staff: record.staff,
      user_type: record.user_type ?? 0,
      company: record.company ?? 0,
      username: record.username,
      account_status: record.account_status,
      mobile_no: record.mobile_no ?? "",
      email: record.email ?? "",
      password: record.password ?? "",
      confirm_password: record.password ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Creation"
        description="Provision authenticated users mapped to staff, user type, and company."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add User" onCreate={openCreateDialog} />
      <MasterTable
        columns={[
          { key: "full_name", title: "FullName", render: (record) => <div className="font-medium">{record.full_name || "-"}</div> },
          { key: "department_name", title: "Department", render: (record) => record.department_name || "-" },
          { key: "role_name", title: "Role", render: (record) => record.role_name || "-" },
          { key: "company_name", title: "Company", render: (record) => record.company_name || "-" },
          { key: "username", title: "Username", render: (record) => record.username || "-" },
          { key: "mobile_no", title: "Mobile no", render: (record) => record.mobile_no || "-" },
          { key: "email", title: "Email", render: (record) => record.email || "-" },
          {
            key: "account_status",
            title: "Status",
            render: (record) => (
              <Badge variant="outline" className={accountStatusClassNames[record.account_status]}>
                {formatAccountStatus(record.account_status)}
              </Badge>
            ),
          },
          {
            key: "actions",
            title: "Actions",
            className: "w-[160px] text-right",
            render: (record) => (
              <RowActions
                onEdit={() => openEditDialog(record)}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
                isActive={record.is_active}
              />
            ),
          },
        ]}
        records={userRecords}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Users could not be loaded."
        emptyTitle="No users found"
        emptyDescription="Create users after staff, user types, and companies are configured."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setShowPassword(false);
            setShowConfirmPassword(false);
          }
        }}
        title={editing ? "Edit User" : "Create User"}
        description={
          editing
            ? "Use the eye icon to view the password, or edit it to change the user's login password."
            : "Enter and confirm the password for the new user."
        }
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              if (!editing && !values.password) {
                form.setError("password", { type: "manual", message: "Password is required." });
                return;
              }
              if (!editing && !values.confirm_password) {
                form.setError("confirm_password", { type: "manual", message: "Confirm password is required." });
                return;
              }

              try {
                const payload: UserCreationWritePayload = {
                  ...values,
                  password: values.password || undefined,
                  confirm_password: values.confirm_password || undefined,
                };
                if (editing) {
                  await updateMutation.mutateAsync({ id: editing.id, payload });
                } else {
                  await createMutation.mutateAsync(payload);
                }
                setDialogOpen(false);
                form.reset(defaultValues);
              } catch (error) {
                applyBackendErrors(error, form.setError);
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="staff"
              render={({ field }) => (
                <StaffSelectField value={field.value} onChange={field.onChange} options={staffOptions} />
              )}
            />
            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type*</FormLabel>
                  <Select value={String(field.value ?? 0)} onValueChange={(value) => field.onChange(Number(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Select user type
                      </SelectItem>
                      {availableUserTypes.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select value={String(field.value ?? 0)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0" disabled>
                          Select company
                        </SelectItem>
                        {(companyOptions.data ?? []).map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-700"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="account_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile no</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        title="Update user status"
        description={`Change the status for ${toggleTarget?.username ?? "this user"}?`}
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
        title="Delete user"
        description={`Delete ${deleteTarget?.username ?? "this user"}?`}
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

export default UserCreationPage;
