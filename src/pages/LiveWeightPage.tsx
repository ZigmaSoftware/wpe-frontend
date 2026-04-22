import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import { useState } from "react";

const LiveWeightPage = () => {
  const [captures, setCaptures] = useState<{ device: string; weight: number; time: Date }[]>([]);

  const handleCapture = (device: string) => (weight: number) => {
    setCaptures((prev) => [{ device, weight, time: new Date() }, ...prev].slice(0, 20));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Weight Capture</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time weight data from connected scales</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LiveWeightDisplay deviceId="WS-001" label="Blending Scale A" expectedWeight={60.0} onWeightStable={handleCapture("Blending A")} />
        <LiveWeightDisplay deviceId="WS-002" label="Blending Scale B" expectedWeight={60.0} onWeightStable={handleCapture("Blending B")} />
        <LiveWeightDisplay deviceId="WS-003" label="Packing Scale" expectedWeight={20.477} onWeightStable={handleCapture("Packing")} />
        <LiveWeightDisplay deviceId="WS-004" label="QC Verification Scale" onWeightStable={handleCapture("QC")} />
      </div>

      {captures.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Captured Weights</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Device</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Weight (kg)</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {captures.map((c, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{c.device}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{c.weight.toFixed(3)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{c.time.toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveWeightPage;
