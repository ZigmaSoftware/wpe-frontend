import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { ActionPermissionsField } from "@/features/admin-master/components/ActionPermissionsField";
import { userPermissionSchema, type UserPermissionFormValues } from "@/features/admin-master/schemas";
import type { PermissionAssignmentEntry, UserPermissionRecord } from "@/features/admin-master/types";
import { useMainScreenOptions, useScreenSectionOptions, useUserScreenOptions, useUserTypeOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const defaultValues: UserPermissionFormValues = {
  user_type: 0,
  scope_type: "screen",
  main_screen: 0,
  screen_section: null,
  user_screen: null,
  action_permissions: { add: false, update: false, list: true, delete: false, view: true, print: false, all: false },
  is_active: true,
};

const UserPermissionsPage = () => {
  const queryClient = useQueryClient();
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserPermissionRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserPermissionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserPermissionRecord | null>(null);
  const [bulkUserType, setBulkUserType] = useState<number | null>(null);
  const [previewUserType, setPreviewUserType] = useState<number | null>(null);
  const [previewUserId, setPreviewUserId] = useState<number | null>(null);
  const form = useForm<UserPermissionFormValues>({ resolver: zodResolver(userPermissionSchema), defaultValues });
  const selectedScopeType = useWatch({ control: form.control, name: "scope_type" });
  const selectedMainScreen = useWatch({ control: form.control, name: "main_screen" });
  const selectedSection = useWatch({ control: form.control, name: "screen_section" });
  const mainScreenOptions = useMainScreenOptions();
  const screenSectionOptions = useScreenSectionOptions(selectedMainScreen || undefined);
  const userScreenOptions = useUserScreenOptions(
    selectedScopeType === "screen" ? (selectedMainScreen || undefined) : undefined,
    selectedScopeType === "screen" ? (selectedSection || undefined) : undefined,
  );
  const userTypeOptions = useUserTypeOptions();
  const userAccountOptions = useQuery({
    queryKey: adminMasterKeys.lookup("user-account-options"),
    queryFn: async () => {
      const result = await adminMasterApi.listUserAccounts({ page: 1, pageSize: 200, search: "" });
      return result.items;
    },
  });

  const query = useQuery({
    queryKey: adminMasterKeys.entity("user-permissions", table.page, table.pageSize, debouncedSearch, table.ordering, ""),
    queryFn: () => adminMasterApi.listUserPermissions({ page: table.page, pageSize: table.pageSize, search: debouncedSearch, ordering: table.ordering }),
  });

  const allScreensQuery = useQuery({
    queryKey: adminMasterKeys.entity("user-screens-bulk", 1, 200, "", "", ""),
    queryFn: async () => {
      const [mainScreens, sections, screens] = await Promise.all([
        adminMasterApi.listMainScreens({ page: 1, pageSize: 200, search: "" }),
        adminMasterApi.listScreenSections({ page: 1, pageSize: 200, search: "" }),
        adminMasterApi.listUserScreens({ page: 1, pageSize: 200, search: "" }),
      ]);
      return { mainScreens: mainScreens.items, sections: sections.items, screens: screens.items };
    },
  });

  const resolvedQuery = useQuery({
    queryKey: adminMasterKeys.permissionsResolved(`${previewUserType ?? "self"}-${previewUserId ?? "none"}`),
    queryFn: () => adminMasterApi.fetchResolvedPermissions({ userTypeId: previewUserType, userId: previewUserId }),
    enabled: Boolean(previewUserType || previewUserId),
  });

  const createMutation = useAdminMutation({ mutationFn: adminMasterApi.createUserPermission, queryKey: ["admin-master", "user-permissions"], successMessage: "User permission created successfully.", errorMessage: "Unable to create user permission." });
  const updateMutation = useAdminMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<UserPermissionRecord> }) => adminMasterApi.updateUserPermission(id, payload), queryKey: ["admin-master", "user-permissions"], successMessage: "User permission updated successfully.", errorMessage: "Unable to update user permission." });
  const toggleMutation = useAdminMutation({ mutationFn: adminMasterApi.toggleUserPermission, queryKey: ["admin-master", "user-permissions"], successMessage: "User permission status updated.", errorMessage: "Unable to update user permission status." });
  const deleteMutation = useAdminMutation({ mutationFn: adminMasterApi.deleteUserPermission, queryKey: ["admin-master", "user-permissions"], successMessage: "User permission deleted successfully.", errorMessage: "Unable to delete user permission." });

  const [bulkSelections, setBulkSelections] = useState<Record<string, PermissionAssignmentEntry>>({});
  const bulkMutation = useMutation({
    mutationFn: async () => {
      if (!bulkUserType) throw new Error("User type is required.");
      return adminMasterApi.assignUserPermissions(bulkUserType, Object.values(bulkSelections));
    },
    onSuccess: async () => {
      toast.success("Permissions assigned successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-master", "user-permissions"] });
      if (bulkUserType) {
        setPreviewUserType(bulkUserType);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to assign permissions."),
  });

  const hierarchy = useMemo(() => {
    if (!allScreensQuery.data) return [];
    return allScreensQuery.data.mainScreens.map((main) => ({
      ...main,
      sections: allScreensQuery.data.sections
        .filter((section) => section.main_screen === main.id)
        .map((section) => ({
          ...section,
          screens: allScreensQuery.data.screens.filter((screen) => screen.main_screen === main.id && screen.screen_section === section.id),
        })),
    }));
  }, [allScreensQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader title="User Permission / RBAC Assignment" description="Manage granular action permissions and bulk-assign screen access by user type." />
      <Tabs defaultValue="rows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rows">Row CRUD</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Assign</TabsTrigger>
          <TabsTrigger value="preview">Resolved Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="rows" className="space-y-4">
          <MasterToolbar search={table.search} onSearchChange={table.setSearch} createLabel="Add Permission" onCreate={() => { setEditing(null); form.reset(defaultValues); setDialogOpen(true); }} />
          <MasterTable
            columns={[
              { key: "user_type_name", title: "User Type", render: (record) => record.user_type_name || "-" },
              { key: "scope_type", title: "Scope", render: (record) => record.scope_type },
              { key: "main_screen_name", title: "Main Screen", render: (record) => record.main_screen_name || "-" },
              { key: "screen_section_name", title: "Section", render: (record) => record.screen_section_name || "-" },
              { key: "user_screen_name", title: "User Screen", render: (record) => record.user_screen_name || "-" },
              { key: "actions", title: "Granted Actions", render: (record) => Object.entries(record.action_permissions).filter(([, granted]) => granted).map(([name]) => name).join(", ") || "-" },
              { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
              { key: "row-actions", title: "Actions", className: "w-[160px] text-right", render: (record) => <RowActions onEdit={() => { setEditing(record); form.reset(record); setDialogOpen(true); }} onToggle={() => setToggleTarget(record)} onDelete={() => setDeleteTarget(record)} /> },
            ]}
            records={query.data?.items ?? []}
            isLoading={query.isLoading}
            isError={query.isError}
            errorDescription="User permissions could not be loaded."
            emptyTitle="No permissions found"
            emptyDescription="Create row-based permissions or use bulk assignment."
            page={table.page}
            pageSize={table.pageSize}
            total={query.data?.filtered ?? 0}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            onRetry={() => query.refetch()}
          />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="space-y-4">
                <div className="text-sm font-semibold">Assignment Target</div>
                <Select value={bulkUserType ? String(bulkUserType) : undefined} onValueChange={(value) => setBulkUserType(Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger>
                  <SelectContent>
                    {(userTypeOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="w-full" disabled={!bulkUserType || bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>
                  Save Bulk Assignment
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              {allScreensQuery.isLoading ? <LoadingState label="Loading permission tree..." /> : null}
              {allScreensQuery.isError ? <ErrorState description="Permission tree could not be loaded." /> : null}
              {!allScreensQuery.isLoading && !allScreensQuery.isError ? (
                <div className="space-y-4">
                  {hierarchy.map((main) => (
                    <div key={main.id} className="rounded-xl border border-border p-4">
                      <div className="mb-3 text-sm font-semibold">{main.screen_name}</div>
                      <div className="space-y-3">
                        {main.sections.map((section) => (
                          <div key={section.id} className="rounded-lg border border-border/70 p-3">
                            <div className="mb-2 text-sm font-medium">{section.section_name}</div>
                            <div className="space-y-3">
                              {section.screens.map((screen) => {
                                const key = String(screen.id);
                                const current = bulkSelections[key] ?? {
                                  scope_type: "screen" as const,
                                  main_screen: main.id,
                                  screen_section: section.id,
                                  user_screen: screen.id,
                                  action_permissions: { list: true, view: true },
                                  is_active: true,
                                };
                                return (
                                  <div key={screen.id} className="rounded-lg border border-dashed border-border p-3">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                      <Checkbox
                                        checked={Boolean(bulkSelections[key])}
                                        onCheckedChange={(checked) =>
                                          setBulkSelections((prev) => {
                                            const next = { ...prev };
                                            if (checked) next[key] = current;
                                            else delete next[key];
                                            return next;
                                          })
                                        }
                                      />
                                      <span>{screen.screen_name}</span>
                                      <span className="text-xs text-muted-foreground">{resolveAdminRoutePath(screen.code, screen.route_path)}</span>
                                    </label>
                                    {bulkSelections[key] ? (
                                      <div className="grid gap-2 sm:grid-cols-3">
                                        {(["add", "update", "list", "delete", "view", "print"] as const).map((action) => (
                                          <label key={action} className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs">
                                            <Checkbox
                                              checked={Boolean(bulkSelections[key].action_permissions?.[action])}
                                              onCheckedChange={(checked) =>
                                                setBulkSelections((prev) => ({
                                                  ...prev,
                                                  [key]: {
                                                    ...prev[key],
                                                    action_permissions: {
                                                      ...prev[key].action_permissions,
                                                      [action]: Boolean(checked),
                                                    },
                                                  },
                                                }))
                                              }
                                            />
                                            <span className="capitalize">{action}</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="text-sm font-semibold">Preview By User Type</div>
              <Select value={previewUserType ? String(previewUserType) : "none"} onValueChange={(value) => { setPreviewUserType(value === "none" ? null : Number(value)); setPreviewUserId(null); }}>
                <SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No user type</SelectItem>
                  {(userTypeOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="text-sm font-semibold">Preview By User Account</div>
              <Select value={previewUserId ? String(previewUserId) : "none"} onValueChange={(value) => { setPreviewUserId(value === "none" ? null : Number(value)); setPreviewUserType(null); }}>
                <SelectTrigger><SelectValue placeholder="Select user account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No user account</SelectItem>
                  {(userAccountOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              {resolvedQuery.isLoading ? <LoadingState label="Resolving permissions..." /> : null}
              {resolvedQuery.isError ? <ErrorState description="Resolved permissions could not be loaded." /> : null}
              {resolvedQuery.data ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold">Resolved Menu Preview</div>
                    <div className="mt-2 space-y-3">
                      {resolvedQuery.data.menu.map((main) => (
                        <div key={main.id} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{main.name}</div>
                          {main.sections.map((section) => (
                            <div key={section.id} className="mt-2">
                              <div className="text-sm text-muted-foreground">{section.name}</div>
                              <div className="mt-1 space-y-1">
                                {section.screens.map((screen) => (
                                  <div key={screen.id} className="text-sm">
                                    {screen.screen_name} · {Object.entries(screen.action_permissions).filter(([, granted]) => granted).map(([name]) => name).join(", ")}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Raw Resolved Payload</div>
                    <pre className="mt-2 max-h-[320px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                      {JSON.stringify(resolvedQuery.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <EmptyState title="No preview selected" description="Select a user type or user account to preview resolved permissions and menu output." />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MasterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Permission" : "Create Permission"} description="Row-based CRUD is useful for exact overrides and targeted updates." size="lg">
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
            <FormField control={form.control} name="user_type" render={({ field }) => <FormItem><FormLabel>User type</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select user type" /></SelectTrigger></FormControl><SelectContent>{(userTypeOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="scope_type" render={({ field }) => <FormItem><FormLabel>Scope type</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="main_screen">Main Screen</SelectItem><SelectItem value="section">Section</SelectItem><SelectItem value="screen">Screen</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="main_screen" render={({ field }) => <FormItem><FormLabel>Main screen</FormLabel><Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => { field.onChange(Number(value)); form.setValue("screen_section", null); form.setValue("user_screen", null); }}><FormControl><SelectTrigger><SelectValue placeholder="Select main screen" /></SelectTrigger></FormControl><SelectContent>{(mainScreenOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="screen_section" render={({ field }) => <FormItem><FormLabel>Screen section</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => { field.onChange(value === "none" ? null : Number(value)); form.setValue("user_screen", null); }}><FormControl><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No section</SelectItem>{(screenSectionOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="user_screen" render={({ field }) => <FormItem><FormLabel>User screen</FormLabel><Select value={field.value ? String(field.value) : "none"} onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Select user screen" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No user screen</SelectItem>{(userScreenOptions.data ?? []).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="action_permissions" render={({ field }) => <ActionPermissionsField value={field.value} onChange={field.onChange} />} />
            <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Active status</FormLabel></FormItem>} />
            <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? "Save Changes" : "Create Permission"}</Button></div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)} title="Update permission status" description={`Change the status for ${toggleTarget?.user_screen_name ?? "this permission"}?`} onConfirm={() => { if (toggleTarget) toggleMutation.mutate(toggleTarget.id); setToggleTarget(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete permission" description={`Delete ${deleteTarget?.user_screen_name ?? "this permission"}?`} confirmLabel="Delete" onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
};

export default UserPermissionsPage;
