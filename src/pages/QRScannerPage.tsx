import QRScannerComponent from "@/components/QRScannerComponent";
import { ScanResult } from "@/hooks/useScannerInput";
import { useState } from "react";

const QRScannerPage = () => {
  const [validatedScans, setValidatedScans] = useState<ScanResult[]>([]);

  const handleScan = (result: ScanResult) => {
    if (result.valid) {
      setValidatedScans((prev) => [result, ...prev].slice(0, 20));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QR / Barcode Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Scan bins, materials, and packing labels</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QRScannerComponent label="Bin Scanner" onScanComplete={handleScan} />
        <QRScannerComponent label="Material Scanner" onScanComplete={handleScan} />
        <QRScannerComponent label="Output Scanner" onScanComplete={handleScan} />
      </div>

      {validatedScans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Validated Scans</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Code</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Type</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {validatedScans.map((s, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-foreground text-xs">{s.code}</td>
                    <td className="px-4 py-2 text-foreground">{s.type}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{s.timestamp.toLocaleTimeString()}</td>
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

export default QRScannerPage;
