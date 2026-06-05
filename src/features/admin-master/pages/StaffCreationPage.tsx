import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { staffCreationSchema, type StaffCreationFormValues } from "@/features/admin-master/schemas";
import type { StaffCreationRecord, StaffCreationWritePayload } from "@/features/admin-master/types";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import FileField from "@/features/common-master/components/FileField";
import RowActions from "@/features/common-master/components/RowActions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";

const defaultValues: StaffCreationFormValues = {
  staff_code: "",
  name: "",
  age: 0,
  department: 0,
  role: 0,
  mobile: "",
  email: "",
  joining_date: "",
  gender: "",
  address: "",
  emergency_contact_no: "",
  photo: null,
  photo_url: "",
  is_active: true,
  remarks: "",
};

const StaffCreationPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffCreationRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<StaffCreationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffCreationRecord | null>(null);

  const form = useForm<StaffCreationFormValues>({
    resolver: zodResolver(staffCreationSchema),
    defaultValues,
  });
  const selectedDepartmentId = form.watch("department");

  const query = useQuery({
    queryKey: adminMasterKeys.entity("staff-creation", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () =>
      adminMasterApi.listStaffCreations({
        page: table.page,
        pageSize: table.pageSize,
        search: debouncedSearch,
        ordering: table.ordering,
      }),
  });
  const departmentOptionsQuery = useQuery({
    queryKey: adminMasterKeys.lookup("staff-departments"),
    queryFn: () => wpeMastersApi.departments.lookup(),
  });
  const roleOptionsQuery = useQuery({
    queryKey: adminMasterKeys.lookup("staff-roles", selectedDepartmentId || "all"),
    queryFn: () =>
      wpeMastersApi.roles.lookup(
        selectedDepartmentId
          ? { department: selectedDepartmentId, department_id: selectedDepartmentId }
          : undefined,
      ),
  });

  useEffect(() => {
    const currentRole = form.getValues("role");

    if (!selectedDepartmentId) {
      if (currentRole) {
        form.setValue("role", 0, { shouldValidate: true });
      }
      return;
    }

    if (!roleOptionsQuery.data) {
      return;
    }

    if (currentRole && !roleOptionsQuery.data.some((option) => option.id === currentRole)) {
      form.setValue("role", 0, { shouldValidate: true });
    }
  }, [form, roleOptionsQuery.data, selectedDepartmentId]);

  const createMutation = useAdminMutation({
    mutationFn: adminMasterApi.createStaffCreation,
    queryKey: ["admin-master", "staff"],
    successMessage: "Staff created successfully.",
    errorMessage: "Unable to create staff.",
  });
  const updateMutation = useAdminMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<StaffCreationWritePayload> }) =>
      adminMasterApi.updateStaffCreation(id, payload),
    queryKey: ["admin-master", "staff"],
    successMessage: "Staff updated successfully.",
    errorMessage: "Unable to update staff.",
  });
  const toggleMutation = useAdminMutation({
    mutationFn: adminMasterApi.toggleStaffCreation,
    queryKey: ["admin-master", "staff"],
    successMessage: "Staff status updated.",
    errorMessage: "Unable to update staff status.",
  });
  const deleteMutation = useAdminMutation({
    mutationFn: adminMasterApi.deleteStaffCreation,
    queryKey: ["admin-master", "staff"],
    successMessage: "Staff deleted successfully.",
    errorMessage: "Unable to delete staff.",
  });

  const openCreateDialog = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (record: StaffCreationRecord) => {
    setEditing(record);
    form.reset({
      staff_code: record.staff_code ?? "",
      name: record.name,
      age: record.age ?? 0,
      department: record.department ?? 0,
      role: record.role ?? 0,
      mobile: record.mobile ?? "",
      email: record.email ?? "",
      joining_date: record.joining_date ?? "",
      gender: record.gender ?? "",
      address: record.address ?? "",
      emergency_contact_no: record.emergency_contact_no ?? "",
      photo: null,
      photo_url: record.photo_url ?? "",
      is_active: record.is_active,
      remarks: record.remarks ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Creation"
        description="Create and maintain staff records for onboarding, employee setup, and admin operations."
      />
      <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Staff" onCreate={openCreateDialog} />
      <MasterTable
        columns={[
          { key: "staff_code", title: "Employee ID", render: (record) => <div className="font-medium">{record.staff_code || "-"}</div> },
          { key: "name", title: "Name", render: (record) => record.name },
          { key: "department_name", title: "Department", render: (record) => record.department_name || "-" },
          { key: "role_name", title: "Role", render: (record) => record.role_name || record.designation || "-" },
          { key: "mobile", title: "Phone No", render: (record) => record.mobile || "-" },
          { key: "email", title: "E-mail ID", render: (record) => record.email || "-" },
          {
            key: "is_active",
            title: "Active Status",
            render: (record) => (
              <Badge variant="outline" className={record.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                {record.is_active ? "Active" : "Inactive"}
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
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Staff records could not be loaded."
        emptyTitle="No staff found"
        emptyDescription="Create staff records to manage employee details from Admin Masters."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Staff" : "Create Staff"}
        description="Maintain employee profile, contact, status, and emergency information in one place."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const payload: StaffCreationWritePayload = {
                  ...values,
                  joining_date: values.joining_date || null,
                  gender: values.gender || null,
                  address: values.address || null,
                  emergency_contact_no: values.emergency_contact_no || null,
                  remarks: values.remarks || null,
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
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="staff_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID*</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age*</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department*</FormLabel>
                    <Select value={String(field.value ?? 0)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0" disabled>
                          Select department
                        </SelectItem>
                        {(departmentOptionsQuery.data ?? []).map((option) => (
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role*</FormLabel>
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!selectedDepartmentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDepartmentId ? "Select role" : "Select department first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0" disabled>
                          {selectedDepartmentId ? "Select role" : "Select department first"}
                        </SelectItem>
                        {(roleOptionsQuery.data ?? []).map((option) => (
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
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone No*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail ID*</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="joining_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_contact_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact No</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active Status*</FormLabel>
                    <Select value={field.value ? "active" : "inactive"} onValueChange={(value) => field.onChange(value === "active")}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormControl>
                      <FileField
                        label="Photo"
                        file={field.value}
                        existingUrl={form.watch("photo_url")}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Remarks / Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create Staff"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update staff status"
        description={`Change the active status for ${toggleTarget?.name ?? "this staff record"}?`}
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
        title="Delete staff"
        description={`Delete ${deleteTarget?.name ?? "this staff record"}?`}
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

export default StaffCreationPage;
