import { useState, useEffect, useCallback, useRef } from "react";

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

export function useWeightStream({ deviceId, enabled = true, tolerancePercent = 0.5 }: UseWeightStreamOptions) {
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Simulated weight stream — in production, replace with WebSocket/MQTT
  useEffect(() => {
    if (!enabled) return;

    const baseWeight = 50 + Math.random() * 100;
    setConnected(true);
    setError(null);

    intervalRef.current = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * 0.1;
      const stable = Math.random() > 0.3;
      setWeight({
        value: parseFloat((baseWeight + fluctuation).toFixed(3)),
        unit: "kg",
        stable,
        timestamp: new Date(),
        deviceId,
      });
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnected(false);
    };
  }, [deviceId, enabled]);

  const checkTolerance = useCallback(
    (expected: number): { withinTolerance: boolean; deviation: number; deviationPercent: number } => {
      if (!weight) return { withinTolerance: false, deviation: 0, deviationPercent: 0 };
      const deviation = weight.value - expected;
      const deviationPercent = (Math.abs(deviation) / expected) * 100;
      return {
        withinTolerance: deviationPercent <= tolerancePercent,
        deviation,
        deviationPercent,
      };
    },
    [weight, tolerancePercent]
  );

  const tare = useCallback(() => {
    setWeight((prev) => prev ? { ...prev, value: 0, stable: true } : null);
  }, []);

  return { weight, connected, error, checkTolerance, tare };
}
