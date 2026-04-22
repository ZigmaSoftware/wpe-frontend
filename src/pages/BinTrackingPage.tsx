import BinVisualizer, { BinInfo } from "@/components/BinVisualizer";
import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const ALL_BINS: BinInfo[] = [
  { id: "B-R", label: "BIN R", status: "occupied", materialName: "HSM 500 WPE Blend", weightKg: 99.8, capacityKg: 150, qrCode: "BIN-R001" },
  { id: "B-Q", label: "BIN Q", status: "in_process", materialName: "Granulated WPE Blend", weightKg: 120, capacityKg: 150, qrCode: "BIN-Q001" },
  { id: "B-S", label: "BIN S", status: "empty", capacityKg: 150, qrCode: "BIN-S001" },
  { id: "B-T", label: "BIN T", status: "full", materialName: "WPE Blend Output", weightKg: 148, capacityKg: 150, qrCode: "BIN-T001" },
  { id: "B-U", label: "BIN U", status: "occupied", materialName: "Raw Material Mix", weightKg: 65, capacityKg: 150, qrCode: "BIN-U001" },
  { id: "B-V", label: "BIN V", status: "empty", capacityKg: 150, qrCode: "BIN-V001" },
  { id: "B-W", label: "BIN W", status: "empty", capacityKg: 150, qrCode: "BIN-W001" },
  { id: "B-X", label: "BIN X", status: "occupied", materialName: "Additive Mix", weightKg: 45, capacityKg: 150, qrCode: "BIN-X001" },
];

const BinTrackingPage = () => {
  const [selectedBin, setSelectedBin] = useState<BinInfo | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const handleBinScan = (result: { code: string; valid: boolean }) => {
    if (!result.valid) return;
    const bin = ALL_BINS.find((b) => b.qrCode === result.code || b.id === result.code);
    if (bin) {
      if (bin.status === "occupied" || bin.status === "full") {
        setConflict(`⚠ BIN ${bin.label} already contains ${bin.materialName}. Cannot mix materials!`);
      } else {
        setConflict(null);
      }
      setSelectedBin(bin);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bin Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">QR-based bin status and conflict prevention</p>
      </div>

      {conflict && (
        <div className="flex items-center gap-2 p-3 rounded-lg scan-fail border-2 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {conflict}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Scan Bin</h2>
          <QRScannerComponent label="Bin QR Scanner" onScanComplete={handleBinScan} />

          {selectedBin && (
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-card-foreground mb-2">{selectedBin.label}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize text-foreground">{selectedBin.status.replace("_", " ")}</span></div>
                {selectedBin.materialName && <div className="flex justify-between"><span className="text-muted-foreground">Material</span><span className="text-foreground">{selectedBin.materialName}</span></div>}
                {selectedBin.weightKg && <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span className="font-mono text-foreground">{selectedBin.weightKg} kg</span></div>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">All Bins</h2>
          <BinVisualizer bins={ALL_BINS} onBinClick={setSelectedBin} />
        </div>
      </div>
    </div>
  );
};

export default BinTrackingPage;
