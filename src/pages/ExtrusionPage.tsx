import QRScannerComponent from "@/components/QRScannerComponent";
import BinVisualizer, { BinInfo } from "@/components/BinVisualizer";
import ProductionTracker from "@/components/ProductionTracker";
import DeviceStatusIndicator from "@/components/DeviceStatusIndicator";
import { useState } from "react";

const LINE_BINS: BinInfo[] = [
  { id: "L01-B", label: "Line 01 Bin", status: "occupied", materialName: "Granulated WPE Blend", weightKg: 120, capacityKg: 150 },
  { id: "L02-B", label: "Line 02 Bin", status: "occupied", materialName: "Granulated WPE Blend", weightKg: 95, capacityKg: 150 },
  { id: "L03-B", label: "Line 03 Bin", status: "empty", capacityKg: 150 },
  { id: "L04-B", label: "Line 04 Bin", status: "empty", capacityKg: 150 },
];

const ExtrusionPage = () => {
  const [connectedBins, setConnectedBins] = useState<Record<string, string>>({
    "L01": "BAG 107",
    "L02": "BAG 114",
  });

  const handleBinConnect = (result: { code: string; valid: boolean }) => {
    if (result.valid) {
      setConnectedBins((prev) => ({ ...prev, L03: result.code }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Extrusion Module</h1>
        <p className="text-sm text-muted-foreground mt-1">Line-bin mapping via QR scan with live material tracking</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <QRScannerComponent label="Scan Bin to Connect to Line" onScanComplete={handleBinConnect} />

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Line-Bin Connections</h3>
            <div className="space-y-2">
              {Object.entries(connectedBins).map(([line, bin]) => (
                <div key={line} className="flex items-center justify-between py-1.5 px-2 rounded bg-secondary text-sm">
                  <span className="font-medium text-secondary-foreground">{line}</span>
                  <span className="font-mono text-xs text-muted-foreground">{bin}</span>
                  <button className="text-xs text-destructive hover:underline">Disconnect</button>
                </div>
              ))}
            </div>
          </div>

          <DeviceStatusIndicator status="online" name="Line Scanner - Extrusion" signal={91} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Line Bin Status</h2>
            <BinVisualizer bins={LINE_BINS} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Production Lines</h2>
            <ProductionTracker lines={[]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionPage;
