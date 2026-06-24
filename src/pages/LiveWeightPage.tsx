import { useState } from "react";
import { Scale, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useWeighscale } from "@/hooks/useWeighscale";

const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

const STATUS_CONFIG = {
  disconnected: { label: "Disconnected", className: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  connecting:   { label: "Connecting…",  className: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500 animate-pulse" },
  connected:    { label: "Connected",    className: "bg-green-100 text-green-700", dot: "bg-green-500" },
  error:        { label: "Error",        className: "bg-red-100 text-red-700", dot: "bg-red-500" },
} as const;

export default function LiveWeightPage() {
  const {
    ports,
    selectedPort,
    setSelectedPort,
    baudRate,
    setBaudRate,
    connectionStatus,
    lastReading,
    readingLog,
    errorMessage,
    retryCountdown,
    connect,
    disconnect,
    refreshPorts,
  } = useWeighscale();

  const [logOpen, setLogOpen]     = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);

  const isConnected   = connectionStatus === "connected";
  const isConnecting  = connectionStatus === "connecting";
  const badge         = STATUS_CONFIG[connectionStatus];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weighscale Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect a USB serial scale and stream live weight readings
        </p>
      </div>

      {/* Connection Panel */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-card-foreground">Serial Connection</span>
          {/* Status Badge */}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.label}
            {retryCountdown > 0 && ` (retry in ${retryCountdown}s)`}
          </span>
        </div>

        {/* Port selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Serial Port
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={isConnected || isConnecting}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Select port —</option>
              {ports.map((p) => (
                <option key={p.device} value={p.device} title={p.description}>
                  {p.device}{p.description ? ` — ${p.description}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={refreshPorts}
              disabled={isConnecting}
              title="Refresh port list"
              className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          {ports.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No serial ports found. Connect the weighscale and click Refresh.
            </p>
          )}
          {selectedPort && ports.find((p) => p.device === selectedPort)?.description && (
            <p className="text-xs text-muted-foreground">
              {ports.find((p) => p.device === selectedPort)?.description}
              {ports.find((p) => p.device === selectedPort)?.manufacturer
                ? ` · ${ports.find((p) => p.device === selectedPort)?.manufacturer}`
                : ""}
            </p>
          )}
        </div>

        {/* Baud rate selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Baud Rate
          </label>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={isConnected || isConnecting}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {BAUD_RATES.map((r) => (
              <option key={r} value={r}>
                {r.toLocaleString()} baud{r === 9600 ? " (default)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Connect / Disconnect + Error */}
        <div className="flex flex-col gap-2">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="h-9 px-5 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting || !selectedPort}
              className="h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isConnecting ? "Connecting…" : "Connect"}
            </button>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Weight Display */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-secondary border-b border-border">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-secondary-foreground">Live Reading</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={`text-xs font-medium ${isConnected ? "text-green-600" : "text-muted-foreground"}`}>
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>

        <div className="px-6 py-8 text-center select-none">
          <div className="text-6xl font-mono font-bold tracking-wider tabular-nums text-foreground">
            {lastReading != null ? lastReading.weight.toFixed(3) : "----.---"}
          </div>
          <div className="text-lg mt-2 text-muted-foreground font-medium">
            {lastReading?.unit?.toUpperCase() ?? "KG"}
          </div>
          {lastReading && (
            <div
              className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                lastReading.stable
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {lastReading.stable ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {lastReading.stable ? "STABLE" : "STABILIZING…"}
            </div>
          )}
        </div>
      </div>

      {/* Reading Log */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-secondary text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <span>Reading Log ({readingLog.length} / {50})</span>
          {logOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {logOpen && (
          <div className="overflow-x-auto">
            {readingLog.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No readings yet. Connect and stream data to see them here.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Weight</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Unit</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingLog.map((r, i) => (
                      <tr key={`${r.timestamp}-${i}`} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-4 py-1.5 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-4 py-1.5 text-right font-mono font-semibold text-foreground">
                          {r.weight.toFixed(3)}
                        </td>
                        <td className="px-4 py-1.5 text-center text-muted-foreground">{r.unit}</td>
                        <td className="px-4 py-1.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              r.stable
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {r.stable ? "Stable" : "Unstable"}
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-right text-xs text-muted-foreground">
                          {new Date(r.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw Serial Debug Panel */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => setDebugOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-secondary text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <span>Raw Serial Debug</span>
          {debugOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {debugOpen && (
          <div className="px-5 py-3 space-y-1 max-h-48 overflow-y-auto font-mono text-xs bg-background">
            {readingLog.length === 0 ? (
              <p className="text-muted-foreground">No data yet.</p>
            ) : (
              readingLog.map((r, i) => (
                <div key={`raw-${r.timestamp}-${i}`} className="flex gap-3 text-muted-foreground">
                  <span className="text-muted-foreground/50 flex-shrink-0">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-foreground break-all">{r.raw}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
