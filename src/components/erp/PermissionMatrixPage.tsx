import type { ElementType } from "react";
import { CheckSquare, Save } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";
import { LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import type { PermissionMatrixColumn } from "@/components/erp/types";

type MatrixScreen = {
  id: number;
  name: string;
};

const Radio = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-all ${
      checked ? "border-blue-500 bg-blue-500" : "border-slate-400 bg-white hover:border-blue-400"
    }`}
  >
    {checked ? <span className="mx-auto mt-[3px] block h-1.5 w-1.5 rounded-full bg-white" /> : null}
  </button>
);

const Tick = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
      checked ? "border-blue-500 bg-blue-500" : "border-slate-400 bg-white hover:border-blue-400"
    }`}
  >
    {checked ? (
      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : null}
  </button>
);

const ToggleChip = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) => (
  <button
    type="button"
    onClick={onChange}
    className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all border ${
      checked
        ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/30"
        : "border-slate-300 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-500"
    }`}
  >
    {label}
  </button>
);

const PermissionMatrixPage = <TRow, TKey extends string>({
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon: Icon,
  screens,
  activeScreen,
  onScreenChange,
  matrix,
  isLoading,
  isSaving,
  dirty,
  onSave,
  columns,
  getRowKey,
  getRowLabel,
  getRowSecondaryLabel,
  activeScreenName,
  allChecked,
  toggleColumn,
  rowAllChecked,
  toggleRow,
  getValue,
  setView,
  toggleField,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: ElementType;
  screens: MatrixScreen[];
  activeScreen: number | null;
  onScreenChange: (id: number) => void;
  matrix: TRow[];
  isLoading: boolean;
  isSaving: boolean;
  dirty: boolean;
  onSave: () => void;
  columns: Array<PermissionMatrixColumn<TKey>>;
  getRowKey: (row: TRow) => string | number;
  getRowLabel: (row: TRow) => string;
  getRowSecondaryLabel?: (row: TRow) => string | null | undefined;
  activeScreenName?: string;
  allChecked: (key: TKey) => boolean;
  toggleColumn: (key: TKey) => void;
  rowAllChecked: (row: TRow) => boolean;
  toggleRow: (rowKey: string | number) => void;
  getValue: (row: TRow, key: TKey) => boolean;
  setView: (rowKey: string | number, mode: "all" | "self" | "none") => void;
  toggleField: (rowKey: string | number, key: TKey) => void;
}) => (
  <div className="flex h-full flex-col gap-0">
    <div className="flex items-start justify-between gap-4 px-1 pb-4">
      <PageHeader title={title} description={description} />
      <Button onClick={onSave} disabled={!dirty || isSaving} className="flex-shrink-0 gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Saving…" : "Save Changes"}
      </Button>
    </div>

    {screens.length === 0 ? (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
        <Icon className="h-10 w-10 text-slate-300" />
        <div className="text-sm font-medium text-slate-500">{emptyTitle}</div>
        <div className="text-xs text-slate-400">{emptyDescription}</div>
      </div>
    ) : (
      <>
        <div className="relative">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {screens.map((screen) => (
              <button
                key={screen.id}
                onClick={() => onScreenChange(screen.id)}
                className={`relative flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                  screen.id === activeScreen ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {screen.name}
                {screen.id === activeScreen ? <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-600" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 flex-1 overflow-auto rounded-xl border border-slate-200 shadow-sm">
          {isLoading && matrix.length === 0 ? (
            <LoadingState label="Loading permissions..." />
          ) : matrix.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              No rows found for this module.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-slate-200 bg-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5 opacity-60" />
                      <span>{activeScreenName}</span>
                    </div>
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="border-b border-r border-slate-600 bg-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white last:border-r-0"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        {column.kind === "radio-all" || column.kind === "radio-self" ? (
                          <Radio checked={allChecked(column.key)} onChange={() => toggleColumn(column.key)} />
                        ) : (
                          <Tick checked={allChecked(column.key)} onChange={() => toggleColumn(column.key)} />
                        )}
                        <span className="leading-tight">{column.shortLabel}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, index) => {
                  const rowKey = getRowKey(row);
                  const secondaryLabel = getRowSecondaryLabel?.(row);

                  return (
                    <tr key={rowKey} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Tick checked={rowAllChecked(row)} onChange={() => toggleRow(rowKey)} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-700">{getRowLabel(row)}</div>
                            {secondaryLabel ? <div className="truncate text-[11px] text-slate-400">{secondaryLabel}</div> : null}
                          </div>
                        </div>
                      </td>

                      {columns.map((column) => (
                        <td key={column.key} className="border-b border-r border-slate-200 px-3 py-3 text-center last:border-r-0">
                          <div className="flex flex-col items-center gap-0.5">
                            {column.kind === "radio-all" ? (
                              <Radio
                                checked={getValue(row, column.key)}
                                onChange={() => setView(rowKey, getValue(row, column.key) ? "none" : "all")}
                              />
                            ) : null}
                            {column.kind === "radio-self" ? (
                              <Radio
                                checked={getValue(row, column.key)}
                                onChange={() => setView(rowKey, getValue(row, column.key) ? "none" : "self")}
                              />
                            ) : null}
                            {column.kind === "checkbox" ? (
                              <Tick checked={getValue(row, column.key)} onChange={() => toggleField(rowKey, column.key)} />
                            ) : null}
                            {column.kind === "toggle" ? (
                              <ToggleChip
                                checked={getValue(row, column.key)}
                                label={getValue(row, column.key) ? "Enabled" : "Disabled"}
                                onChange={() => toggleField(rowKey, column.key)}
                              />
                            ) : null}
                            <span className="text-[10px] text-slate-400">{column.label}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {dirty ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
            <span className="text-sm text-amber-700">You have unsaved changes.</span>
            <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving…" : "Save Now"}
            </Button>
          </div>
        ) : null}
      </>
    )}
  </div>
);

export default PermissionMatrixPage;
