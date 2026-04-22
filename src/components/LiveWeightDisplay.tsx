import { useWeightStream } from "@/hooks/useWeightStream";
import { Scale, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface LiveWeightDisplayProps {
  deviceId: string;
  expectedWeight?: number;
  tolerancePercent?: number;
  label?: string;
  showTareButton?: boolean;
  onWeightStable?: (weight: number) => void;
}

const LiveWeightDisplay = ({
  deviceId,
  expectedWeight,
  tolerancePercent = 0.5,
  label = "Live Weight",
  showTareButton = true,
  onWeightStable,
}: LiveWeightDisplayProps) => {
  const { weight, connected, tare, checkTolerance } = useWeightStream({
    deviceId,
    tolerancePercent,
  });

  const tolerance = expectedWeight ? checkTolerance(expectedWeight) : null;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-secondary-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 device-online" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 device-offline" />
          )}
          <span className={`text-xs font-medium ${connected ? "device-online" : "device-offline"}`}>
            {connected ? "LIVE" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      <div className="weight-display px-6 py-5 text-center">
        <div className="text-4xl font-mono font-bold tracking-wider animate-weight-update">
          {weight ? weight.value.toFixed(3) : "----.---"}
        </div>
        <div className="text-sm mt-1 opacity-70">{weight?.unit?.toUpperCase() || "KG"}</div>
        {weight && (
          <div className={`text-xs mt-2 ${weight.stable ? "device-online" : "device-connecting"}`}>
            {weight.stable ? "● STABLE" : "◌ STABILIZING..."}
          </div>
        )}
      </div>

      {tolerance && expectedWeight && (
        <div className={`px-4 py-2 text-sm ${tolerance.withinTolerance ? "scan-success" : "scan-fail"} border-t`}>
          <div className="flex items-center justify-between">
            <span>Expected: {expectedWeight.toFixed(3)} kg</span>
            <span className="flex items-center gap-1">
              {!tolerance.withinTolerance && <AlertTriangle className="h-3.5 w-3.5" />}
              Δ {tolerance.deviation > 0 ? "+" : ""}{tolerance.deviation.toFixed(3)} kg ({tolerance.deviationPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}

      {showTareButton && (
        <div className="px-4 py-2 bg-secondary border-t border-border flex gap-2">
          <button
            onClick={tare}
            className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            TARE
          </button>
          <button
            onClick={() => weight?.stable && onWeightStable?.(weight.value)}
            disabled={!weight?.stable}
            className="text-xs px-3 py-1 rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            CAPTURE
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveWeightDisplay;
