import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";
import PermissionMatrixPage from "@/components/erp/PermissionMatrixPage";
import type { PermissionMatrixColumn } from "@/components/erp/types";
import { toast } from "@/components/ui/sonner";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { UserScreenPermKey, UserScreenPermRow } from "@/features/wpe-masters/types";

const COLUMNS: Array<PermissionMatrixColumn<UserScreenPermKey>> = [
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

const ALL_BOOL_KEYS: UserScreenPermKey[] = [
  "can_add",
  "can_edit",
  "can_duplicate",
  "can_delete",
  "generate_invoice_access",
  "invoice_access",
  "access",
];

const UserScreenPermissionsPage = () => {
  const queryClient = useQueryClient();
  const [activeScreen, setActiveScreen] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<UserScreenPermRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const initializedRef = useRef(false);

  const { data: screens = [] } = useQuery({
    queryKey: ["wpe-user-screen-perm", "screens"],
    queryFn: wpeMastersApi.userScreenPermissions.listScreens,
  });

  useEffect(() => {
    if (screens.length && !initializedRef.current) {
      setActiveScreen(screens[0].id);
      initializedRef.current = true;
    }
  }, [screens]);

  const { data: serverMatrix, isFetching } = useQuery({
    queryKey: ["wpe-user-screen-perm", "matrix", activeScreen],
    queryFn: () => wpeMastersApi.userScreenPermissions.getMatrix(activeScreen!),
    enabled: activeScreen != null,
  });

  useEffect(() => {
    if (serverMatrix) {
      setMatrix(serverMatrix);
      setDirty(false);
    }
  }, [serverMatrix]);

  const saveMutation = useMutation({
    mutationFn: () => wpeMastersApi.userScreenPermissions.bulkSave(activeScreen!, matrix),
    onSuccess: () => {
      toast.success("Permissions saved.");
      queryClient.invalidateQueries({ queryKey: ["wpe-user-screen-perm", "matrix", activeScreen] });
      setDirty(false);
    },
    onError: () => toast.error("Failed to save permissions."),
  });

  const patchRow = (screenId: string | number, updates: Partial<UserScreenPermRow>) => {
    setMatrix((current) =>
      current.map((row) => (row.user_screen_id === screenId ? { ...row, ...updates } : row)),
    );
    setDirty(true);
  };

  const setView = (screenId: string | number, mode: "all" | "self" | "none") => {
    patchRow(screenId, { view_all: mode === "all", view_self: mode === "self" });
  };

  const toggleField = (screenId: string | number, key: UserScreenPermKey) => {
    const row = matrix.find((entry) => entry.user_screen_id === screenId);
    if (!row) {
      return;
    }
    patchRow(screenId, { [key]: !row[key] });
  };

  const allChecked = (key: UserScreenPermKey) => matrix.length > 0 && matrix.every((row) => row[key]);

  const toggleColumn = (key: UserScreenPermKey) => {
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

  const rowAllChecked = (row: UserScreenPermRow) =>
    (row.view_all || row.view_self) && ALL_BOOL_KEYS.every((key) => row[key]);

  const toggleRow = (screenId: string | number) => {
    const row = matrix.find((entry) => entry.user_screen_id === screenId);
    if (!row) {
      return;
    }
    const nextValue = !rowAllChecked(row);
    patchRow(screenId, {
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
      title="User Screen Permissions"
      description="Configure what each screen allows per module. Changes apply after saving."
      emptyTitle="No main screens found"
      emptyDescription="Create screens via Admin → Main Screens first, then return here."
      icon={Monitor}
      screens={screens}
      activeScreen={activeScreen}
      onScreenChange={switchScreen}
      matrix={matrix}
      isLoading={isFetching}
      isSaving={saveMutation.isPending}
      dirty={dirty}
      onSave={() => saveMutation.mutate()}
      columns={COLUMNS}
      getRowKey={(row) => row.user_screen_id}
      getRowLabel={(row) => row.screen_name}
      getRowSecondaryLabel={(row) => row.screen_section_name}
      activeScreenName={`Screen — ${activeScreenName}`}
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

export default UserScreenPermissionsPage;
