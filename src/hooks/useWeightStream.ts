import { useState, useEffect, useCallback, useRef } from "react";
import { coreApi } from "@/lib/api";

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
  preferBridge?: boolean;
  bridgeDemandEnabled?: boolean;
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
  weight:        string;
  unit:          string;
  status:        ScaleConnectionStatus;
  timestamp:     string | null;
  last_seen_at?: string | null;
  raw_data:      string;
  error:         string | null;
  detected_port: string | null;
  device_id?:    string | null;
  platform:      string;
  source?:       string | null;
  workstation_id?: string | null;
}

const CONNECTED_STATUSES = new Set<ScaleConnectionStatus>(["connected", "stable", "unstable", "overload"]);
const CLIENT_STABLE_STATUSES = new Set<ScaleConnectionStatus>(["connected", "unstable"]);
const CLIENT_STABILITY_WINDOW_MS = 1200;
const CLIENT_STABILITY_EPSILON = 0.001;

const STATUS_LABELS: Record<ScaleConnectionStatus, string> = {
  stable: "Scale Connected",
  unstable: "Scale Connected",
  overload: "Scale Connected",
  connected: "Scale Connected",
  disconnected: "Scale Offline",
  error: "Scale Error",
  no_serial_port: "No Serial Port",
  invalid_reading: "Invalid Reading",
  bridge_not_reporting: "Bridge Not Reporting",
};

export function useWeightStream({
  deviceId,
  enabled = true,
  preferBridge = false,
  bridgeDemandEnabled = false,
  scaleDeviceId = null,
  tolerancePercent = 0.5,
  workstationId = null,
}: UseWeightStreamOptions) {
  const [weight, setWeight]       = useState<WeightData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [status, setStatus]       = useState<ScaleConnectionStatus>("disconnected");
  const [source, setSource]       = useState<string | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(null);
  const [detectedPort, setDetectedPort] = useState<string | null>(null);
  const [resolvedDeviceId, setResolvedDeviceId] = useState<string | null>(null);
  const [resolvedWorkstationId, setResolvedWorkstationId] = useState<string | null>(null);
  const stabilityTrackerRef = useRef<{ value: number | null; stableSinceMs: number | null }>({
    value: null,
    stableSinceMs: null,
  });
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const intervalRef               = useRef<ReturnType<typeof setInterval>>();
  const isPollingEnabled = enabled && isDocumentVisible;

  useEffect(() => {
    if (!preferBridge || !bridgeDemandEnabled || !isPollingEnabled) {
      return;
    }

    const heartbeat = async () => {
      try {
        await coreApi.post("/api/scale/bridge/demand/activate/");
      } catch {
        // Ignore heartbeat failures here; the weight poll will surface bridge status.
      }
    };

    void heartbeat();
    const heartbeatInterval = setInterval(() => {
      void heartbeat();
    }, 2000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [bridgeDemandEnabled, isPollingEnabled, preferBridge]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isPollingEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setConnected(false);
      setStatus("disconnected");
      stabilityTrackerRef.current = { value: null, stableSinceMs: null };
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await coreApi.get<ScaleApiResponse>("/api/scale/weight/latest/", {
          params: {
            device_id: scaleDeviceId || undefined,
            prefer_bridge: preferBridge || undefined,
            workstation_id: workstationId || undefined,
          },
        });
        const d   = res.data;

        if (cancelled) {
          return;
        }

        const nextStatus = d.status ?? "error";
        const isConnected = CONNECTED_STATUSES.has(nextStatus);
        setStatus(nextStatus);
        setConnected(isConnected);
        setError(d.error ?? null);
        setSource(d.source ?? null);
        setDetectedPort(d.detected_port ?? null);
        setResolvedDeviceId(d.device_id ?? scaleDeviceId ?? null);
        setResolvedWorkstationId(d.workstation_id ?? workstationId ?? null);
        setLastSeenAt(d.last_seen_at ? new Date(d.last_seen_at) : d.timestamp ? new Date(d.timestamp) : null);

        if (isConnected) {
          const value = parseFloat(d.weight);
          if (!isNaN(value)) {
            const normalizedValue = Number(value.toFixed(3));
            const tracker = stabilityTrackerRef.current;
            let isStable = d.status === "stable";

            if (!isStable) {
              if (
                !CLIENT_STABLE_STATUSES.has(nextStatus) ||
                tracker.value === null ||
                Math.abs(tracker.value - normalizedValue) > CLIENT_STABILITY_EPSILON
              ) {
                tracker.value = normalizedValue;
                tracker.stableSinceMs = Date.now();
              } else if (
                tracker.stableSinceMs !== null &&
                Date.now() - tracker.stableSinceMs >= CLIENT_STABILITY_WINDOW_MS
              ) {
                isStable = true;
              }
            } else {
              tracker.value = normalizedValue;
              tracker.stableSinceMs = Date.now();
            }

            setWeight({
              value,
              unit:      (d.unit === "g" ? "g" : "kg") as "kg" | "g",
              stable:    isStable,
              timestamp: d.timestamp ? new Date(d.timestamp) : new Date(),
              deviceId,
            });
          }
        } else {
          stabilityTrackerRef.current = { value: null, stableSinceMs: null };
          setWeight(null);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setConnected(false);
        setStatus("error");
        setWeight(null);
        setError(err instanceof Error ? err.message : "Scale endpoint unreachable");
        setDetectedPort(null);
        stabilityTrackerRef.current = { value: null, stableSinceMs: null };
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setConnected(false);
      stabilityTrackerRef.current = { value: null, stableSinceMs: null };
    };
  }, [deviceId, isPollingEnabled, preferBridge, scaleDeviceId, workstationId]);

  const checkTolerance = useCallback(
    (expected: number): { withinTolerance: boolean; deviation: number; deviationPercent: number } => {
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
    detectedPort,
    resolvedDeviceId,
    resolvedWorkstationId,
    checkTolerance,
    tare,
  };
}
