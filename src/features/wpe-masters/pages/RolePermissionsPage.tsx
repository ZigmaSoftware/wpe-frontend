import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import PermissionMatrixPage from "@/components/erp/PermissionMatrixPage";
import type { PermissionMatrixColumn } from "@/components/erp/types";
import { toast } from "@/components/ui/sonner";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { PermissionRow, PermKey } from "@/features/wpe-masters/types";

const COLUMNS: Array<PermissionMatrixColumn<PermKey>> = [
  { key: "view_all", label: "View All", shortLabel: "View All", kind: "radio-all" },
  { key: "view_self", label: "View Self", shortLabel: "View Self", kind: "radio-self" },
  { key: "can_add", label: "Add", shortLabel: "Add", kind: "checkbox" },
  { key: "can_edit", label: "Edit", shortLabel: "Edit", kind: "checkbox" },
  { key: "can_duplicate", label: "Duplicate", shortLabel: "Dup.", kind: "checkbox" },
  { key: "can_delete", label: "Delete", shortLabel: "Delete", kind: "checkbox" },
  { key: "generate_invoice_access", label: "Gen. Invoice", shortLabel: "Gen. Invoice", kind: "toggle" },
  { key: "invoice_access", label: "Invoice", shortLabel: "Invoice", kind: "toggle" },
  { key: "access", label: "Access", shortLabel: "Access", kind: "toggle" },
];

const ALL_BOOL_KEYS: PermKey[] = [
  "can_add",
  "can_edit",
  "can_duplicate",
  "can_delete",
  "generate_invoice_access",
  "invoice_access",
  "access",
];

const RolePermissionsPage = () => {
  const queryClient = useQueryClient();
  const [activeScreen, setActiveScreen] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<PermissionRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const initializedRef = useRef(false);

  const { data: screens = [] } = useQuery({
    queryKey: ["wpe-role-perm", "screens"],
    queryFn: wpeMastersApi.rolePermissions.listScreens,
  });

  useEffect(() => {
    if (screens.length && !initializedRef.current) {
      setActiveScreen(screens[0].id);
      initializedRef.current = true;
    }
  }, [screens]);

  const { data: serverMatrix, isFetching } = useQuery({
    queryKey: ["wpe-role-perm", "matrix", activeScreen],
    queryFn: () => wpeMastersApi.rolePermissions.getMatrix(activeScreen!),
    enabled: activeScreen != null,
  });

  useEffect(() => {
    if (serverMatrix) {
      setMatrix(serverMatrix);
      setDirty(false);
    }
  }, [serverMatrix]);

  const saveMutation = useMutation({
    mutationFn: () => wpeMastersApi.rolePermissions.bulkSave(activeScreen!, matrix),
    onSuccess: () => {
      toast.success("Permissions saved.");
      queryClient.invalidateQueries({ queryKey: ["wpe-role-perm", "matrix", activeScreen] });
      setDirty(false);
    },
    onError: () => toast.error("Failed to save permissions."),
  });

  const patchRow = (roleId: string | number, updates: Partial<PermissionRow>) => {
    setMatrix((current) => current.map((row) => (row.role_id === roleId ? { ...row, ...updates } : row)));
    setDirty(true);
  };

  const setView = (roleId: string | number, mode: "all" | "self" | "none") => {
    patchRow(roleId, { view_all: mode === "all", view_self: mode === "self" });
  };

  const toggleField = (roleId: string | number, key: PermKey) => {
    const row = matrix.find((entry) => entry.role_id === roleId);
    if (!row) {
      return;
    }
    patchRow(roleId, { [key]: !row[key] });
  };

  const allChecked = (key: PermKey) => matrix.length > 0 && matrix.every((row) => row[key]);

  const toggleColumn = (key: PermKey) => {
    const nextValue = !allChecked(key);
    if (key === "view_all") {
      setMatrix((current) =>
        current.map((row) => ({ ...row, view_all: nextValue, view_self: nextValue ? false : row.view_self })),
      );
    } else if (key === "view_self") {
      setMatrix((current) =>
        current.map((row) => ({ ...row, view_self: nextValue, view_all: nextValue ? false : row.view_all })),
      );
    } else {
      setMatrix((current) => current.map((row) => ({ ...row, [key]: nextValue })));
    }
    setDirty(true);
  };

  const rowAllChecked = (row: PermissionRow) => (row.view_all || row.view_self) && ALL_BOOL_KEYS.every((key) => row[key]);

  const toggleRow = (roleId: string | number) => {
    const row = matrix.find((entry) => entry.role_id === roleId);
    if (!row) {
      return;
    }
    const nextValue = !rowAllChecked(row);
    patchRow(roleId, {
      view_all: nextValue,
      view_self: false,
      ...Object.fromEntries(ALL_BOOL_KEYS.map((key) => [key, nextValue])),
    });
  };

  const switchScreen = (screenId: number) => {
    if (dirty && !window.confirm("You have unsaved changes. Discard and switch?")) {
      return;
    }
    setActiveScreen(screenId);
    setMatrix([]);
    setDirty(false);
  };

  const activeScreenName = screens.find((screen) => screen.id === activeScreen)?.name ?? "";

  return (
    <PermissionMatrixPage
      title="Role Screen Permissions"
      description="Configure what each role can do per module. Changes apply after saving."
      emptyTitle="No main screens found"
      emptyDescription="Create screens via Admin → Main Screens first, then return here."
      icon={Shield}
      screens={screens}
      activeScreen={activeScreen}
      onScreenChange={switchScreen}
      matrix={matrix}
      isLoading={isFetching}
      isSaving={saveMutation.isPending}
      dirty={dirty}
      onSave={() => saveMutation.mutate()}
      columns={COLUMNS}
      getRowKey={(row) => row.role_id}
      getRowLabel={(row) => row.role_name}
      activeScreenName={`Role — ${activeScreenName}`}
      allChecked={allChecked}
      toggleColumn={toggleColumn}
      rowAllChecked={rowAllChecked}
      toggleRow={toggleRow}
      getValue={(row, key) => Boolean(row[key])}
      setView={setView}
      toggleField={toggleField}
    />
  );
};

export default RolePermissionsPage;
