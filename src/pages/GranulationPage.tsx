import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const GranulationPage = () => {
  const [inputScanned, setInputScanned] = useState(false);
  const [outputWeight, setOutputWeight] = useState<number | null>(null);
  const [outputQR, setOutputQR] = useState<string | null>(null);

  const handleInputScan = (result: { valid: boolean }) => {
    if (result.valid) setInputScanned(true);
  };

  const handleOutputCapture = (weight: number) => {
    setOutputWeight(weight);
    setOutputQR(`GRN-${Date.now().toString(36).toUpperCase()}/WT-${weight.toFixed(3)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Granulation Module</h1>
        <p className="text-sm text-muted-foreground mt-1">QR scan input → Auto weight capture → Output QR generation</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={inputScanned ? "text-success font-medium" : ""}>1. Scan Input Bin</span>
        <ArrowRight className="h-4 w-4" />
        <span className={outputWeight ? "text-success font-medium" : ""}>2. Capture Weight</span>
        <ArrowRight className="h-4 w-4" />
        <span className={outputQR ? "text-success font-medium" : ""}>3. Generate Output QR</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <QRScannerComponent label="Step 1: Scan Input Bin" onScanComplete={handleInputScan} />
          {inputScanned && (
            <div className="flex items-center gap-2 p-2 rounded scan-success text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Input bin verified
            </div>
          )}
        </div>

        <LiveWeightDisplay
          deviceId="WS-002"
          label="Step 2: Granulator Output Weight"
          onWeightStable={handleOutputCapture}
        />

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Step 3: Output QR</h3>
          {outputQR ? (
            <div className="text-center space-y-3">
              <div className="mx-auto w-32 h-32 bg-foreground/5 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <span className="text-xs font-mono text-muted-foreground text-center px-2 break-all">{outputQR}</span>
              </div>
              <button className="w-full px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:opacity-90">
                Print QR Sticker
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Complete steps 1 & 2 to generate output QR
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GranulationPage;
