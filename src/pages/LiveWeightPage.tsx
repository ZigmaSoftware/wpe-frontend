import { useState } from "react";
import LiveWeightDisplay from "@/components/LiveWeightDisplay";

const LiveWeightPage = () => {
  const [captures, setCaptures] = useState<{ weight: number; time: Date }[]>([]);

  const handleCapture = (weight: number) => {
    setCaptures((prev) => [{ weight, time: new Date() }, ...prev].slice(0, 20));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Weight Capture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time weight data from the latest reporting bridge-connected scale.
        </p>
      </div>

      <div className="max-w-xl">
        <LiveWeightDisplay
          deviceId="bridge-live-weight"
          preferBridge
          bridgeDemandEnabled
          label="Bridge Auto Detect"
          onWeightStable={handleCapture}
        />
      </div>

      {captures.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Captured Weights</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-2 text-center text-secondary-foreground">S.No</th>
                  <th className="px-4 py-2 text-right text-secondary-foreground">Weight (kg)</th>
                  <th className="px-4 py-2 text-right text-secondary-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {captures.map((capture, index) => (
                  <tr key={`${capture.time.toISOString()}-${index}`} className="border-t border-border">
                    <td className="px-4 py-2 text-center font-medium text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{capture.weight.toFixed(3)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{capture.time.toLocaleTimeString()}</td>
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
