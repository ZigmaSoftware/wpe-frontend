import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { userScreenSchema, type UserScreenFormValues } from "@/features/admin-master/schemas";
import type { UserScreenRecord } from "@/features/admin-master/types";
import { useMainScreenOptions, useScreenSectionOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const actions = ["add", "update", "list", "delete", "view", "print"] as const;
const defaultValues: UserScreenFormValues = {
  main_screen: 0,
  screen_section: 0,
  screen_name: "",
  code: "",
  route_path: "",
  order_no: 1,
  icon: "",
  description: "",
  is_active: true,
  available_actions: ["list", "view"],
};

const UserScreensPage = () => {
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserScreenRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserScreenRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserScreenRecord | null>(null);
  const [mainScreenFilter, setMainScreenFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const mainScreenOptions = useMainScreenOptions();
  const form = useForm<UserScreenFormValues>({ resolver: zodResolver(userScreenSchema), defaultValues });
  const selectedMainScreen = useWatch({ control: form.control, name: "main_screen" });
  const sectionOptions = useScreenSectionOptions(selectedMainScreen || undefined);

  useEffect(() => {
    if (!selectedMainScreen) {
      form.setValue("screen_section", 0);
    }
  }, [form, selectedMainScreen]);

  const filterKey = useMemo(() => JSON.stringify({ mainScreenFilter, sectionFilter }), [mainScreenFilter, sectionFilter]);
  const query = useQuery({
    queryKey: adminMasterKeys.entity("user-screens", table.page, table.pageSize, debouncedSearch, table.ordering, filterKey),
    queryFn: () => adminMasterApi.listUserScreens({
      page: table.page,
      pageSize: table.pageSize,
      search: debouncedSearch,
      ordering: table.ordering,
      filters: {
        main_screen: mainScreenFilter === "all" ? undefined : Number(mainScreenFilter),
        screen_section: sectionFilter === "all" ? undefined : Number(sectionFilter),
      },
    }),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createUserScreen, queryKey: ["admin-master", "user-screens"], successMessage: "User screen created successfully.", errorMessage: "Unable to create user screen." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<UserScreenRecord> }) => adminMasterApi.updateUserScreen(id, payload), queryKey: ["admin-master", "user-screens"], successMessage: "User screen updated successfully.", errorMessage: "Unable to update user screen." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleUserScreen, queryKey: ["admin-master", "user-screens"], successMessage: "User screen status updated.", errorMessage: "Unable to update user screen status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteUserScreen, queryKey: ["admin-master", "user-screens"], successMessage: "User screen deleted successfully.", errorMessage: "Unable to delete user screen." });

  const filterSections = useScreenSectionOptions(mainScreenFilter === "all" ? undefined : Number(mainScreenFilter));

  return (
    <div className="space-y-6">
      <PageHeader title="User Screen Master" description="Define screen-level routes, icons, and available actions." />
      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add User Screen"
        onCreate={() => {
          setEditing(null);
          form.reset(defaultValues);
          setDialogOpen(true);
        }}
        filters={
          <>
            <Select value={mainScreenFilter} onValueChange={(value) => { setMainScreenFilter(value); setSectionFilter("all"); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Main screen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All main screens</SelectItem>
                {(mainScreenOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {(filterSections.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
      />
      <MasterTable
        columns={[
          { key: "screen_name", title: "Screen Name", render: (record) => <div className="font-medium">{record.screen_name}</div> },
          { key: "main_screen_name", title: "Main Screen", render: (record) => record.main_screen_name || "-" },
          { key: "screen_section_name", title: "Section", render: (record) => record.screen_section_name || "-" },
          { key: "route_path", title: "Route", render: (record) => <span className="font-mono text-xs">{record.route_path || "-"}</span> },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          { key: "actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset({ ...record, available_actions: record.available_actions }); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} isActive={record.is_active} /> },
        ]}
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="User screens could not be loaded."
        emptyTitle="No user screens found"
        emptyDescription="Create route-aware user screens and action sets."
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => query.refetch()}
      />
      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit User Screen" : "Create User Screen"} description="Available actions define which RBAC permissions can later be granted on this screen.">
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
            <FormField control={form.control} name="main_screen" render={({ field }) => <FormItem><FormLabel>Main screen</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => { field.onChange(Number(value)); form.setValue("screen_section", 0); }}><FormControl><SelectTrigger><SelectValue placeholder="Select main screen" /></SelectTrigger></FormControl><SelectContent>{(mainScreenOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="screen_section" render={({ field }) => <FormItem><FormLabel>Screen section</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger></FormControl><SelectContent>{(sectionOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="screen_name" render={({ field }) => <FormItem><FormLabel>Screen name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="code" render={({ field }) => <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="route_path" render={({ field }) => <FormItem><FormLabel>Route path</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="/admin/main-screens" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="icon" render={({ field }) => <FormItem><FormLabel>Icon</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="order_no" render={({ field }) => <FormItem><FormLabel>Order no</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>} />
            <FormField
              control={form.control}
              name="available_actions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available actions</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {actions.map((action) => {
                        const checked = field.value.includes(action);
                        return (
                          <label key={action} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                field.onChange(
                                  next ? [...field.value, action] : field.value.filter((item) => item !== action),
                                )
                              }
                            />
                            <span className="capitalize">{action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center justify-between rounded-xl border border-border p-4"><FormLabel>Active status</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create User Screen"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>
      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update user screen status" description={`Change the status for ${toggleTarget?.screen_name ?? "this user screen"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete user screen" description={`Delete ${deleteTarget?.screen_name ?? "this user screen"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default UserScreensPage;
