import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Link2, Link2Off, Loader2, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EmptyState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productionLineConnectApi, type ProductionLineConnectLookupResult } from "@/features/production/api/productionLineConnectApi";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import type { ProductionLineRecord } from "@/features/production-masters/types";
import { PRODUCTION_PR_PRODUCTION_ROUTE } from "@/features/production/utils/routes";
import { toast } from "@/components/ui/sonner";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";

type ValidationTone = "neutral" | "success" | "error" | "info";

const EMPTY_LINE_OPTIONS: ProductionLineRecord[] = [];

const toneClassName: Record<ValidationTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const statusBadgeClassName = (status: "ON" | "OFF" | "AVAILABLE") =>
  status === "ON"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "OFF"
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : "border-amber-200 bg-amber-50 text-amber-700";

const buildLineLabel = (line: Pick<ProductionLineRecord, "name" | "machine_name">) =>
  line.machine_name ? `${line.name}: ${line.machine_name}` : line.name;

const ProductionLineConnectPage = () => {
  const navigate = useNavigate();
  const [scanInput, setScanInput] = useState("");
  const [lookupData, setLookupData] = useState<ProductionLineConnectLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState("");
  const [lastLoadedScan, setLastLoadedScan] = useState("");

  const linesQuery = useQuery({
    queryKey: ["production-lines", "line-connect-active"],
    queryFn: () =>
      productionMastersApi.productionLines.list({
        page: 1,
        pageSize: 200,
        is_active: true,
        ordering: "name",
      }),
  });

  const lookupMutation = useMutation({
    mutationFn: (scanCode: string) => productionLineConnectApi.lookup(scanCode),
    onSuccess: (data) => {
      setLookupData(data);
      setLookupError(null);
      setLastLoadedScan(data.scancode || scanInput.trim());
      setSelectedLineId(data.current_connection ? String(data.current_connection.production_line) : "");
    },
    onError: (error) => {
      setLookupData(null);
      setSelectedLineId("");
      setLookupError(getApiErrorMessage(error, "Unable to load the scanned GL bag details."));
    },
  });

  const connectMutation = useMutation({
    mutationFn: (payload: { scan_code: string; production_line_id: number }) => productionLineConnectApi.connect(payload),
    onSuccess: () => {
      toast.success("Line connection saved.");
      if (lastLoadedScan) {
        lookupMutation.mutate(lastLoadedScan);
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to connect the scanned bag to the selected line."));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: number) => productionLineConnectApi.disconnect(connectionId),
    onSuccess: () => {
      toast.success("Line disconnected.");
      if (lastLoadedScan) {
        lookupMutation.mutate(lastLoadedScan);
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to disconnect the selected line connection."));
    },
  });

  const lineOptions = linesQuery.data?.items ?? EMPTY_LINE_OPTIONS;
  const activeConnection = lookupData?.current_connection ?? null;
  const selectedLine = useMemo(
    () => lineOptions.find((line) => String(line.id) === selectedLineId) ?? null,
    [lineOptions, selectedLineId],
  );
  const occupiedLineMap = useMemo(
    () =>
      new Map(
        (lookupData?.occupied_lines ?? []).map((entry) => [String(entry.production_line_id), entry]),
      ),
    [lookupData?.occupied_lines],
  );
  const selectedLineOccupancy = selectedLineId ? occupiedLineMap.get(selectedLineId) ?? null : null;

  useEffect(() => {
    if (!activeConnection || !selectedLineId) {
      return;
    }
    if (String(activeConnection.production_line) !== selectedLineId) {
      setSelectedLineId(String(activeConnection.production_line));
    }
  }, [activeConnection, selectedLineId]);

  const selectedLineCard = selectedLine
    ? {
        name: selectedLine.name,
        machineName: selectedLine.machine_name || "-",
        machineCode: selectedLine.machine_code || "-",
        capacity: selectedLine.line_capacity
          ? `${formatDecimal(selectedLine.line_capacity)} ${selectedLine.capacity_uom || ""}`.trim()
          : "-",
        status: selectedLine.status,
      }
    : activeConnection
      ? {
          name: activeConnection.production_line_name,
          machineName: activeConnection.machine_name || "-",
          machineCode: activeConnection.machine_code || "-",
          capacity: "-",
          status: activeConnection.status,
        }
      : null;

  const validationState = useMemo(() => {
    if (!lookupData) {
      return {
        tone: "neutral" as const,
        message: "Scan a GL scancode from Connection to Line stock to load bag and line details.",
      };
    }

    if (activeConnection) {
      return {
        tone: "info" as const,
        message: `Bag ${lookupData.baglot} is already connected to ${activeConnection.production_line_name}.`,
      };
    }

    if (!selectedLine) {
      return {
        tone: "neutral" as const,
        message: "Select a production line to continue.",
      };
    }

    if (selectedLine.status === "MAINTENANCE") {
      return {
        tone: "error" as const,
        message: `${selectedLine.name} is under maintenance.`,
      };
    }

    if (selectedLineOccupancy) {
      return {
        tone: "error" as const,
        message: `${selectedLine.name} is already connected with another bag.`,
      };
    }

    if (selectedLine.status === "RUNNING") {
      return {
        tone: "error" as const,
        message: `${selectedLine.name} is not available for a new connection right now.`,
      };
    }

    return {
      tone: "success" as const,
      message: `Bag ${lookupData.baglot} is ready to connect to ${buildLineLabel(selectedLine)}.`,
    };
  }, [activeConnection, lookupData, selectedLine, selectedLineOccupancy]);

  const canConnect =
    Boolean(lookupData) &&
    Boolean(selectedLine) &&
    !activeConnection &&
    !selectedLineOccupancy &&
    selectedLine?.status === "FREE";
  const isMutating = connectMutation.isPending || disconnectMutation.isPending;
  const lookupTokenForConnect =
    lastLoadedScan ||
    lookupData?.scancode ||
    lookupData?.baglot ||
    lookupData?.reference_no ||
    scanInput.trim();

  const handleLookupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = scanInput.trim();
    if (!trimmed) {
      setLookupError("Scan a GL scancode or baglot to continue.");
      return;
    }
    lookupMutation.mutate(trimmed);
  };

  const handlePrimaryAction = () => {
    if (activeConnection) {
      disconnectMutation.mutate(activeConnection.id);
      return;
    }

    if (!lookupData || !selectedLine || !lookupTokenForConnect) {
      return;
    }

    connectMutation.mutate({
      scan_code: lookupTokenForConnect,
      production_line_id: selectedLine.id,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Line Connect"
        description="Connect a GL baglot / scancode from Connection to Line stock with a PR production line."
        actions={
          <Button variant="outline" onClick={() => navigate(PRODUCTION_PR_PRODUCTION_ROUTE)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to PR - Production
          </Button>
        }
      />

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleLookupSubmit}>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Scan GL Scancode
            </div>
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={scanInput}
                onChange={(event) => setScanInput(event.target.value)}
                placeholder="Scan GL Scancode"
                className="h-11 pl-10"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="h-11 min-w-[140px]" disabled={lookupMutation.isPending}>
              {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Load Details
            </Button>
          </div>
        </form>

        {lookupError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {lookupError}
          </div>
        ) : null}
      </div>

      {lookupData ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bag / GL Baglot</div>
                  <div className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{lookupData.baglot || "-"}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{lookupData.scancode}</div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClassName(lookupData.status)}`}>
                  {lookupData.status === "ON" ? "CONNECTED" : "AVAILABLE"}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Available Weight</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">
                    {formatDecimal(lookupData.available_weight)} {lookupData.uom || "KG"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Item</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{lookupData.item.item_name || "-"}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {lookupData.item.item_code || "-"}
                    {lookupData.item.id ? ` • #${lookupData.item.id}` : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Line / Machine</div>
              <div className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
                {selectedLineCard?.name || "No line selected"}
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Machine</span>
                  <span className="font-semibold text-slate-900">{selectedLineCard?.machineName || "-"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Machine Code</span>
                  <span className="font-semibold text-slate-900">{selectedLineCard?.machineCode || "-"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Capacity</span>
                  <span className="font-semibold text-slate-900">{selectedLineCard?.capacity || "-"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Line Status</span>
                  <span className="font-semibold text-slate-900">{selectedLineCard?.status || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold text-slate-950">Connection Details</div>
              <div className="mt-1 text-xs text-slate-500">
                Review current and historical line-connect events for the scanned GL baglot.
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Trans Ref#</TableHead>
                    <TableHead>Serial No.</TableHead>
                    <TableHead>Connect Status</TableHead>
                    <TableHead>ON Date / Time</TableHead>
                    <TableHead>OFF Date / Time</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lookupData.history.length > 0 ? (
                    lookupData.history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-slate-700">
                          {entry.item_code || "-"}
                          {entry.item ? <div className="text-[11px] text-slate-500">#{entry.item}</div> : null}
                        </TableCell>
                        <TableCell>{entry.item_name || "-"}</TableCell>
                        <TableCell>{entry.reference_no || lookupData.reference_no || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.scancode || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClassName(entry.status)}`}>
                            {entry.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDateTime(entry.connected_at)}</TableCell>
                        <TableCell>{formatDateTime(entry.disconnected_at)}</TableCell>
                        <TableCell>{entry.duration || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500">
                        No line connection has been recorded for this bag yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Production Line
                </div>
                <Select
                  value={selectedLineId || "none"}
                  onValueChange={(value) => setSelectedLineId(value === "none" ? "" : value)}
                  disabled={linesQuery.isLoading || isMutating}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select production line" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select production line</SelectItem>
                    {lineOptions.map((line) => {
                      const isOccupied = Boolean(occupiedLineMap.get(String(line.id)));
                      const isUnavailable =
                        line.status === "MAINTENANCE" ||
                        (line.status === "RUNNING" && String(activeConnection?.production_line || "") !== String(line.id)) ||
                        isOccupied;

                      return (
                        <SelectItem key={line.id} value={String(line.id)} disabled={isUnavailable}>
                          {buildLineLabel(line)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className={`rounded-lg border px-3 py-2 text-sm ${toneClassName[validationState.tone as ValidationTone]}`}>
                  {validationState.message}
                </div>
                {linesQuery.isError ? (
                  <div className="text-xs text-red-600">
                    {getApiErrorMessage(linesQuery.error, "Unable to load active production lines.")}
                  </div>
                ) : null}
              </div>

              <Button
                type="button"
                className="h-11 min-w-[170px]"
                disabled={activeConnection ? disconnectMutation.isPending : !canConnect || connectMutation.isPending}
                onClick={handlePrimaryAction}
              >
                {isMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeConnection ? (
                  <Link2Off className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {activeConnection ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <EmptyState
            title="Scan a GL scancode"
            description="Load a bag from Connection to Line stock to review its details and connect it with a PR production line."
          />
        </div>
      )}
    </div>
  );
};

export default ProductionLineConnectPage;
