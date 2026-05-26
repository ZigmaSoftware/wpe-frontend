import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { useUserTypeOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import type { AdminAction, UserScreenPermissionRecord } from "@/features/admin-master/types";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";

const ACTIONS: AdminAction[] = ["add", "update", "list", "delete", "view", "print"];

const getPermissionTargetLabel = (record: UserScreenPermissionRecord | null) =>
  record?.user_screen_name || record?.screen_section_name || record?.main_screen_name || record?.user_type_name || "this permission";

const formatScopeLabel = (value: UserScreenPermissionRecord["scope_type"]) =>
  value
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

const UserScreenPermissionPage = () => {
  const navigate = useNavigate();
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [toggleTarget, setToggleTarget] = useState<UserScreenPermissionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserScreenPermissionRecord | null>(null);
  const [previewUserType, setPreviewUserType] = useState<number | null>(null);
  const [previewUserId, setPreviewUserId] = useState<number | null>(null);

  const userTypeOptions = useUserTypeOptions();

  const userCreationOptions = useQuery({
    queryKey: adminMasterKeys.lookup("user-creation-preview-options"),
    queryFn: async () => {
      const result = await adminMasterApi.listUserCreations({ page: 1, pageSize: 200, search: "" });
      return result.items;
    },
  });

  const permissionsQuery = useQuery({
    queryKey: adminMasterKeys.entity(
      "user-screen-permission",
      table.page,
      table.pageSize,
      debouncedSearch,
      table.ordering,
      "",
    ),
    queryFn: () =>
      adminMasterApi.listUserScreenPermissions({
        page: table.page,
        pageSize: table.pageSize,
        search: debouncedSearch,
        ordering: table.ordering,
      }),
  });

  const resolvedQuery = useQuery({
    queryKey: adminMasterKeys.permissionsResolved(`${previewUserType ?? "self"}-${previewUserId ?? "none"}`),
    queryFn: () => adminMasterApi.fetchResolvedPermissions({ userTypeId: previewUserType, userId: previewUserId }),
    enabled: Boolean(previewUserType || previewUserId),
  });

  const toggleMutation = useAdminMutation({
    mutationFn: adminMasterApi.toggleUserScreenPermission,
    queryKey: ["admin-master", "user-screen-permission"],
    successMessage: "User screen permission status updated.",
    errorMessage: "Unable to update user screen permission status.",
  });

  const deleteMutation = useAdminMutation({
    mutationFn: adminMasterApi.deleteUserScreenPermission,
    queryKey: ["admin-master", "user-screen-permission"],
    successMessage: "User screen permission deleted successfully.",
    errorMessage: "Unable to delete user screen permission.",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Screen Permission"
        description="Manage stored permission rows, launch the new bulk assignment page, and preview resolved access by user type or user."
      />

      <Tabs defaultValue="rows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rows">Permissions</TabsTrigger>
          <TabsTrigger value="preview">Resolved Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="rows" className="space-y-4">
          <MasterToolbar
            search={table.search}
            onSearchChange={table.setSearch}
            createLabel="Add Permission"
            onCreate={() => navigate("/admin/user-screen-permission/new")}
          />

          <MasterTable
            columns={[
              { key: "user_type_name", title: "User Type", render: (record) => record.user_type_name || "-" },
              {
                key: "scope_type",
                title: "Scope",
                render: (record) => (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {formatScopeLabel(record.scope_type)}
                  </span>
                ),
              },
              { key: "main_screen_name", title: "Main Screen", render: (record) => record.main_screen_name || "-" },
              { key: "screen_section_name", title: "Section", render: (record) => record.screen_section_name || "-" },
              { key: "user_screen_name", title: "User Screen", render: (record) => record.user_screen_name || "-" },
              {
                key: "actions",
                title: "Granted Actions",
                render: (record) =>
                  ACTIONS.filter((action) => Boolean(record.action_permissions?.[action])).join(", ") || "-",
              },
              { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
              {
                key: "row-actions",
                title: "Actions",
                className: "w-[160px] text-right",
                render: (record) => (
                  <RowActions
                    onEdit={() => navigate(`/admin/user-screen-permission/${record.id}/edit`)}
                    onToggle={() => setToggleTarget(record)}
                    onDelete={() => setDeleteTarget(record)}
                  />
                ),
              },
            ]}
            records={permissionsQuery.data?.items ?? []}
            isLoading={permissionsQuery.isLoading}
            isError={permissionsQuery.isError}
            errorDescription="User screen permissions could not be loaded."
            emptyTitle="No user screen permissions found"
            emptyDescription="Launch the new assignment page to configure screen permissions and save them in one final step."
            page={table.page}
            pageSize={table.pageSize}
            total={permissionsQuery.data?.filtered ?? 0}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            onRetry={() => permissionsQuery.refetch()}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Preview By User Type</div>
                <p className="text-xs text-muted-foreground">
                  Resolve the effective menu and actions granted to a specific user type.
                </p>
              </div>
              <Select
                value={previewUserType ? String(previewUserType) : "none"}
                onValueChange={(value) => {
                  setPreviewUserType(value === "none" ? null : Number(value));
                  setPreviewUserId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No user type</SelectItem>
                  {(userTypeOptions.data ?? []).map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1">
                <div className="text-sm font-semibold">Preview By User Creation</div>
                <p className="text-xs text-muted-foreground">
                  Resolve the effective menu and actions for an individual user creation record.
                </p>
              </div>
              <Select
                value={previewUserId ? String(previewUserId) : "none"}
                onValueChange={(value) => {
                  setPreviewUserId(value === "none" ? null : Number(value));
                  setPreviewUserType(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No user</SelectItem>
                  {(userCreationOptions.data ?? []).map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
                                    {screen.screen_name} ·{" "}
                                    {ACTIONS.filter((action) => Boolean(screen.action_permissions[action])).join(", ") || "-"}
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
                <EmptyState
                  title="No preview selected"
                  description="Select a user type or user to preview resolved screen permissions and menu output."
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update user screen permission status"
        description={`Change the status for ${getPermissionTargetLabel(toggleTarget)}?`}
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
        title="Delete user screen permission"
        description={`Delete ${getPermissionTargetLabel(deleteTarget)}?`}
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

export default UserScreenPermissionPage;
