import { useScannerInput, ScanResult } from "@/hooks/useScannerInput";
import { ScanLine, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface QRScannerComponentProps {
  onScanComplete?: (result: ScanResult) => void;
  validateFn?: (code: string) => boolean;
  label?: string;
  placeholder?: string;
}

const QRScannerComponent = ({
  onScanComplete,
  validateFn,
  label = "Scan QR / Barcode",
  placeholder = "Position scanner or click to simulate...",
}: QRScannerComponentProps) => {
  const { lastScan, scanning, history, simulateScan, processScan } = useScannerInput({
    onScan: onScanComplete,
    validateFn,
  });

  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value) {
        processScan(value);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-secondary-foreground">{label}</span>
        </div>
      </div>

      <div className="p-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
            scanning ? "border-primary bg-primary/5" : lastScan?.valid ? "scan-success" : lastScan && !lastScan.valid ? "scan-fail" : "border-border hover:border-primary/50"
          }`}
          onClick={() => !scanning && simulateScan()}
        >
          {scanning ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Scanning...</span>
            </div>
          ) : lastScan ? (
            <div className="flex flex-col items-center gap-2">
              {lastScan.valid ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <span className="text-sm font-mono font-medium text-foreground">{lastScan.code}</span>
              <span className="text-xs text-muted-foreground">
                {lastScan.valid ? "Scan verified" : "Invalid scan"} • {lastScan.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ScanLine className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Manual entry (press Enter)"
          onKeyDown={handleManualInput}
          className="mt-3 w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {history.length > 0 && (
        <div className="border-t border-border px-4 py-2 max-h-32 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground mb-1">Recent Scans</div>
          {history.slice(0, 5).map((scan, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-xs">
              <span className="font-mono text-foreground truncate max-w-[200px]">{scan.code}</span>
              <span className={scan.valid ? "device-online" : "device-offline"}>
                {scan.valid ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QRScannerComponent;
