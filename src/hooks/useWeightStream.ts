import { useState, useEffect, useCallback, useRef } from "react";
import { coreApi } from "@/lib/api";
import { BACKEND_WS } from "@/lib/env";

export interface WeightData {
  value: number;
  unit: "kg" | "g";
  stable: boolean;
  timestamp: Date;
  deviceId: string;
}

interface UseWeightStreamOptions {
  deviceId: string;
  enabled?: boolean;
  scaleDeviceId?: string | null;
  tolerancePercent?: number;
  workstationId?: string | null;
}

export type ScaleConnectionStatus =
  | "stable"
  | "unstable"
  | "overload"
  | "connected"
  | "disconnected"
  | "error"
  | "no_serial_port"
  | "invalid_reading"
  | "bridge_not_reporting";

interface ScaleApiResponse {
  weight:          string;
  unit:            string;
  status:          ScaleConnectionStatus;
  timestamp:       string | null;
  last_seen_at?:   string | null;
  raw_data:        string;
  error:           string | null;
  detected_port:   string | null;
  device_id?:      string | null;
  platform:        string;
  source?:         string | null;
  workstation_id?: string | null;
}

const CONNECTED_STATUSES = new Set<ScaleConnectionStatus>([
  "connected", "stable", "unstable", "overload",
]);

const STATUS_LABELS: Record<ScaleConnectionStatus, string> = {
  stable:               "Scale Connected",
  unstable:             "Scale Connected",
  overload:             "Scale Connected",
  connected:            "Scale Connected",
  disconnected:         "Scale Offline",
  error:                "Scale Error",
  no_serial_port:       "No Serial Port",
  invalid_reading:      "Invalid Reading",
  bridge_not_reporting: "Bridge Not Reporting",
};

export function useWeightStream({
  deviceId,
  enabled = true,
  scaleDeviceId = null,
  tolerancePercent = 0.5,
  workstationId = null,
}: UseWeightStreamOptions) {
  const [weight, setWeight]         = useState<WeightData | null>(null);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [status, setStatus]         = useState<ScaleConnectionStatus>("disconnected");
  const [source, setSource]         = useState<string | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(null);
  const [resolvedDeviceId, setResolvedDeviceId]             = useState<string | null>(null);
  const [resolvedWorkstationId, setResolvedWorkstationId]   = useState<string | null>(null);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  const isBridgeMode = !!(scaleDeviceId || workstationId);

  // ── Visibility tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setIsDocumentVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const isActive = enabled && isDocumentVisible;

  // ── Bridge mode: HTTP polling ────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isBridgeMode || !isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!isBridgeMode) return;
      setConnected(false);
      setStatus("disconnected");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await coreApi.get<ScaleApiResponse>("/api/scale/weight/latest/", {
          params: {
            device_id:      scaleDeviceId || undefined,
            workstation_id: workstationId || undefined,
          },
        });
        const d = res.data;
        if (cancelled) return;

        const nextStatus = d.status ?? "error";
        const isConnected = CONNECTED_STATUSES.has(nextStatus);
        setStatus(nextStatus);
        setConnected(isConnected);
        setError(d.error ?? null);
        setSource(d.source ?? null);
        setResolvedDeviceId(d.device_id ?? scaleDeviceId ?? null);
        setResolvedWorkstationId(d.workstation_id ?? workstationId ?? null);
        setLastSeenAt(
          d.last_seen_at ? new Date(d.last_seen_at) : d.timestamp ? new Date(d.timestamp) : null,
        );

        if (isConnected) {
          const value = parseFloat(d.weight);
          if (!isNaN(value)) {
            setWeight({
              value,
              unit:      (d.unit === "g" ? "g" : "kg") as "kg" | "g",
              stable:    d.status === "stable" || d.status === "connected",
              timestamp: d.timestamp ? new Date(d.timestamp) : new Date(),
              deviceId,
            });
          }
        } else {
          setWeight(null);
        }
      } catch (err) {
        if (cancelled) return;
        setConnected(false);
        setStatus("error");
        setWeight(null);
        setError(err instanceof Error ? err.message : "Scale endpoint unreachable");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnected(false);
    };
  }, [isBridgeMode, isActive, scaleDeviceId, workstationId, deviceId]);

  // ── Direct mode: WebSocket subscription ─────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isBridgeMode || !isActive) {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (!isBridgeMode) {
        setConnected(false);
        setStatus("disconnected");
      }
      return;
    }

    const ws = new WebSocket(`${BACKEND_WS}/ws/weighscale/`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "weight") {
          const value = Number(msg.weight);
          if (!isNaN(value)) {
            const st = msg.stable ? "stable" : ("connected" as ScaleConnectionStatus);
            setStatus(st);
            setConnected(true);
            setError(null);
            setSource("server_serial");
            const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
            setLastSeenAt(ts);
            setWeight({
              value,
              unit:      (msg.unit === "g" ? "g" : "kg") as "kg" | "g",
              stable:    Boolean(msg.stable),
              timestamp: ts,
              deviceId,
            });
          }
        } else if (msg.event === "disconnected") {
          setConnected(false);
          setStatus("disconnected");
          setWeight(null);
        } else if (msg.event === "status") {
          if (msg.connected) {
            setConnected(true);
            setStatus("connected");
            setError(null);
          } else {
            setConnected(false);
            setStatus("disconnected");
            setError(msg.error ?? null);
            setWeight(null);
          }
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setStatus("error");
      setWeight(null);
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnected(false);
      setStatus("disconnected");
      setWeight(null);
    };

    return () => {
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [isBridgeMode, isActive, deviceId]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const checkTolerance = useCallback(
    (expected: number) => {
      if (!weight) return { withinTolerance: false, deviation: 0, deviationPercent: 0 };
      const deviation        = weight.value - expected;
      const deviationPercent = (Math.abs(deviation) / expected) * 100;
      return {
        withinTolerance: deviationPercent <= tolerancePercent,
        deviation,
        deviationPercent,
      };
    },
    [weight, tolerancePercent],
  );

  const tare = useCallback(() => {
    setWeight((prev) => (prev ? { ...prev, value: 0, stable: true } : null));
  }, []);

  return {
    weight,
    connected,
    error,
    status,
    statusLabel: STATUS_LABELS[status],
    source,
    lastSeenAt,
    resolvedDeviceId,
    resolvedWorkstationId,
    checkTolerance,
    tare,
  };
}
