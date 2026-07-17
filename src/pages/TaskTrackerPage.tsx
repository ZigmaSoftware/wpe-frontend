import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { taskTrackerApi, type TaskTrackerRow } from "@/features/task-tracker/api/taskTrackerApi";
import { getApiErrorMessage } from "@/lib/api-helpers";

type TrackerFormState = {
  open: boolean;
  mode: "add" | "edit";
  rowNumber: number | null;
  cells: string[];
};

const taskTrackerQueryKey = ["task-tracker", "rows"] as const;
const TASK_TRACKER_REFETCH_INTERVAL_MS = 60_000;

const createEmptyFormState = (): TrackerFormState => ({
  open: false,
  mode: "add",
  rowNumber: null,
  cells: [],
});

const formatColumnLabel = (header: string, index: number) => {
  const trimmed = header.trim();
  return trimmed || `Column ${index + 1}`;
};

const TaskTrackerPage = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<TrackerFormState>(createEmptyFormState);
  const [deleteTarget, setDeleteTarget] = useState<TaskTrackerRow | null>(null);
  const isModalOpen = formState.open || deleteTarget !== null;

  const trackerQuery = useQuery({
    queryKey: taskTrackerQueryKey,
    queryFn: taskTrackerApi.listRows,
    retry: false,
    placeholderData: (previousData) => previousData,
    refetchInterval: isModalOpen ? false : TASK_TRACKER_REFETCH_INTERVAL_MS,
  });

  const addMutation = useMutation({
    mutationFn: taskTrackerApi.addRow,
    onSuccess: async () => {
      setFormState(createEmptyFormState());
      toast.success("Task row added.");
      await queryClient.invalidateQueries({ queryKey: taskTrackerQueryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ row, cells }: { row: number; cells: string[] }) => taskTrackerApi.updateRow(row, cells),
    onSuccess: async () => {
      setFormState(createEmptyFormState());
      toast.success("Task row updated.");
      await queryClient.invalidateQueries({ queryKey: taskTrackerQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskTrackerApi.deleteRow,
    onSuccess: async () => {
      setDeleteTarget(null);
      toast.success("Task row deleted.");
      await queryClient.invalidateQueries({ queryKey: taskTrackerQueryKey });
    },
  });

  const headers = trackerQuery.data?.headers ?? [];
  const normalizedRows = useMemo(
    () =>
      (trackerQuery.data?.rows ?? []).map((row) => ({
        ...row,
        paddedCells: headers.map((_, columnIndex) => row.cells[columnIndex] ?? ""),
      })),
    [headers, trackerQuery.data?.rows],
  );
  const isSubmitting = addMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const lastUpdatedLabel =
    trackerQuery.dataUpdatedAt > 0 ? format(trackerQuery.dataUpdatedAt, "HH:mm:ss") : null;

  const openAddDialog = () => {
    setFormState({
      open: true,
      mode: "add",
      rowNumber: null,
      cells: headers.map(() => ""),
    });
  };

  const openEditDialog = (row: TaskTrackerRow) => {
    setFormState({
      open: true,
      mode: "edit",
      rowNumber: row._row,
      cells: headers.map((_, columnIndex) => row.cells[columnIndex] ?? ""),
    });
  };

  const updateFormCell = (index: number, value: string) => {
    setFormState((current) => ({
      ...current,
      cells: current.cells.map((cell, cellIndex) => (cellIndex === index ? value : cell)),
    }));
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!headers.length) {
      return;
    }

    try {
      if (formState.mode === "add") {
        await addMutation.mutateAsync(formState.cells);
        return;
      }

      if (formState.rowNumber !== null) {
        await updateMutation.mutateAsync({
          row: formState.rowNumber,
          cells: formState.cells,
        });
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          formState.mode === "add" ? "Unable to add the task row." : "Unable to update the task row.",
        ),
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget._row);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the task row."));
    }
  };

  const renderTable = () => {
    if (trackerQuery.isLoading && !trackerQuery.data) {
      return <LoadingState label="Loading live task tracker..." />;
    }

    if (trackerQuery.isError && !trackerQuery.data) {
      return (
        <ErrorState
          description={getApiErrorMessage(trackerQuery.error, "Unable to load the task tracker sheet.")}
          action={
            <Button variant="outline" onClick={() => void trackerQuery.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }

    if (!headers.length) {
      return (
        <EmptyState
          title="Sheet headers not found"
          description="Row 1 of the configured Google Sheet must contain column headers before task rows can be managed."
          action={
            <Button variant="outline" onClick={() => void trackerQuery.refetch()}>
              Refresh
            </Button>
          }
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[24px] border border-[#d8e2ef] bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eef6] px-5 py-4">
          <div>
            <h2 className="font-display text-[1.05rem] font-semibold text-[#10233f]">Sheet Rows</h2>
            <p className="mt-1 text-sm text-[#5b6b81]">
              Live Google Sheet mirror. Edit and delete actions always target the real sheet row number.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-[#d7e3f4] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#37517c]">
              {lastUpdatedLabel ? `Last updated ${lastUpdatedLabel}` : "Waiting for first sync"}
            </div>
            {isModalOpen ? (
              <div className="rounded-full border border-[#f1d99a] bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#8a6400]">
                Live polling paused while editing
              </div>
            ) : null}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
              <TableHead className="w-16 text-center">S.No</TableHead>
              <TableHead className="w-24">Sheet Row</TableHead>
              {headers.map((header, index) => (
                <TableHead key={`${header}-${index}`}>{formatColumnLabel(header, index)}</TableHead>
              ))}
              <TableHead className="w-[168px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedRows.length ? (
              normalizedRows.map((row, index) => (
                <TableRow key={row._row}>
                  <TableCell className="text-center font-medium text-[#6b7280]">{index + 1}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-[#edf3fb] px-2.5 py-1 text-xs font-semibold text-[#1C3A6B]">
                      {row._row}
                    </span>
                  </TableCell>
                  {row.paddedCells.map((cell, columnIndex) => (
                    <TableCell key={`${row._row}-${columnIndex}`} className="max-w-[240px] text-[#162033]">
                      <div className="truncate" title={cell}>
                        {cell || "-"}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#d5dfec] text-[#1C3A6B] hover:border-[#1C3A6B] hover:bg-[#eef4fd]"
                        onClick={() => openEditDialog(row)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#f3d6d6] text-[#b42318] hover:border-[#b42318] hover:bg-[#fff1f1]"
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length + 3} className="py-12 text-center text-sm text-[#64748b]">
                  No task rows found yet. Add the first row to start tracking work in the sheet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6 pt-4 md:pt-5">
      <section className="overflow-hidden rounded-[28px] border border-[#1C3A6B]/12 bg-[linear-gradient(135deg,#1C3A6B_0%,#22477f_62%,#10233f_100%)] shadow-[0_28px_60px_-36px_rgba(15,23,42,0.6)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f4d485]">
              <ClipboardList className="h-3.5 w-3.5" />
              Live Google Sheet
            </div>
            <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.04em] text-white">Task Tracker</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#d7e2f3]">
              Add, edit, and delete task rows in Google Sheets from the ERP while the view refreshes every minute.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/8 text-white hover:border-[#f4d485] hover:bg-white/12"
              onClick={() => void trackerQuery.refetch()}
              disabled={trackerQuery.isFetching}
            >
              <RefreshCw className={trackerQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <Button
              type="button"
              className="bg-[#f4d485] text-[#132745] shadow-[0_10px_22px_-14px_rgba(244,212,133,0.8)] hover:bg-[#e8c15d]"
              onClick={openAddDialog}
              disabled={!headers.length}
            >
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Columns synced</CardDescription>
            <CardTitle className="text-[1.6rem] text-[#10233f]">{headers.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">
            Header row is read from `Sheet1!A:Z` and drives the add/edit forms dynamically.
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Rows in view</CardDescription>
            <CardTitle className="text-[1.6rem] text-[#10233f]">{normalizedRows.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">
            Every record is linked back to its real Google Sheet row via the `_row` metadata.
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Sync status</CardDescription>
            <CardTitle className="flex items-center gap-2 text-[1.2rem] text-[#10233f]">
              <ShieldCheck className="h-5 w-5 text-[#1C3A6B]" />
              {isModalOpen ? "Paused for editing" : "Live every 1 min"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">
            {lastUpdatedLabel ? `Last successful sync at ${lastUpdatedLabel}.` : "Waiting for the first successful sync."}
          </CardContent>
        </Card>
      </section>

      <section>{renderTable()}</section>

      <Dialog
        open={formState.open}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setFormState((current) => ({ ...current, open }));
          }
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden rounded-[24px] border-[#d9e4f1] p-0">
          <form className="grid max-h-[88vh] grid-rows-[auto_minmax(0,1fr)_auto]" onSubmit={handleFormSubmit}>
            <DialogHeader className="border-b border-[#e7edf5] px-6 py-5">
              <DialogTitle className="font-display text-[1.35rem] text-[#10233f]">
                {formState.mode === "add" ? "Add Task Row" : `Edit Sheet Row ${formState.rowNumber ?? ""}`}
              </DialogTitle>
              <DialogDescription>
                One input is rendered for each sheet header. Changes write back to the live Google Sheet.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {headers.map((header, index) => (
                  <div key={`${header}-${index}`} className="space-y-2">
                    <Label htmlFor={`task-tracker-cell-${index}`}>{formatColumnLabel(header, index)}</Label>
                    <Input
                      id={`task-tracker-cell-${index}`}
                      value={formState.cells[index] ?? ""}
                      onChange={(event) => updateFormCell(index, event.target.value)}
                      placeholder={`Enter ${formatColumnLabel(header, index).toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="border-t border-[#e7edf5] px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="border-[#d5dfec] text-[#1C3A6B] hover:border-[#1C3A6B] hover:bg-[#eef4fd]"
                onClick={() => setFormState(createEmptyFormState())}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1C3A6B] text-white hover:bg-[#16325d]"
                disabled={isSubmitting || !headers.length}
              >
                {isSubmitting ? "Saving..." : formState.mode === "add" ? "Save Row" : "Update Row"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Task Row"
        description={
          deleteTarget
            ? `Delete Google Sheet row ${deleteTarget._row}? This removes the row from the sheet, not just the visible cells.`
            : "Delete the selected task row?"
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete Row"}
        cancelLabel="Cancel"
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
};

export default TaskTrackerPage;
