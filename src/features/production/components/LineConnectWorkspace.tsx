import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import type { ProductionLineRecord } from "@/features/production-masters/types";
import { lineConnectApi, type GlScancodeDetails, type LineConnectionRecord } from "@/features/production/api/lineConnectApi";
import { formatDateTime, getApiErrorMessage } from "@/lib/api-helpers";

const formatDurationMs = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const LineConnectWorkspace = () => {
  const queryClient = useQueryClient();
  const [scanValue, setScanValue] = useState("");
  const [scanned, setScanned] = useState<GlScancodeDetails | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [, forceTick] = useState(0);

  const activeConnection = scanned?.active_connection ?? null;

  useEffect(() => {
    if (!activeConnection || activeConnection.status !== "ON") return;
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [activeConnection]);

  const linesQuery = useQuery({
    queryKey: ["production-lines-for-line-connect"],
    queryFn: () => productionMastersApi.productionLines.list({ pageSize: 200, ordering: "name" }),
  });

  const lines: ProductionLineRecord[] = linesQuery.data?.items ?? [];
  const selectedLine = lines.find((line) => String(line.id) === selectedLineId) ?? null;

  const resetScan = () => {
    setScanned(null);
    setSelectedLineId("");
  };

  const scanMutation = useMutation({
    mutationFn: (code: string) => lineConnectApi.scanGlScancode(code),
    onSuccess: (details) => {
      setScanned(details);
      setSelectedLineId(details.active_connection ? String(details.active_connection.production_line) : "");
    },
    onError: (error) => {
      resetScan();
      toast.error(getApiErrorMessage(error, "Invalid or unavailable GL scancode. Please scan a valid bag."));
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => lineConnectApi.connect({ scan_code: scanned!.scan_code, production_line: Number(selectedLineId) }),
    onSuccess: (connection: LineConnectionRecord) => {
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
      toast.success(`${connection.production_line_name} disconnected.`);
      queryClient.invalidateQueries({ queryKey: ["production-lines-for-line-connect"] });
      resetScan();
      setScanValue("");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to disconnect this line."));
    },
  });

  const handleScan = () => {
    const code = scanValue.trim();
    if (!code) return;
    scanMutation.mutate(code);
    setScanValue("");
  };

  const canConnect =
    !!scanned &&
    !activeConnection &&
    !!selectedLine &&
    selectedLine.status === "FREE" &&
    !connectMutation.isPending;

  const durationLabel = useMemo(() => {
    if (!activeConnection) return "-";
    if (activeConnection.status === "OFF" && activeConnection.disconnected_at) {
      return formatDurationMs(
        new Date(activeConnection.disconnected_at).getTime() - new Date(activeConnection.connected_at).getTime(),
      );
    }
    return formatDurationMs(Date.now() - new Date(activeConnection.connected_at).getTime());
  }, [activeConnection]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Line Connect"
        description="Scan a GL bag from Connection to Line stock and connect it to an available production line."
      />

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            className="sm:max-w-sm"
          />
          <Button onClick={handleScan} disabled={!scanValue.trim() || scanMutation.isPending}>
            {scanMutation.isPending ? "Scanning..." : "Scan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            GL Baglot
          </h3>
          {scanned ? (
            <div className="space-y-1">
              <div className="font-mono text-2xl font-bold">{scanned.serial_no}</div>
              <div className="text-sm text-muted-foreground">Scan Code: {scanned.scan_code}</div>
              <div className="text-sm text-muted-foreground">
                Available Weight: {scanned.weight_kg ? `${scanned.weight_kg} kg` : "-"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Scan a GL bag to see its bag and item details.</p>
          )}
          <LiveWeightDisplay deviceId="line-connect-scale-1" label="Bag Weight (Live)" showTareButton={false} />
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Line / Machine
          </h3>
          {selectedLine ? (
            <div className="space-y-2 text-sm">
              <div className="text-lg font-semibold">
                {selectedLine.name} <span className="text-muted-foreground">({selectedLine.code})</span>
              </div>
              <div className="text-muted-foreground">Machine: {selectedLine.machine_name || "-"}</div>
              <Badge variant={selectedLine.status === "FREE" ? "secondary" : "default"}>{selectedLine.status}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a production line below to see its details.</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
            {scanned ? (
              <TableRow>
                <TableCell>{scanned.item_code || "-"}</TableCell>
                <TableCell>{scanned.item_name || "-"}</TableCell>
                <TableCell>{scanned.reference_no || "-"}</TableCell>
                <TableCell>{scanned.serial_no || "-"}</TableCell>
                <TableCell>
                  <Badge variant={activeConnection?.status === "ON" ? "default" : "outline"}>
                    {activeConnection?.status ?? "OFF"}
                  </Badge>
                </TableCell>
                <TableCell>{activeConnection ? formatDateTime(activeConnection.connected_at) : "-"}</TableCell>
                <TableCell>{activeConnection?.disconnected_at ? formatDateTime(activeConnection.disconnected_at) : "-"}</TableCell>
                <TableCell>{durationLabel}</TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Scan a GL bag to view its connection details.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:max-w-xs">
          <label className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Production Line
          </label>
          <Select value={selectedLineId} onValueChange={setSelectedLineId} disabled={!!activeConnection}>
            <SelectTrigger>
              <SelectValue placeholder="Select production line" />
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

        {activeConnection?.status === "ON" ? (
          <Button variant="destructive" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
            {disconnectMutation.isPending ? "Disconnecting..." : "DISCONNECT"}
          </Button>
        ) : (
          <Button onClick={() => connectMutation.mutate()} disabled={!canConnect}>
            {connectMutation.isPending ? "Connecting..." : "CONNECT"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LineConnectWorkspace;
