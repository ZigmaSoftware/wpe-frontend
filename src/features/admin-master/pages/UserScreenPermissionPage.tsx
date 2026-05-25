import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useMainScreenOptions, useScreenSectionOptions, useUserScreenOptions, useUserTypeOptions } from "@/features/admin-master/hooks/useAdminLookups";
import { useAdminMutation } from "@/features/admin-master/hooks/useAdminMutations";
import { useAdminTableSearchParams } from "@/features/admin-master/hooks/useAdminTableSearchParams";
import { userScreenPermissionSchema, type UserScreenPermissionFormValues } from "@/features/admin-master/schemas";
import type {
  AdminAction,
  PermissionAssignmentEntry,
  UserScreenPermissionRecord,
  UserScreenRecord,
} from "@/features/admin-master/types";
import { resolveAdminRoutePath } from "@/features/admin-master/utils/routes";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { applyBackendErrors } from "@/features/common-master/hooks/useFormErrorMapper";
import MasterFormDialog from "@/features/common-master/components/MasterFormDialog";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import { CheckSquare, Save } from "lucide-react";

const ACTIONS: AdminAction[] = ["add", "update", "list", "delete", "view", "print"];

const defaultValues: UserScreenPermissionFormValues = {
  user_type: 0,
  scope_type: "screen",
  main_screen: 0,
  screen_section: null,
  user_screen: null,
  action_permissions: {
    add: false,
    update: false,
    list: true,
    delete: false,
    view: true,
    print: false,
    all: false,
  },
  is_active: true,
};

const emptyBulkActions = () => ({
  add: false,
  update: false,
  list: false,
  delete: false,
  view: false,
  print: false,
  all: false,
});

const defaultBulkActions = () => ({
  add: false,
  update: false,
  list: true,
  delete: false,
  view: true,
  print: false,
  all: false,
});

const buildBulkEntry = (screen: UserScreenRecord): PermissionAssignmentEntry => ({
  scope_type: "screen",
  main_screen: screen.main_screen,
  screen_section: screen.screen_section,
  user_screen: screen.id,
  action_permissions: defaultBulkActions(),
  is_active: true,
});

const Tick = ({
  checked,
  disabled = false,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${
      disabled
        ? "cursor-not-allowed border-slate-200 bg-slate-100"
        : checked
          ? "border-blue-500 bg-blue-500"
          : "border-slate-400 bg-white hover:border-blue-400"
    }`}
  >
    {checked ? (
      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
        <path
          d="M1 4l3 3 5-6"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : null}
  </button>
);

const UserScreenPermissionPage = () => {
  const queryClient = useQueryClient();
  const table = useAdminTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserScreenPermissionRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserScreenPermissionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserScreenPermissionRecord | null>(null);
  const [bulkUserType, setBulkUserType] = useState<number | null>(null);
  const [bulkMainScreen, setBulkMainScreen] = useState<number | null>(null);
  const [bulkSelections, setBulkSelections] = useState<Record<number, PermissionAssignmentEntry>>({});
  const [bulkDirty, setBulkDirty] = useState(false);
  const [previewUserType, setPreviewUserType] = useState<number | null>(null);
  const [previewUserId, setPreviewUserId] = useState<number | null>(null);
  const bulkContextRef = useRef<string | null>(null);

  const form = useForm<UserScreenPermissionFormValues>({
    resolver: zodResolver(userScreenPermissionSchema),
    defaultValues,
  });
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

  const userCreationOptions = useQuery({
    queryKey: adminMasterKeys.lookup("user-creation-preview-options"),
    queryFn: async () => {
      const result = await adminMasterApi.listUserCreations({ page: 1, pageSize: 200, search: "" });
      return result.items;
    },
  });

  const query = useQuery({
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

  const allScreensQuery = useQuery({
    queryKey: adminMasterKeys.entity("user-screen-permission-bulk", 1, 500, "", "", ""),
    queryFn: async () => {
      const [mainScreens, sections, screens] = await Promise.all([
        adminMasterApi.listMainScreens({ page: 1, pageSize: 200, search: "" }),
        adminMasterApi.listScreenSections({ page: 1, pageSize: 500, search: "" }),
        adminMasterApi.listUserScreens({ page: 1, pageSize: 500, search: "" }),
      ]);
      return {
        mainScreens: mainScreens.items,
        sections: sections.items,
        screens: screens.items,
      };
    },
  });

  const explicitBulkPermissionsQuery = useQuery({
    queryKey: adminMasterKeys.lookup("bulk-user-screen-permissions", `${bulkUserType ?? "none"}-${bulkMainScreen ?? "none"}`),
    queryFn: () =>
      adminMasterApi.listUserScreenPermissions({
        page: 1,
        pageSize: 500,
        search: "",
        filters: {
          user_type: bulkUserType ?? undefined,
          main_screen: bulkMainScreen ?? undefined,
          scope_type: "screen",
        },
      }),
    enabled: Boolean(bulkUserType && bulkMainScreen),
  });

  const resolvedQuery = useQuery({
    queryKey: adminMasterKeys.permissionsResolved(`${previewUserType ?? "self"}-${previewUserId ?? "none"}`),
    queryFn: () => adminMasterApi.fetchResolvedPermissions({ userTypeId: previewUserType, userId: previewUserId }),
    enabled: Boolean(previewUserType || previewUserId),
  });

  const createMutation = useAdminMutation({
    mutationFn: adminMasterApi.createUserScreenPermission,
    queryKey: ["admin-master", "user-screen-permission"],
    successMessage: "User screen permission created successfully.",
    errorMessage: "Unable to create user screen permission.",
  });
  const updateMutation = useAdminMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<UserScreenPermissionRecord>;
    }) => adminMasterApi.updateUserScreenPermission(id, payload),
    queryKey: ["admin-master", "user-screen-permission"],
    successMessage: "User screen permission updated successfully.",
    errorMessage: "Unable to update user screen permission.",
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

  const bulkMutation = useMutation({
    mutationFn: async () => {
      if (!bulkUserType) {
        throw new Error("User type is required.");
      }
      return adminMasterApi.assignUserScreenPermissions(bulkUserType, Object.values(bulkSelections));
    },
    onSuccess: async () => {
      toast.success("User screen permissions assigned successfully.");
      setBulkDirty(false);
      setPreviewUserType(bulkUserType);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-master", "user-screen-permission"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-master", "lookup", "bulk-user-screen-permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-master", "resolved"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to assign user screen permissions.");
    },
  });

  const bulkMainScreens = useMemo(() => allScreensQuery.data?.mainScreens ?? [], [allScreensQuery.data?.mainScreens]);

  useEffect(() => {
    if (!bulkMainScreens.length) {
      return;
    }
    setBulkMainScreen((current) => (current && bulkMainScreens.some((screen) => screen.id === current) ? current : bulkMainScreens[0].id));
  }, [bulkMainScreens]);

  const sectionNameById = useMemo(
    () =>
      Object.fromEntries((allScreensQuery.data?.sections ?? []).map((section) => [section.id, section.section_name])),
    [allScreensQuery.data?.sections],
  );

  const visibleBulkScreens = useMemo(() => {
    if (!bulkMainScreen) {
      return [];
    }
    return (allScreensQuery.data?.screens ?? []).filter((screen) => screen.main_screen === bulkMainScreen);
  }, [allScreensQuery.data?.screens, bulkMainScreen]);

  useEffect(() => {
    if (!bulkUserType || !bulkMainScreen || explicitBulkPermissionsQuery.isLoading) {
      return;
    }
    const contextKey = `${bulkUserType}-${bulkMainScreen}`;
    if (bulkDirty && bulkContextRef.current && bulkContextRef.current !== contextKey) {
      return;
    }

    const selections = Object.fromEntries(
      (explicitBulkPermissionsQuery.data?.items ?? []).flatMap((permission) => {
        if (!permission.user_screen) {
          return [];
        }
        return [
          [
            permission.user_screen,
            {
              scope_type: "screen" as const,
              main_screen: permission.main_screen,
              screen_section: permission.screen_section ?? null,
              user_screen: permission.user_screen,
              action_permissions: {
                ...emptyBulkActions(),
                ...permission.action_permissions,
              },
              is_active: permission.is_active,
            },
          ],
        ];
      }),
    );

    setBulkSelections(selections);
    setBulkDirty(false);
    bulkContextRef.current = contextKey;
  }, [
    bulkDirty,
    bulkMainScreen,
    bulkUserType,
    explicitBulkPermissionsQuery.data?.items,
    explicitBulkPermissionsQuery.isLoading,
  ]);

  const promptDiscardBulkChanges = (next: () => void) => {
    if (bulkDirty && !window.confirm("You have unsaved bulk assignment changes. Discard them?")) {
      return;
    }
    if (bulkDirty) {
      setBulkSelections({});
      setBulkDirty(false);
      bulkContextRef.current = null;
    }
    next();
  };

  const updateBulkSelections = (updater: (current: Record<number, PermissionAssignmentEntry>) => Record<number, PermissionAssignmentEntry>) => {
    setBulkSelections((current) => {
      const next = updater(current);
      return next;
    });
    setBulkDirty(true);
  };

  const ensureSelection = (screen: UserScreenRecord, current?: PermissionAssignmentEntry) => current ?? buildBulkEntry(screen);

  const isBulkSelected = (screenId: number) => Boolean(bulkSelections[screenId]);

  const toggleBulkRow = (screen: UserScreenRecord) => {
    updateBulkSelections((current) => {
      const next = { ...current };
      if (next[screen.id]) {
        delete next[screen.id];
      } else {
        next[screen.id] = buildBulkEntry(screen);
      }
      return next;
    });
  };

  const toggleBulkAction = (screen: UserScreenRecord, action: AdminAction) => {
    updateBulkSelections((current) => {
      const next = { ...current };
      const existing = ensureSelection(screen, next[screen.id]);
      next[screen.id] = {
        ...existing,
        action_permissions: {
          ...emptyBulkActions(),
          ...existing.action_permissions,
          [action]: !existing.action_permissions?.[action],
        },
      };
      return next;
    });
  };

  const allVisibleRowsSelected = visibleBulkScreens.length > 0 && visibleBulkScreens.every((screen) => isBulkSelected(screen.id));

  const toggleAllVisibleRows = () => {
    updateBulkSelections((current) => {
      const next = { ...current };
      const target = !allVisibleRowsSelected;
      for (const screen of visibleBulkScreens) {
        if (target) {
          next[screen.id] = ensureSelection(screen, next[screen.id]);
        } else {
          delete next[screen.id];
        }
      }
      return next;
    });
  };

  const columnChecked = (action: AdminAction) =>
    visibleBulkScreens.some((screen) => screen.available_actions.includes(action)) &&
    visibleBulkScreens
      .filter((screen) => screen.available_actions.includes(action))
      .every((screen) => Boolean(bulkSelections[screen.id]?.action_permissions?.[action]));

  const toggleBulkColumn = (action: AdminAction) => {
    updateBulkSelections((current) => {
      const next = { ...current };
      const target = !columnChecked(action);
      for (const screen of visibleBulkScreens) {
        if (!screen.available_actions.includes(action)) {
          continue;
        }
        const existing = ensureSelection(screen, next[screen.id]);
        next[screen.id] = {
          ...existing,
          action_permissions: {
            ...emptyBulkActions(),
            ...existing.action_permissions,
            [action]: target,
          },
        };
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Screen Permission"
        description="Manage row-based RBAC, screen-level bulk assignment, and resolved access previews under Masters."
      />

      <Tabs defaultValue="rows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rows">Row CRUD</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Assign</TabsTrigger>
          <TabsTrigger value="preview">Resolved Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="rows" className="space-y-4">
          <MasterToolbar
            search={table.search}
            onSearchChange={table.setSearch}
            createLabel="Add Permission"
            onCreate={() => {
              setEditing(null);
              form.reset(defaultValues);
              setDialogOpen(true);
            }}
          />
          <MasterTable
            columns={[
              { key: "user_type_name", title: "User Type", render: (record) => record.user_type_name || "-" },
              { key: "scope_type", title: "Scope", render: (record) => record.scope_type },
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
                    onEdit={() => {
                      setEditing(record);
                      form.reset({
                        ...defaultValues,
                        ...record,
                        action_permissions: {
                          ...defaultValues.action_permissions,
                          ...record.action_permissions,
                        },
                      });
                      setDialogOpen(true);
                    }}
                    onToggle={() => setToggleTarget(record)}
                    onDelete={() => setDeleteTarget(record)}
                  />
                ),
              },
            ]}
            records={query.data?.items ?? []}
            isLoading={query.isLoading}
            isError={query.isError}
            errorDescription="User screen permissions could not be loaded."
            emptyTitle="No user screen permissions found"
            emptyDescription="Create a targeted permission row or use the bulk assignment matrix."
            page={table.page}
            pageSize={table.pageSize}
            total={query.data?.filtered ?? 0}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            onRetry={() => query.refetch()}
          />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">Assignment Target</div>
                  <p className="text-xs text-slate-500">
                    Bulk assignment writes screen-level permissions for the selected user type.
                  </p>
                </div>
                <Select
                  value={bulkUserType ? String(bulkUserType) : undefined}
                  onValueChange={(value) =>
                    promptDiscardBulkChanges(() => {
                      setBulkUserType(Number(value));
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(userTypeOptions.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full gap-2"
                  disabled={!bulkUserType || !Object.keys(bulkSelections).length || bulkMutation.isPending}
                  onClick={() => bulkMutation.mutate()}
                >
                  <Save className="h-4 w-4" />
                  {bulkMutation.isPending ? "Saving..." : "Save Bulk Assignment"}
                </Button>
              </div>

              <div className="space-y-4">
                {allScreensQuery.isLoading ? <LoadingState label="Loading permission matrix..." /> : null}
                {allScreensQuery.isError ? <ErrorState description="Permission matrix could not be loaded." /> : null}
                {!allScreensQuery.isLoading && !allScreensQuery.isError ? (
                  <>
                    {bulkMainScreens.length === 0 ? (
                      <EmptyState
                        title="No main screens found"
                        description="Create main screens and user screens before using bulk assignment."
                      />
                    ) : (
                      <>
                        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {bulkMainScreens.map((screen) => (
                            <button
                              key={screen.id}
                              type="button"
                              onClick={() =>
                                promptDiscardBulkChanges(() => {
                                  setBulkMainScreen(screen.id);
                                })
                              }
                              className={`relative flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                                screen.id === bulkMainScreen
                                  ? "text-blue-600"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              {screen.screen_name}
                              {screen.id === bulkMainScreen ? (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-600" />
                              ) : null}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-xl border border-slate-200 shadow-sm">
                          {!bulkUserType ? (
                            <EmptyState
                              title="Select a user type"
                              description="Choose the target user type to load and edit the permission matrix."
                            />
                          ) : explicitBulkPermissionsQuery.isLoading ? (
                            <LoadingState label="Loading assigned user screen permissions..." />
                          ) : visibleBulkScreens.length === 0 ? (
                            <EmptyState
                              title="No user screens found"
                              description="Add user screens to this main screen before assigning permissions."
                            />
                          ) : (
                            <div className="overflow-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr>
                                    <th className="sticky left-0 z-20 min-w-[260px] border-b border-r border-slate-200 bg-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                      <div className="flex items-center gap-2">
                                        <Tick checked={allVisibleRowsSelected} onChange={toggleAllVisibleRows} />
                                        <span className="inline-flex items-center gap-2">
                                          <CheckSquare className="h-3.5 w-3.5 opacity-70" />
                                          Screen
                                        </span>
                                      </div>
                                    </th>
                                    <th className="border-b border-r border-slate-600 bg-slate-800 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                      Section
                                    </th>
                                    {ACTIONS.map((action) => (
                                      <th
                                        key={action}
                                        className="border-b border-r border-slate-600 bg-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white last:border-r-0"
                                      >
                                        <div className="flex flex-col items-center gap-1.5">
                                          <Tick checked={columnChecked(action)} onChange={() => toggleBulkColumn(action)} />
                                          <span>{action}</span>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleBulkScreens.map((screen, index) => {
                                    const selected = bulkSelections[screen.id];
                                    return (
                                      <tr
                                        key={screen.id}
                                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                                      >
                                        <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-4 py-3">
                                          <div className="flex items-center gap-2.5">
                                            <Tick checked={Boolean(selected)} onChange={() => toggleBulkRow(screen)} />
                                            <div className="min-w-0">
                                              <div className="truncate font-medium text-slate-700">{screen.screen_name}</div>
                                              <div className="truncate text-[11px] text-slate-400">
                                                {resolveAdminRoutePath(screen.code ?? "", screen.route_path)}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="border-b border-r border-slate-200 px-3 py-3 text-slate-600">
                                          {sectionNameById[screen.screen_section] ?? "-"}
                                        </td>
                                        {ACTIONS.map((action) => {
                                          const actionAvailable = screen.available_actions.includes(action);
                                          const actionChecked = Boolean(selected?.action_permissions?.[action]);
                                          return (
                                            <td
                                              key={action}
                                              className="border-b border-r border-slate-200 px-3 py-3 text-center last:border-r-0"
                                            >
                                              <div className="flex flex-col items-center gap-1">
                                                <Tick
                                                  checked={actionChecked}
                                                  disabled={!actionAvailable}
                                                  onChange={() => {
                                                    if (!actionAvailable) {
                                                      return;
                                                    }
                                                    toggleBulkAction(screen, action);
                                                  }}
                                                />
                                                <span className="text-[10px] text-slate-400">
                                                  {actionAvailable ? "Allowed" : "N/A"}
                                                </span>
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {bulkDirty ? (
                          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                            <span className="text-sm text-amber-700">You have unsaved bulk assignment changes.</span>
                            <Button size="sm" onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending}>
                              {bulkMutation.isPending ? "Saving..." : "Save Now"}
                            </Button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
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

      <MasterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit User Screen Permission" : "Create User Screen Permission"}
        description="Use row-based entries for exact overrides, section-level rules, or targeted corrections."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
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
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(userTypeOptions.data ?? []).map((option) => (
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
              name="scope_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main_screen">Main Screen</SelectItem>
                      <SelectItem value="section">Section</SelectItem>
                      <SelectItem value="screen">Screen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="main_screen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Screen</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.setValue("screen_section", null);
                      form.setValue("user_screen", null);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select main screen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(mainScreenOptions.data ?? []).map((option) => (
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
              name="screen_section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Screen Section</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : "none"}
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? null : Number(value));
                      form.setValue("user_screen", null);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No section</SelectItem>
                      {(screenSectionOptions.data ?? []).map((option) => (
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
              name="user_screen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Screen</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user screen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No user screen</SelectItem>
                      {(userScreenOptions.data ?? []).map((option) => (
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
              name="action_permissions"
              render={({ field }) => <ActionPermissionsField value={field.value} onChange={field.onChange} />}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>Active status</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Save Changes" : "Create User Screen Permission"}
              </Button>
            </div>
          </form>
        </Form>
      </MasterFormDialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update user screen permission status"
        description={`Change the status for ${toggleTarget?.user_screen_name ?? "this permission"}?`}
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
        description={`Delete ${deleteTarget?.user_screen_name ?? "this permission"}?`}
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
