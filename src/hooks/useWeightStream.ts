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
  tolerancePercent?: number;
}

interface ScaleApiResponse {
  weight:        string;
  unit:          string;
  status:        "stable" | "unstable" | "overload" | "connected" | "disconnected" | "error";
  timestamp:     string | null;
  raw_data:      string;
  error:         string | null;
  detected_port: string | null;
  platform:      string;
}

export function useWeightStream({ deviceId, enabled = true, tolerancePercent = 0.5 }: UseWeightStreamOptions) {
  const [weight, setWeight]       = useState<WeightData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const intervalRef               = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const res = await coreApi.get<ScaleApiResponse>("/api/scale/weight/latest/");
        const d   = res.data;

        const isConnected = d.status !== "disconnected" && d.status !== "error";
        setConnected(isConnected);
        setError(d.error ?? null);

        if (isConnected) {
          const value = parseFloat(d.weight);
          if (!isNaN(value)) {
            setWeight({
              value,
              unit:      (d.unit === "g" ? "g" : "kg") as "kg" | "g",
              stable:    d.status === "stable",
              timestamp: d.timestamp ? new Date(d.timestamp) : new Date(),
              deviceId,
            });
          }
        }
      } catch (err) {
        setConnected(false);
        setError(err instanceof Error ? err.message : "Scale endpoint unreachable");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnected(false);
    };
  }, [deviceId, enabled]);

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

  return { weight, connected, error, checkTolerance, tare };
}
