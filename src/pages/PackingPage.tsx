import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { CheckCircle2, AlertTriangle, Package } from "lucide-react";

interface PackingMaterial {
  code: string;
  name: string;
  requiredQty: number;
  unit: string;
  weight: number;
}

const PACKING_MATERIALS: PackingMaterial[] = [
  { code: "E-6026", name: "PP Bag 19", requiredQty: 12.6, unit: "kgs", weight: 0.105 },
  { code: "M-6008", name: "Branding Tape - Yellow", requiredQty: 3.84, unit: "nos", weight: 0.032 },
  { code: "E-6001", name: "Cello Tape 1\"", requiredQty: 9.24, unit: "nos", weight: 0.077 },
  { code: "E-6013", name: "Corrugate Sheet - Small", requiredQty: 240, unit: "nos", weight: 2.0 },
  { code: "E-6011", name: "Corrugate Sheet - Big", requiredQty: 120, unit: "nos", weight: 1.0 },
  { code: "E-6004", name: "Pre Printer Label", requiredQty: 120, unit: "nos", weight: 1.0 },
];

const PackingPage = () => {
  const [grossWeight, setGrossWeight] = useState<number | null>(null);
  const [profileScanned, setProfileScanned] = useState(false);
  const [verified, setVerified] = useState(false);

  const totalPackingWeight = PACKING_MATERIALS.reduce((sum, m) => sum + m.weight, 0);
  const netWeight = grossWeight ? grossWeight - totalPackingWeight : null;
  const expectedNetWeight = 20.477;

  const handleGrossCapture = (weight: number) => {
    setGrossWeight(weight);
    const net = weight - totalPackingWeight;
    const deviation = Math.abs(net - expectedNetWeight) / expectedNetWeight * 100;
    setVerified(deviation <= 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Packing Module</h1>
        <p className="text-sm text-muted-foreground mt-1">Hardware weight verification with packing material deduction</p>
      </div>

      {verified && (
        <div className="flex items-center gap-2 p-3 rounded-lg scan-success border-2 text-sm text-success">
          <CheckCircle2 className="h-5 w-5" />
          Weight verified — Ready for QR generation and dispatch
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <QRScannerComponent label="Scan Profile QR" onScanComplete={(r) => r.valid && setProfileScanned(true)} />
          <LiveWeightDisplay
            deviceId="WS-003"
            label="Packing Scale — Gross Weight"
            expectedWeight={expectedNetWeight + totalPackingWeight}
            tolerancePercent={1}
            onWeightStable={handleGrossCapture}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Weight Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-mono font-bold text-secondary-foreground">{grossWeight?.toFixed(3) || "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Gross Weight (kg)</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-mono font-bold text-secondary-foreground">{totalPackingWeight.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground mt-1">Packing Material (kg)</div>
              </div>
              <div className={`p-3 rounded-lg ${verified ? "scan-success" : "bg-secondary"}`}>
                <div className="text-2xl font-mono font-bold text-foreground">{netWeight?.toFixed(3) || "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Net Weight (kg)</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Code</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Material</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Required</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {PACKING_MATERIALS.map((m) => (
                  <tr key={m.code} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{m.code}</td>
                    <td className="px-4 py-2 text-foreground">{m.name}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{m.requiredQty} {m.unit}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{m.weight.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingPage;
