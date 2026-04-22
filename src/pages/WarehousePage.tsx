import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { Warehouse as WarehouseIcon, CheckCircle2, Package } from "lucide-react";

interface InwardEntry {
  id: string;
  qrCode: string;
  productName: string;
  weight: number;
  location: string;
  timestamp: Date;
}

const WarehousePage = () => {
  const [entries, setEntries] = useState<InwardEntry[]>([
    { id: "W-001", qrCode: "PKG-ABC123", productName: "EliteDeck Base Woodline", weight: 20.477, location: "Rack A-3", timestamp: new Date(Date.now() - 3600000) },
    { id: "W-002", qrCode: "PKG-DEF456", productName: "Elite Clad 4L", weight: 18.866, location: "Rack B-1", timestamp: new Date(Date.now() - 7200000) },
  ]);

  const handleInwardScan = (result: { code: string; valid: boolean }) => {
    if (result.valid) {
      setEntries((prev) => [
        {
          id: `W-${(prev.length + 1).toString().padStart(3, "0")}`,
          qrCode: result.code,
          productName: "Scanned Product",
          weight: 20.0 + Math.random() * 5,
          location: `Rack ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10)}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Warehouse</h1>
        <p className="text-sm text-muted-foreground mt-1">QR-based inward entry and traceability</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <WarehouseIcon className="h-5 w-5 text-primary" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Total Inward</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Package className="h-5 w-5 text-accent" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{entries.reduce((s, e) => s + e.weight, 0).toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total Weight (kg)</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <QRScannerComponent label="Scan for Warehouse Inward" onScanComplete={handleInwardScan} />

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">ID</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">QR Code</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Product</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Weight</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Location</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{e.id}</td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{e.qrCode}</td>
                    <td className="px-4 py-2 text-foreground">{e.productName}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{e.weight.toFixed(3)} kg</td>
                    <td className="px-4 py-2 text-muted-foreground">{e.location}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{e.timestamp.toLocaleTimeString()}</td>
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

export default WarehousePage;
