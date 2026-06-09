import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckSquare, ChevronRight, RotateCcw, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";
import { useMainScreenOptions, useScreenSectionOptions, useUserTypeOptions } from "@/features/admin-master/hooks/useAdminLookups";
import type {
  AdminAction,
  AdminActionPermissions,
  PermissionAssignmentEntry,
  UserScreenPermissionRecord,
  UserScreenRecord,
} from "@/features/admin-master/types";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { getRoutePathForScreenCode } from "@/lib/routePermissions";
import { cn } from "@/lib/utils";

const ACTIONS: AdminAction[] = ["add", "view", "list", "update", "delete", "print"];

type SelectionMap = Record<number, PermissionAssignmentEntry>;
type ContextStatusMap = Record<string, boolean>;

const getContextKey = (mainScreenId: number, sectionId: number) => `${mainScreenId}:${sectionId}`;

const normalizeActionPermissions = (
  availableActions: AdminAction[],
  current?: AdminActionPermissions | null,
): AdminActionPermissions => {
  const availableActionSet = new Set(availableActions);
  const next: AdminActionPermissions = {};

  for (const action of ACTIONS) {
    next[action] = availableActionSet.has(action) ? Boolean(current?.[action] ?? current?.all) : false;
  }

  next.all = availableActions.length > 0 && availableActions.every((action) => Boolean(next[action]));
  return next;
};

const buildScreenPermissionEntry = (
  screen: UserScreenRecord,
  actionPermissions?: AdminActionPermissions | null,
  isActive = true,
): PermissionAssignmentEntry => ({
  scope_type: "screen",
  main_screen: screen.main_screen,
  screen_section: screen.screen_section,
  user_screen: screen.id,
  action_permissions: normalizeActionPermissions(screen.available_actions, actionPermissions),
  is_active: isActive,
});

const cloneSelectionMap = (value: SelectionMap): SelectionMap =>
  Object.fromEntries(
    Object.entries(value).map(([screenId, entry]) => [
      Number(screenId),
      {
        ...entry,
        action_permissions: entry.action_permissions ? { ...entry.action_permissions } : undefined,
      },
    ]),
  );

const buildContextStatusMap = (value: SelectionMap): ContextStatusMap => {
  const groupedStatuses: Record<string, boolean[]> = {};

  for (const entry of Object.values(value)) {
    if (!entry.main_screen || !entry.screen_section) {
      continue;
    }

    const contextKey = getContextKey(entry.main_screen, entry.screen_section);
    groupedStatuses[contextKey] = groupedStatuses[contextKey] ?? [];
    groupedStatuses[contextKey].push(Boolean(entry.is_active));
  }

  return Object.fromEntries(
    Object.entries(groupedStatuses).map(([contextKey, statuses]) => [contextKey, statuses.every(Boolean)]),
  );
};

const serializeSelections = (value: SelectionMap) =>
  JSON.stringify(
    Object.keys(value)
      .map(Number)
      .sort((left, right) => left - right)
      .map((screenId) => {
        const entry = value[screenId];
        return {
          screenId,
          scope_type: entry.scope_type,
          main_screen: entry.main_screen ?? null,
          screen_section: entry.screen_section ?? null,
          user_screen: entry.user_screen ?? null,
          is_active: Boolean(entry.is_active),
          action_permissions: {
            all: Boolean(entry.action_permissions?.all),
            add: Boolean(entry.action_permissions?.add),
            view: Boolean(entry.action_permissions?.view),
            list: Boolean(entry.action_permissions?.list),
            update: Boolean(entry.action_permissions?.update),
            delete: Boolean(entry.action_permissions?.delete),
            print: Boolean(entry.action_permissions?.print),
          },
        };
      }),
  );

const serializeContextStatuses = (value: ContextStatusMap) =>
  JSON.stringify(
    Object.keys(value)
      .sort()
      .map((contextKey) => [contextKey, Boolean(value[contextKey])]),
  );

const formatScopeLabel = (value: UserScreenPermissionRecord["scope_type"]) =>
  value
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

const PermissionHeaderToggle = ({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) => (
  <div
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    className={cn(
      "inline-flex items-center justify-center gap-2",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    )}
    onClick={() => {
      if (!disabled) {
        onToggle();
      }
    }}
    onKeyDown={(event) => {
      if (disabled) {
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onToggle();
      }
    }}
  >
    <Checkbox checked={checked} disabled={disabled} className="pointer-events-none" />
    <span>{label}</span>
  </div>
);

const UserScreenPermissionAssignmentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const permissionId = id ? Number(id) : null;
  const isEditMode = Boolean(permissionId);
  const presetUserTypeId = useMemo(() => {
    const rawValue = searchParams.get("userType");
    if (!rawValue) {
      return null;
    }
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }, [searchParams]);
  const isPresetUserTypeMode = !isEditMode && Boolean(presetUserTypeId);
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<number | null>(presetUserTypeId);
  const [selectedMainScreenId, setSelectedMainScreenId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [baselineSelections, setBaselineSelections] = useState<SelectionMap>({});
  const [contextStatuses, setContextStatuses] = useState<ContextStatusMap>({});
  const [baselineContextStatuses, setBaselineContextStatuses] = useState<ContextStatusMap>({});
  const hydratedStateKeyRef = useRef<string | null>(null);

  const permissionDetailQuery = useQuery({
    queryKey: adminMasterKeys.detail("user-screen-permission", permissionId ?? "new"),
    queryFn: () => adminMasterApi.getUserScreenPermission(permissionId as number),
    enabled: isEditMode,
  });

  const allScreensQuery = useQuery({
    queryKey: adminMasterKeys.lookup("user-screen-permission-assignment-screens"),
    queryFn: () =>
      adminMasterApi.listUserScreens({
        page: 1,
        pageSize: 1000,
        search: "",
        filters: {
          is_active: true,
        },
      }),
  });

  const existingPermissionsQuery = useQuery({
    queryKey: adminMasterKeys.lookup("user-screen-permission-existing-screen-scope", selectedUserTypeId ?? "none"),
    queryFn: () =>
      adminMasterApi.listUserScreenPermissions({
        page: 1,
        pageSize: 1000,
        search: "",
        filters: {
          user_type: selectedUserTypeId ?? undefined,
          scope_type: "screen",
        },
      }),
    enabled: Boolean(selectedUserTypeId),
  });

  const userTypeOptions = useUserTypeOptions();
  const mainScreenOptions = useMainScreenOptions();
  const screenSectionOptions = useScreenSectionOptions(selectedMainScreenId || undefined);

  const legacyPermission =
    permissionDetailQuery.data && permissionDetailQuery.data.scope_type !== "screen"
      ? permissionDetailQuery.data
      : null;

  const allScreens = useMemo(() => allScreensQuery.data?.items ?? [], [allScreensQuery.data?.items]);
  const screensById = useMemo(
    () => Object.fromEntries(allScreens.map((screen) => [screen.id, screen])),
    [allScreens],
  );

  const visibleScreens = useMemo(() => {
    if (!selectedMainScreenId || !selectedSectionId) {
      return [];
    }

    return allScreens.filter(
      (screen) => screen.main_screen === selectedMainScreenId && screen.screen_section === selectedSectionId,
    );
  }, [allScreens, selectedMainScreenId, selectedSectionId]);

  const sectionCountForMainScreen = useMemo(() => {
    if (!selectedMainScreenId) {
      return 0;
    }

    return new Set(
      allScreens
        .filter((screen) => screen.main_screen === selectedMainScreenId)
        .map((screen) => screen.screen_section),
    ).size;
  }, [allScreens, selectedMainScreenId]);

  const currentContextKey =
    selectedMainScreenId && selectedSectionId ? getContextKey(selectedMainScreenId, selectedSectionId) : null;

  const currentContextStatus = useMemo(() => {
    if (!currentContextKey) {
      return true;
    }

    if (currentContextKey in contextStatuses) {
      return contextStatuses[currentContextKey];
    }

    const currentRows = visibleScreens
      .map((screen) => selections[screen.id])
      .filter((entry): entry is PermissionAssignmentEntry => Boolean(entry));

    return currentRows.length > 0 ? currentRows.every((entry) => Boolean(entry.is_active)) : true;
  }, [contextStatuses, currentContextKey, selections, visibleScreens]);

  const visibleScreenPermissionState = useMemo(
    () =>
      visibleScreens.map((screen) => ({
        screen,
        permissions: normalizeActionPermissions(screen.available_actions, selections[screen.id]?.action_permissions),
      })),
    [selections, visibleScreens],
  );

  const visibleAllSelected = useMemo(
    () =>
      visibleScreenPermissionState.length > 0 &&
      visibleScreenPermissionState.every(({ permissions }) => Boolean(permissions.all)),
    [visibleScreenPermissionState],
  );

  const visibleActionColumnState = useMemo(
    () =>
      Object.fromEntries(
        ACTIONS.map((action) => {
          const applicableRows = visibleScreenPermissionState.filter(({ screen }) =>
            screen.available_actions.includes(action),
          );

          return [
            action,
            {
              enabled:
                applicableRows.length > 0 &&
                applicableRows.every(({ permissions }) => Boolean(permissions[action])),
              disabled: applicableRows.length === 0,
            },
          ];
        }),
      ) as Record<AdminAction, { enabled: boolean; disabled: boolean }>,
    [visibleScreenPermissionState],
  );

  const selectedUserTypeLabel = useMemo(
    () =>
      (userTypeOptions.data ?? []).find((option) => option.id === selectedUserTypeId)?.name ??
      permissionDetailQuery.data?.user_type_name ??
      "Select user type",
    [permissionDetailQuery.data?.user_type_name, selectedUserTypeId, userTypeOptions.data],
  );

  const selectedMainScreenLabel = useMemo(
    () =>
      (mainScreenOptions.data ?? []).find((option) => option.id === selectedMainScreenId)?.name ??
      permissionDetailQuery.data?.main_screen_name ??
      "Select main screen",
    [mainScreenOptions.data, permissionDetailQuery.data?.main_screen_name, selectedMainScreenId],
  );

  const selectedSectionLabel = useMemo(
    () =>
      (screenSectionOptions.data ?? []).find((option) => option.id === selectedSectionId)?.name ??
      permissionDetailQuery.data?.screen_section_name ??
      "Select user section",
    [permissionDetailQuery.data?.screen_section_name, screenSectionOptions.data, selectedSectionId],
  );

  const configuredRows = useMemo(
    () =>
      Object.values(selections).filter(
        (entry): entry is PermissionAssignmentEntry & {
          main_screen: number;
          screen_section: number;
          user_screen: number;
          is_active: boolean;
        } => Boolean(entry.main_screen && entry.screen_section && entry.user_screen),
      ),
    [selections],
  );

  const summaryGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        contextKey: string;
        mainScreenName: string;
        sectionName: string;
        screenCount: number;
        actionCount: number;
        activeCount: number;
        screenNames: string[];
      }
    >();

    for (const entry of configuredRows) {
      const screen = screensById[entry.user_screen];
      if (!screen) {
        continue;
      }

      const contextKey = getContextKey(entry.main_screen, entry.screen_section);
      const currentGroup =
        grouped.get(contextKey) ??
        {
          contextKey,
          mainScreenName: screen.main_screen_name ?? selectedMainScreenLabel,
          sectionName: screen.screen_section_name ?? selectedSectionLabel,
          screenCount: 0,
          actionCount: 0,
          activeCount: 0,
          screenNames: [],
        };

      currentGroup.screenCount += 1;
      currentGroup.activeCount += entry.is_active ? 1 : 0;
      currentGroup.actionCount += ACTIONS.filter((action) => Boolean(entry.action_permissions?.[action])).length;
      currentGroup.screenNames.push(screen.screen_name);
      grouped.set(contextKey, currentGroup);
    }

    return Array.from(grouped.values()).sort((left, right) =>
      left.mainScreenName === right.mainScreenName
        ? left.sectionName.localeCompare(right.sectionName)
        : left.mainScreenName.localeCompare(right.mainScreenName),
    );
  }, [configuredRows, screensById, selectedMainScreenLabel, selectedSectionLabel]);

  const totalGrantedActions = useMemo(
    () =>
      configuredRows.reduce(
        (count, entry) => count + ACTIONS.filter((action) => Boolean(entry.action_permissions?.[action])).length,
        0,
      ),
    [configuredRows],
  );

  const payload = useMemo(
    () =>
      configuredRows.map((entry) => ({
        scope_type: "screen" as const,
        main_screen: entry.main_screen,
        screen_section: entry.screen_section,
        user_screen: entry.user_screen,
        action_permissions: entry.action_permissions ? { ...entry.action_permissions } : undefined,
        is_active: Boolean(entry.is_active),
      })),
    [configuredRows],
  );

  const isDirty = useMemo(
    () =>
      serializeSelections(selections) !== serializeSelections(baselineSelections) ||
      serializeContextStatuses(contextStatuses) !== serializeContextStatuses(baselineContextStatuses),
    [baselineContextStatuses, baselineSelections, contextStatuses, selections],
  );

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!presetUserTypeId || isEditMode) {
      return;
    }

    setSelectedUserTypeId((currentValue) => currentValue ?? presetUserTypeId);
  }, [isEditMode, presetUserTypeId]);

  useEffect(() => {
    if (!permissionDetailQuery.data) {
      return;
    }

    setSelectedUserTypeId(permissionDetailQuery.data.user_type);
    setSelectedMainScreenId(permissionDetailQuery.data.main_screen);

    if (permissionDetailQuery.data.screen_section) {
      setSelectedSectionId(permissionDetailQuery.data.screen_section);
    }
  }, [permissionDetailQuery.data]);

  useEffect(() => {
    if (
      !isEditMode ||
      !permissionDetailQuery.data ||
      permissionDetailQuery.data.screen_section ||
      selectedSectionId ||
      screenSectionOptions.isLoading
    ) {
      return;
    }

    const firstSectionId = screenSectionOptions.data?.[0]?.id;
    if (firstSectionId) {
      setSelectedSectionId(firstSectionId);
    }
  }, [
    isEditMode,
    permissionDetailQuery.data,
    screenSectionOptions.data,
    screenSectionOptions.isLoading,
    selectedSectionId,
  ]);

  useEffect(() => {
    const detail = permissionDetailQuery.data;

    if (!selectedUserTypeId || !allScreensQuery.data || existingPermissionsQuery.isLoading) {
      return;
    }

    if (isEditMode && !detail) {
      return;
    }

    const hydrationKey = isEditMode
      ? `edit:${permissionId}:${detail?.updated_at ?? "pending"}`
      : `new:${selectedUserTypeId}`;

    if (hydratedStateKeyRef.current === hydrationKey) {
      return;
    }

    const nextSelections: SelectionMap = {};

    for (const permission of existingPermissionsQuery.data?.items ?? []) {
      if (!permission.user_screen) {
        continue;
      }

      const screen = screensById[permission.user_screen];
      if (!screen) {
        continue;
      }

      nextSelections[screen.id] = buildScreenPermissionEntry(
        screen,
        permission.action_permissions,
        permission.is_active,
      );
    }

    if (detail) {
      if (detail.scope_type === "screen" && detail.user_screen) {
        const screen = screensById[detail.user_screen];
        if (screen) {
          nextSelections[screen.id] = buildScreenPermissionEntry(screen, detail.action_permissions, detail.is_active);
        }
      } else {
        const scopedScreens = allScreens.filter(
          (screen) =>
            screen.main_screen === detail.main_screen &&
            (detail.scope_type === "main_screen" || screen.screen_section === detail.screen_section),
        );

        for (const screen of scopedScreens) {
          nextSelections[screen.id] = buildScreenPermissionEntry(screen, detail.action_permissions, detail.is_active);
        }
      }
    }

    const nextContextStatuses = buildContextStatusMap(nextSelections);

    if (detail?.main_screen && detail.screen_section) {
      nextContextStatuses[getContextKey(detail.main_screen, detail.screen_section)] = detail.is_active;
    }

    setSelections(cloneSelectionMap(nextSelections));
    setBaselineSelections(cloneSelectionMap(nextSelections));
    setContextStatuses({ ...nextContextStatuses });
    setBaselineContextStatuses({ ...nextContextStatuses });
    hydratedStateKeyRef.current = hydrationKey;
  }, [
    allScreens,
    allScreensQuery.data,
    existingPermissionsQuery.data?.items,
    existingPermissionsQuery.isLoading,
    isEditMode,
    permissionDetailQuery.data,
    permissionId,
    screensById,
    selectedUserTypeId,
  ]);

  const updateSelections = (
    screen: UserScreenRecord,
    updater: (currentEntry?: PermissionAssignmentEntry) => PermissionAssignmentEntry | null,
  ) => {
    const contextKey = getContextKey(screen.main_screen, screen.screen_section);
    const contextStatus = contextStatuses[contextKey] ?? baselineContextStatuses[contextKey] ?? true;

    setSelections((current) => {
      const next = cloneSelectionMap(current);
      const baselineEntry = baselineSelections[screen.id];
      const nextEntry = updater(next[screen.id] ?? baselineEntry ?? buildScreenPermissionEntry(screen, undefined, contextStatus));

      if (!nextEntry) {
        delete next[screen.id];
        return next;
      }

      const normalizedEntry = buildScreenPermissionEntry(
        screen,
        nextEntry.action_permissions,
        nextEntry.is_active ?? contextStatus,
      );

      if (
        !ACTIONS.some((action) => Boolean(normalizedEntry.action_permissions?.[action])) &&
        !baselineEntry
      ) {
        delete next[screen.id];
        return next;
      }

      next[screen.id] = normalizedEntry;
      return next;
    });
  };

  const applySelectionToScreen = (
    next: SelectionMap,
    screen: UserScreenRecord,
    actionPermissions?: AdminActionPermissions | null,
    isActive?: boolean,
  ) => {
    const contextKey = getContextKey(screen.main_screen, screen.screen_section);
    const contextStatus = contextStatuses[contextKey] ?? baselineContextStatuses[contextKey] ?? true;
    const baselineEntry = baselineSelections[screen.id];

    const normalizedEntry = buildScreenPermissionEntry(
      screen,
      actionPermissions,
      isActive ?? next[screen.id]?.is_active ?? baselineEntry?.is_active ?? contextStatus,
    );

    if (!ACTIONS.some((action) => Boolean(normalizedEntry.action_permissions?.[action])) && !baselineEntry) {
      delete next[screen.id];
      return;
    }

    next[screen.id] = normalizedEntry;
  };

  const handleRowActionToggle = (screen: UserScreenRecord, action: AdminAction) => {
    updateSelections(screen, (currentEntry) => {
      const currentPermissions = normalizeActionPermissions(screen.available_actions, currentEntry?.action_permissions);
      const nextPermissions = normalizeActionPermissions(screen.available_actions, {
        ...currentPermissions,
        [action]: !currentPermissions[action],
      });

      return {
        ...(currentEntry ?? buildScreenPermissionEntry(screen, currentPermissions, Boolean(currentEntry?.is_active))),
        action_permissions: nextPermissions,
      };
    });
  };

  const handleToggleAllActions = (screen: UserScreenRecord) => {
    updateSelections(screen, (currentEntry) => {
      const currentPermissions = normalizeActionPermissions(screen.available_actions, currentEntry?.action_permissions);
      const enableAll = !currentPermissions.all;
      const nextPermissions = normalizeActionPermissions(
        screen.available_actions,
        Object.fromEntries(screen.available_actions.map((action) => [action, enableAll])),
      );

      return {
        ...(currentEntry ?? buildScreenPermissionEntry(screen, currentPermissions, Boolean(currentEntry?.is_active))),
        action_permissions: nextPermissions,
      };
    });
  };

  const handleColumnActionToggle = (action: AdminAction) => {
    const applicableScreens = visibleScreens.filter((screen) => screen.available_actions.includes(action));
    if (applicableScreens.length === 0) {
      return;
    }

    const enableForAll = applicableScreens.some(
      (screen) =>
        !normalizeActionPermissions(screen.available_actions, selections[screen.id]?.action_permissions)[action],
    );

    setSelections((current) => {
      const next = cloneSelectionMap(current);

      for (const screen of applicableScreens) {
        const currentPermissions = normalizeActionPermissions(
          screen.available_actions,
          (next[screen.id] ?? baselineSelections[screen.id])?.action_permissions,
        );
        const nextPermissions = normalizeActionPermissions(screen.available_actions, {
          ...currentPermissions,
          [action]: enableForAll,
        });
        applySelectionToScreen(next, screen, nextPermissions);
      }

      return next;
    });
  };

  const handleVisibleMatrixToggleAll = () => {
    if (visibleScreens.length === 0) {
      return;
    }

    const enableForAll = !visibleAllSelected;

    setSelections((current) => {
      const next = cloneSelectionMap(current);

      for (const screen of visibleScreens) {
        const nextPermissions = normalizeActionPermissions(
          screen.available_actions,
          Object.fromEntries(screen.available_actions.map((action) => [action, enableForAll])),
        );
        applySelectionToScreen(next, screen, nextPermissions);
      }

      return next;
    });
  };

  const handleContextStatusChange = (checked: boolean) => {
    if (!currentContextKey) {
      return;
    }

    setContextStatuses((current) => ({
      ...current,
      [currentContextKey]: checked,
    }));

    setSelections((current) => {
      const next = cloneSelectionMap(current);

      for (const screen of visibleScreens) {
        if (!next[screen.id]) {
          continue;
        }

        next[screen.id] = {
          ...next[screen.id],
          is_active: checked,
        };
      }

      return next;
    });
  };

  const handleUserTypeChange = (nextUserTypeId: number) => {
    if (nextUserTypeId === selectedUserTypeId) {
      return;
    }

    if (isDirty && !window.confirm("You have unsaved permission changes. Discard them and change the user type?")) {
      return;
    }

    hydratedStateKeyRef.current = null;
    setSelectedUserTypeId(nextUserTypeId);
    setSelectedMainScreenId(null);
    setSelectedSectionId(null);
    setSelections({});
    setBaselineSelections({});
    setContextStatuses({});
    setBaselineContextStatuses({});
  };

  const handleReset = () => {
    setSelections(cloneSelectionMap(baselineSelections));
    setContextStatuses({ ...baselineContextStatuses });
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("You have unsaved permission changes. Leave this page?")) {
      return;
    }

    navigate("/admin/user-screen-permission");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserTypeId) {
        throw new Error("User type is required.");
      }

      if (payload.length === 0) {
        throw new Error("Configure at least one screen permission before saving.");
      }

      await adminMasterApi.assignUserScreenPermissions(selectedUserTypeId, payload);

      if (legacyPermission) {
        await adminMasterApi.deleteUserScreenPermission(legacyPermission.id);
      }
    },
    onSuccess: async () => {
      toast.success(
        legacyPermission
          ? "Legacy permission migrated to screen-level rows successfully."
          : isEditMode || isPresetUserTypeMode
            ? "User screen permissions updated successfully."
            : "User screen permissions saved successfully.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-master"] });
      navigate("/admin/user-screen-permission");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save user screen permissions."));
    },
  });

  if (allScreensQuery.isLoading || (isEditMode && permissionDetailQuery.isLoading)) {
    return <LoadingState label="Preparing permission assignment..." />;
  }

  if (allScreensQuery.isError) {
    return (
      <ErrorState
        description="User screens could not be loaded for the permission matrix."
        action={
          <Button variant="outline" onClick={() => allScreensQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (isEditMode && permissionDetailQuery.isError) {
    return (
      <ErrorState
        description="The selected user type permission could not be loaded."
        action={
          <Button variant="outline" onClick={() => permissionDetailQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to permissions
          </button>
          <span className="text-slate-300">|</span>
          <span>Masters</span>
          <ChevronRight className="h-4 w-4" />
          <span>User Type Permissions</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900">
            {isEditMode || isPresetUserTypeMode ? "Edit Assignment" : "New Assignment"}
          </span>
        </div>

        <PageHeader
          title={isEditMode || isPresetUserTypeMode ? "Edit User Type Permissions" : "Create User Type Permissions"}
          description={
            isEditMode || isPresetUserTypeMode
              ? "Adjust screen-level permissions in one place and save the final assignment once."
              : "Configure screen-level permissions across multiple main screens and user sections before one final save."
          }
        />
      </div>

      {legacyPermission ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">
                Legacy {formatScopeLabel(legacyPermission.scope_type)} permission detected
              </p>
              <p>
                Saving this page will migrate that legacy scope into explicit screen-level rows for the selected
                screens and remove the original legacy record.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Assignment Target</CardTitle>
              <CardDescription>
                Select the user type first, then configure one or more module sections before the final save.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">User Type</div>
                <Select
                  value={selectedUserTypeId ? String(selectedUserTypeId) : undefined}
                  onValueChange={(value) => handleUserTypeChange(Number(value))}
                  disabled={isEditMode || isPresetUserTypeMode}
                >
                  <SelectTrigger className="h-11 rounded-xl">
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
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Configured Rows</div>
                    <div className="text-xs text-slate-500">Rows staged in memory for the final save payload.</div>
                  </div>
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900">{payload.length}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {summaryGroups.length} configured section{summaryGroups.length === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {totalGrantedActions} granted action{totalGrantedActions === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Module Filters</CardTitle>
                <CardDescription>
                  Switch between main screens and user sections without losing staged selections.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Main Screen</div>
                  <Select
                    value={selectedMainScreenId ? String(selectedMainScreenId) : undefined}
                    onValueChange={(value) => {
                      setSelectedMainScreenId(Number(value));
                      setSelectedSectionId(null);
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select main screen" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mainScreenOptions.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">User Section</div>
                  <Select
                    value={selectedSectionId ? String(selectedSectionId) : undefined}
                    onValueChange={(value) => setSelectedSectionId(Number(value))}
                    disabled={!selectedMainScreenId || screenSectionOptions.isLoading}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue
                        placeholder={selectedMainScreenId ? "Select user section" : "Select main screen first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(screenSectionOptions.data ?? []).map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Active Status</CardTitle>
                <CardDescription>
                  Applies to the selected rows in the current main screen and user section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Current Section Status</div>
                    <div className="text-xs text-slate-500">
                      {currentContextKey ? "Saved with each staged row in this section." : "Select a section to edit status."}
                    </div>
                  </div>
                  <Switch
                    checked={currentContextStatus}
                    onCheckedChange={handleContextStatusChange}
                    disabled={!currentContextKey}
                  />
                </div>

                <div className="text-xs text-slate-500">
                  {currentContextKey
                    ? `${selectedMainScreenLabel} / ${selectedSectionLabel} is currently set to ${currentContextStatus ? "Active" : "Inactive"}.`
                    : "No section selected."}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Screen Permissions</CardTitle>
                  <CardDescription>
                    Configure screen-level actions. Each row represents one user screen under the selected section.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                    {selectedMainScreenLabel}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                    {selectedSectionLabel}
                  </Badge>
                  {selectedMainScreenId ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                      {sectionCountForMainScreen} section{sectionCountForMainScreen === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUserTypeId ? (
                <EmptyState
                  title="Select User Type"
                  description="Choose the user type first to load and stage screen permissions."
                />
              ) : existingPermissionsQuery.isError ? (
                <ErrorState
                  description="Existing screen-level permissions could not be loaded for the selected user type."
                  action={
                    <Button variant="outline" onClick={() => existingPermissionsQuery.refetch()}>
                      Retry
                    </Button>
                  }
                />
              ) : existingPermissionsQuery.isLoading ? (
                <LoadingState label="Loading existing permission rows..." />
              ) : !selectedMainScreenId ? (
                <EmptyState
                  title="Select Main Screen"
                  description="Choose a main screen to filter the available user sections and screen permissions."
                />
              ) : screenSectionOptions.isLoading ? (
                <LoadingState label="Loading user sections..." />
              ) : (screenSectionOptions.data ?? []).length === 0 ? (
                <EmptyState
                  title="No user sections found"
                  description="Create user sections under this main screen before assigning screen permissions."
                />
              ) : !selectedSectionId ? (
                <EmptyState
                  title="Select User Section"
                  description="Choose a user section to open the screen permission matrix."
                />
              ) : visibleScreens.length === 0 ? (
                <EmptyState
                  title="No user screens found"
                  description="Add user screens to this section before assigning permissions."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <Table className="min-w-[880px]">
                    <TableHeader className="bg-slate-100/80">
                      <TableRow className="hover:bg-slate-100/80">
                        <TableHead className="min-w-[260px] font-semibold text-slate-700">Screen Name</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700">
                          <PermissionHeaderToggle
                            label="All"
                            checked={visibleAllSelected}
                            disabled={visibleScreens.length === 0}
                            onToggle={handleVisibleMatrixToggleAll}
                          />
                        </TableHead>
                        {ACTIONS.map((action) => (
                          <TableHead key={action} className="text-center font-semibold uppercase text-slate-700">
                            <PermissionHeaderToggle
                              label={action}
                              checked={visibleActionColumnState[action].enabled}
                              disabled={visibleActionColumnState[action].disabled}
                              onToggle={() => handleColumnActionToggle(action)}
                            />
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleScreens.map((screen) => {
                        const currentEntry = selections[screen.id];
                        const currentPermissions = normalizeActionPermissions(
                          screen.available_actions,
                          currentEntry?.action_permissions,
                        );

                        return (
                          <TableRow key={screen.id} className="hover:bg-slate-50/80">
                            <TableCell className="space-y-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900">{screen.screen_name}</div>
                                  <div className="truncate text-xs text-slate-500">
                                    {getRoutePathForScreenCode(screen.code ?? "", screen.route_path)}
                                  </div>
                                </div>
                                {currentEntry ? (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px]",
                                      currentEntry.is_active
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-100 text-slate-600",
                                    )}
                                  >
                                    {currentEntry.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={Boolean(currentPermissions.all)}
                                onCheckedChange={() => handleToggleAllActions(screen)}
                              />
                            </TableCell>
                            {ACTIONS.map((action) => {
                              const isAvailable = screen.available_actions.includes(action);

                              return (
                                <TableCell key={action} className="text-center">
                                  {isAvailable ? (
                                    <Checkbox
                                      checked={Boolean(currentPermissions[action])}
                                      onCheckedChange={() => handleRowActionToggle(screen, action)}
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-300">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">Selected Permissions Summary</CardTitle>
                  <CardDescription>
                    Review everything staged in frontend memory before the final save.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">User Type</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{selectedUserTypeLabel}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Configured Screens</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{configuredRows.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Configured Sections</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{summaryGroups.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Granted Actions</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{totalGrantedActions}</div>
                </div>
              </div>

              {summaryGroups.length === 0 ? (
                <EmptyState
                  title="No permissions staged yet"
                  description="Select a main screen and user section, then check actions in the permission matrix."
                />
              ) : (
                <div className="space-y-3">
                  {summaryGroups.map((group) => (
                    <div key={group.contextKey} className="rounded-xl border border-slate-200 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">{group.mainScreenName}</div>
                          <div className="text-sm text-slate-500">{group.sectionName}</div>
                        </div>
                        <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                          {group.screenCount} screen{group.screenCount === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {group.actionCount} action{group.actionCount === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {group.activeCount} active row{group.activeCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        {group.screenNames.slice(0, 4).map((screenName) => (
                          <div key={screenName} className="flex items-center gap-2">
                            <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{screenName}</span>
                          </div>
                        ))}
                        {group.screenNames.length > 4 ? (
                          <div className="pl-5 text-[11px] text-slate-400">
                            +{group.screenNames.length - 4} more screen{group.screenNames.length - 4 === 1 ? "" : "s"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-600">
              {isDirty ? "Unsaved permission changes are staged locally." : "All staged permissions match the last loaded state."}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty || saveMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!selectedUserTypeId || payload.length === 0 || saveMutation.isPending}
                className="min-w-[180px]"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Permission"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserScreenPermissionAssignmentPage;
