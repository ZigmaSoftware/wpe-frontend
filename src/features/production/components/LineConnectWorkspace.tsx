import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Scale, ScanLine } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import type { ProductionLineRecord } from "@/features/production-masters/types";
import { lineConnectApi, type GlScancodeDetails, type LineConnectionRecord } from "@/features/production/api/lineConnectApi";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";

const formatDurationMs = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const detailCardClassName = "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm";

const connectionBadgeClassName = (status: "ON" | "OFF") =>
  status === "ON"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";

type DetailRowProps = {
  label: string;
  value: ReactNode;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</dt>
    <dd className="text-sm font-medium text-slate-900 sm:text-right">{value}</dd>
  </div>
);

const formatWeightPair = (availableWeight?: string | null, totalWeight?: string | null) => {
  const available = formatDecimal(availableWeight, 3);
  const total = formatDecimal(totalWeight ?? availableWeight, 3);
  if (available === "-" && total === "-") {
    return "----.--- / ----.---";
  }
  return `${available} / ${total}`;
};

const LineConnectWorkspace = () => {
  const queryClient = useQueryClient();
  const [scanValue, setScanValue] = useState("");
  const [scanned, setScanned] = useState<GlScancodeDetails | null>(null);
  const [displayedConnection, setDisplayedConnection] = useState<LineConnectionRecord | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [, forceTick] = useState(0);

  const activeConnection = displayedConnection?.status === "ON" ? displayedConnection : null;

  useEffect(() => {
    if (!displayedConnection || displayedConnection.status !== "ON") return;
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [displayedConnection]);

  const linesQuery = useQuery({
    queryKey: ["production-lines-for-line-connect"],
    queryFn: () => productionMastersApi.productionLines.list({ pageSize: 200, ordering: "name" }),
  });

  const lines: ProductionLineRecord[] = linesQuery.data?.items ?? [];
  const selectedLine = lines.find((line) => String(line.id) === selectedLineId) ?? null;

  const resetScan = () => {
    setScanned(null);
    setDisplayedConnection(null);
    setSelectedLineId("");
  };

  const scanMutation = useMutation({
    mutationFn: (code: string) => lineConnectApi.scanGlScancode(code),
    onSuccess: (details) => {
      setScanned(details);
      setDisplayedConnection(details.active_connection);
      setSelectedLineId(details.active_connection ? String(details.active_connection.production_line) : "");
      setScanValue("");
    },
    onError: (error) => {
      resetScan();
      toast.error(getApiErrorMessage(error, "Invalid or unavailable GL scancode. Please scan a valid bag."));
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => lineConnectApi.connect({ scan_code: scanned!.scan_code, production_line: Number(selectedLineId) }),
    onSuccess: (connection: LineConnectionRecord) => {
      setDisplayedConnection(connection);
      setSelectedLineId(String(connection.production_line));
      setScanned((prev) => (prev ? { ...prev, is_connected: true, active_connection: connection } : prev));
      queryClient.invalidateQueries({ queryKey: ["production-lines-for-line-connect"] });
      toast.success(`Bag ${connection.serial_no} connected to ${connection.production_line_name}.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to connect the bag to this line."));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => lineConnectApi.disconnect(activeConnection!.id),
    onSuccess: (connection: LineConnectionRecord) => {
      setDisplayedConnection(connection);
      setSelectedLineId(String(connection.production_line));
      setScanned((prev) => (prev ? { ...prev, is_connected: false, active_connection: null } : prev));
      queryClient.invalidateQueries({ queryKey: ["production-lines-for-line-connect"] });
      toast.success(`${connection.production_line_name} disconnected.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to disconnect this line."));
    },
  });

  const handleScan = () => {
    const code = scanValue.trim();
    if (!code) return;
    scanMutation.mutate(code);
  };

  const canConnect =
    !!scanned &&
    !activeConnection &&
    !!selectedLine &&
    selectedLine.status === "FREE" &&
    !linesQuery.isLoading &&
    !connectMutation.isPending;

  const durationLabel = useMemo(() => {
    if (!displayedConnection) return "-";
    if (displayedConnection.status === "OFF" && displayedConnection.disconnected_at) {
      return formatDurationMs(
        new Date(displayedConnection.disconnected_at).getTime() - new Date(displayedConnection.connected_at).getTime(),
      );
    }
    return formatDurationMs(Date.now() - new Date(displayedConnection.connected_at).getTime());
  }, [displayedConnection]);

  const displayLineName = displayedConnection?.production_line_name || selectedLine?.name || "-";
  const displayLineCode = displayedConnection?.production_line_code || selectedLine?.code || "-";
  const displayMachineName = displayedConnection?.machine_name || selectedLine?.machine_name || "-";
  const connectionStatus = displayedConnection?.status ?? "OFF";
  const bagWeight = scanned ? `${formatWeightPair(scanned.weight_kg, scanned.total_weight_kg)} kg` : "-";
  const bagWeightDisplay = scanned ? formatWeightPair(scanned.weight_kg, scanned.total_weight_kg) : "----.--- / ----.---";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Line Connect"
        description="Scan a GL bag from Connection to Line stock and connect it to an available production line."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={scanValue}
            autoFocus
            placeholder="Scan a Bin / Scan GL Scancode"
            onChange={(event) => setScanValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleScan();
              }
            }}
            className="h-12 border-slate-300 text-base lg:flex-1"
          />
          <Button
            className="h-12 min-w-[8.5rem] rounded-xl px-6"
            onClick={handleScan}
            disabled={!scanValue.trim() || scanMutation.isPending}
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanLine className="mr-2 h-4 w-4" />
                Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {!scanned ? (
        <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Enter a GL scancode and press Enter or Scan to validate the bag and load its weight, line and connection details.
        </div>
      ) : (
        <>
          <div className={cn(detailCardClassName, "space-y-5")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">GL Baglot</div>
                <div className="font-mono text-3xl font-bold tracking-tight text-slate-950">{scanned.serial_no || "-"}</div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Scan Code: {scanned.scan_code}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Available / Total Weight: {bagWeight}</span>
                  {scanned.production_id ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Production ID: {scanned.production_id}</span>
                  ) : null}
                </div>
              </div>

              <Badge className={cn("self-start", connectionBadgeClassName(connectionStatus))}>
                {connectionStatus === "ON" ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            <div className="rounded-lg overflow-hidden border border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-secondary">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-secondary-foreground">Bag Weight (Available / Total)</span>
                </div>
              </div>
              <div className="weight-display px-6 py-5 text-center">
                <div className="text-4xl font-mono font-bold tracking-wider">
                  {bagWeightDisplay}
                </div>
                <div className="text-sm mt-1 opacity-70">KG</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={detailCardClassName}>
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Bag Details</div>
              <dl className="divide-y divide-slate-200/80">
                <DetailRow label="Item ID" value={scanned.item_code || "-"} />
                <DetailRow label="Item Name" value={scanned.item_name || "-"} />
                <DetailRow label="Trans Ref#" value={scanned.reference_no || "-"} />
                <DetailRow label="Serial No." value={scanned.serial_no || "-"} />
              </dl>
            </div>

            <div className={detailCardClassName}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Line / Machine</div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">{displayLineName}</div>
                  <div className="text-sm text-slate-500">
                    {displayLineCode !== "-" ? `${displayLineCode} • ` : ""}
                    Machine: {displayMachineName}
                  </div>
                </div>
                <Badge className={connectionBadgeClassName(connectionStatus)}>{connectionStatus}</Badge>
              </div>

              <dl className="divide-y divide-slate-200/80">
                <DetailRow label="Connect Status" value={connectionStatus} />
                <DetailRow
                  label="ON Date / Time"
                  value={displayedConnection?.connected_at ? formatDateTime(displayedConnection.connected_at) : "-"}
                />
                <DetailRow
                  label="OFF Date / Time"
                  value={displayedConnection?.disconnected_at ? formatDateTime(displayedConnection.disconnected_at) : "-"}
                />
                <DetailRow label="Duration" value={durationLabel} />
              </dl>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.92fr)]">
            <div className={detailCardClassName}>
              <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Production Line Connector
              </label>
              <Select value={selectedLineId} onValueChange={setSelectedLineId} disabled={!!activeConnection || linesQuery.isLoading}>
                <SelectTrigger className="h-12 rounded-xl border-slate-300">
                  <SelectValue placeholder={linesQuery.isLoading ? "Loading production lines..." : "Select production line"} />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={String(line.id)} disabled={line.status !== "FREE"}>
                      {line.name}
                      {line.machine_name ? `: ${line.machine_name}` : ""}
                      {line.status !== "FREE" ? ` (${line.status})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={detailCardClassName}>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Actions</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="h-12 rounded-xl" onClick={() => connectMutation.mutate()} disabled={!canConnect}>
                  {connectMutation.isPending ? "Connecting..." : "CONNECT"}
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 rounded-xl"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={!activeConnection || disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "DISCONNECT"}
                </Button>
              </div>

              {!activeConnection && !canConnect ? (
                <p className="mt-3 text-xs text-slate-500">Select a free production line to enable Connect.</p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LineConnectWorkspace;
