import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import type { PermissionRow, PermKey } from "@/features/wpe-masters/types";
import { CheckSquare, Save, Shield } from "lucide-react";

/* ─── column definitions ─────────────────────────────────────────── */
type ColType = "radio-all" | "radio-self" | "checkbox" | "toggle";

const COLUMNS: { key: PermKey; label: string; short: string; type: ColType }[] = [
  { key: "view_all",                label: "View All",               short: "View All",    type: "radio-all"  },
  { key: "view_self",               label: "View Self",              short: "View Self",   type: "radio-self" },
  { key: "can_add",                 label: "Add",                    short: "Add",         type: "checkbox"   },
  { key: "can_edit",                label: "Edit",                   short: "Edit",        type: "checkbox"   },
  { key: "can_duplicate",           label: "Duplicate",              short: "Dup.",         type: "checkbox"   },
  { key: "can_delete",              label: "Delete",                 short: "Delete",      type: "checkbox"   },
  { key: "generate_invoice_access", label: "Generate Invoice Access",short: "Gen. Invoice",type: "toggle"     },
  { key: "invoice_access",          label: "Invoice Access",         short: "Invoice",     type: "toggle"     },
  { key: "access",                  label: "Access",                 short: "Access",      type: "toggle"     },
];

const CHECKBOX_KEYS: PermKey[] = ["can_add", "can_edit", "can_duplicate", "can_delete"];
const TOGGLE_KEYS:   PermKey[] = ["generate_invoice_access", "invoice_access", "access"];
const ALL_BOOL_KEYS: PermKey[] = [...CHECKBOX_KEYS, ...TOGGLE_KEYS];

/* ─── helpers ────────────────────────────────────────────────────── */
const emptyRow = (role_id: number, role_name: string): PermissionRow => ({
  role_id, role_name,
  view_all: false, view_self: false,
  can_add: false, can_edit: false, can_duplicate: false, can_delete: false,
  generate_invoice_access: false, invoice_access: false, access: false,
});

/* ─── sub-components ─────────────────────────────────────────────── */
const Radio = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all ${
      checked ? "border-blue-500 bg-blue-500" : "border-slate-400 bg-white hover:border-blue-400"
    }`}
  >
    {checked && <span className="block h-1.5 w-1.5 rounded-full bg-white mx-auto mt-[3px]" />}
  </button>
);

const Tick = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`h-4 w-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
      checked ? "border-blue-500 bg-blue-500" : "border-slate-400 bg-white hover:border-blue-400"
    }`}
  >
    {checked && (
      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </button>
);

const ToggleBtn = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all border ${
      checked
        ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30"
        : "bg-white border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500"
    }`}
  >
    {label}
  </button>
);

/* ─── main component ─────────────────────────────────────────────── */
const RolePermissionsPage = () => {
  const qc = useQueryClient();
  const [activeScreen, setActiveScreen] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<PermissionRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const initRef = useRef(false);

  const { data: screens = [] } = useQuery({
    queryKey: ["wpe-role-perm", "screens"],
    queryFn: wpeMastersApi.rolePermissions.listScreens,
  });

  useEffect(() => {
    if (screens.length && !initRef.current) {
      setActiveScreen(screens[0].id);
      initRef.current = true;
    }
  }, [screens]);

  const { data: serverMatrix, isFetching } = useQuery({
    queryKey: ["wpe-role-perm", "matrix", activeScreen],
    queryFn: () => wpeMastersApi.rolePermissions.getMatrix(activeScreen!),
    enabled: activeScreen != null,
  });

  useEffect(() => {
    if (serverMatrix) { setMatrix(serverMatrix); setDirty(false); }
  }, [serverMatrix]);

  const saveMutation = useMutation({
    mutationFn: () => wpeMastersApi.rolePermissions.bulkSave(activeScreen!, matrix),
    onSuccess: () => {
      toast.success("Permissions saved.");
      qc.invalidateQueries({ queryKey: ["wpe-role-perm", "matrix", activeScreen] });
      setDirty(false);
    },
    onError: () => toast.error("Failed to save permissions."),
  });

  /* mutations */
  const patch = (roleId: number, updates: Partial<PermissionRow>) => {
    setMatrix((prev) => prev.map((r) => r.role_id === roleId ? { ...r, ...updates } : r));
    setDirty(true);
  };

  const setView = (roleId: number, mode: "all" | "self" | "none") =>
    patch(roleId, { view_all: mode === "all", view_self: mode === "self" });

  const toggleField = (roleId: number, key: PermKey) => {
    const row = matrix.find((r) => r.role_id === roleId);
    if (row) patch(roleId, { [key]: !row[key] });
  };

  /* column-header "select all" */
  const allChecked = (key: PermKey) => matrix.length > 0 && matrix.every((r) => r[key]);

  const toggleCol = (key: PermKey) => {
    const target = !allChecked(key);
    if (key === "view_all") {
      setMatrix((prev) => prev.map((r) => ({ ...r, view_all: target, view_self: target ? false : r.view_self })));
    } else if (key === "view_self") {
      setMatrix((prev) => prev.map((r) => ({ ...r, view_self: target, view_all: target ? false : r.view_all })));
    } else {
      setMatrix((prev) => prev.map((r) => ({ ...r, [key]: target })));
    }
    setDirty(true);
  };

  /* row "select all" */
  const rowAllChecked = (row: PermissionRow) =>
    (row.view_all || row.view_self) && ALL_BOOL_KEYS.every((k) => row[k]);

  const toggleRow = (roleId: number) => {
    const row = matrix.find((r) => r.role_id === roleId);
    if (!row) return;
    const target = !rowAllChecked(row);
    patch(roleId, {
      view_all: target, view_self: false,
      ...Object.fromEntries(ALL_BOOL_KEYS.map((k) => [k, target])),
    });
  };

  /* screen tab change */
  const switchScreen = (id: number) => {
    if (dirty && !confirm("You have unsaved changes. Discard and switch?")) return;
    setActiveScreen(id);
    setMatrix([]);
    setDirty(false);
  };

  const activeScreenName = screens.find((s) => s.id === activeScreen)?.name ?? "";

  return (
    <div className="flex h-full flex-col gap-0">
      <div className="flex items-start justify-between gap-4 px-1 pb-4">
        <PageHeader
          title="Role Screen Permissions"
          description="Configure what each role can do per module. Changes apply after saving."
        />
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="flex-shrink-0 gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* ── Module tabs ─── */}
      {screens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <Shield className="h-10 w-10 text-slate-300" />
          <div className="text-sm font-medium text-slate-500">No main screens found</div>
          <div className="text-xs text-slate-400">
            Create screens via Admin → Main Screens first, then return here.
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {screens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchScreen(s.id)}
                  className={`relative flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                    s.id === activeScreen
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s.name}
                  {s.id === activeScreen && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Permission matrix ─── */}
          <div className="relative mt-4 flex-1 overflow-auto rounded-xl border border-slate-200 shadow-sm">
            {isFetching && matrix.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                Loading permissions…
              </div>
            ) : matrix.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                No active roles found. Add roles in the Role Master.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                {/* ── thead ─── */}
                <thead>
                  <tr>
                    {/* Role column */}
                    <th className="sticky left-0 z-20 min-w-[180px] border-b border-r border-slate-200 bg-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5 opacity-60" />
                        Role — {activeScreenName}
                      </div>
                    </th>

                    {/* Permission columns */}
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="border-b border-r border-slate-600 bg-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white last:border-r-0"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {/* select-all control */}
                          {col.type === "radio-all" || col.type === "radio-self" ? (
                            <Radio
                              checked={allChecked(col.key)}
                              onChange={() => toggleCol(col.key)}
                            />
                          ) : (
                            <Tick
                              checked={allChecked(col.key)}
                              onChange={() => toggleCol(col.key)}
                            />
                          )}
                          <span className="leading-tight">{col.short}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ── tbody ─── */}
                <tbody>
                  {matrix.map((row, idx) => (
                    <tr
                      key={row.role_id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      {/* Role name + row toggle */}
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Tick
                            checked={rowAllChecked(row)}
                            onChange={() => toggleRow(row.role_id)}
                          />
                          <span className="font-medium text-slate-700">{row.role_name}</span>
                        </div>
                      </td>

                      {/* View All */}
                      <td className="border-b border-r border-slate-200 px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Radio
                            checked={row.view_all}
                            onChange={() => setView(row.role_id, row.view_all ? "none" : "all")}
                          />
                          <span className="text-[10px] text-slate-400">View All</span>
                        </div>
                      </td>

                      {/* View Self */}
                      <td className="border-b border-r border-slate-200 px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Radio
                            checked={row.view_self}
                            onChange={() => setView(row.role_id, row.view_self ? "none" : "self")}
                          />
                          <span className="text-[10px] text-slate-400">View Self</span>
                        </div>
                      </td>

                      {/* Checkbox columns */}
                      {CHECKBOX_KEYS.map((key) => (
                        <td key={key} className="border-b border-r border-slate-200 px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <Tick
                              checked={row[key] as boolean}
                              onChange={() => toggleField(row.role_id, key)}
                            />
                            <span className="text-[10px] text-slate-400 capitalize">
                              {key.replace("can_", "")}
                            </span>
                          </div>
                        </td>
                      ))}

                      {/* Toggle button columns */}
                      {TOGGLE_KEYS.map((key) => (
                        <td key={key} className="border-b border-r border-slate-200 px-3 py-3 text-center last:border-r-0">
                          <ToggleBtn
                            checked={row[key] as boolean}
                            label={row[key] ? "Enabled" : "Disabled"}
                            onChange={() => toggleField(row.role_id, key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {dirty && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
              <span className="text-sm text-amber-700">You have unsaved changes.</span>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saveMutation.isPending ? "Saving…" : "Save Now"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RolePermissionsPage;
