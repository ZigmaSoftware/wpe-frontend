import QRScannerComponent from "@/components/QRScannerComponent";
import { useState } from "react";
import { Truck, CheckCircle2, AlertTriangle } from "lucide-react";

interface DispatchItem {
  id: string;
  qrCode: string;
  product: string;
  weight: number;
  scanned: boolean;
  timestamp: Date | null;
}

const DISPATCH_LIST: DispatchItem[] = [
  { id: "D-001", qrCode: "PKG-A001", product: "EliteDeck Base Woodline ABG [3D]", weight: 20.477, scanned: false, timestamp: null },
  { id: "D-002", qrCode: "PKG-A002", product: "EliteDeck Base Woodline ABG [3D]", weight: 20.512, scanned: false, timestamp: null },
  { id: "D-003", qrCode: "PKG-B001", product: "Elite Clad 4L ATR [3D]", weight: 18.866, scanned: false, timestamp: null },
  { id: "D-004", qrCode: "PKG-B002", product: "Elite Clad 4L ATR [3D]", weight: 18.921, scanned: false, timestamp: null },
  { id: "D-005", qrCode: "PKG-C001", product: "EliteDeck Base Woodline SLR [3D]", weight: 20.103, scanned: false, timestamp: null },
];

const DispatchPage = () => {
  const [items, setItems] = useState<DispatchItem[]>(DISPATCH_LIST);

  const handleDispatchScan = (result: { code: string; valid: boolean }) => {
    if (!result.valid) return;
    setItems((prev) =>
      prev.map((item) =>
        item.qrCode === result.code || (!item.scanned && prev.filter((i) => !i.scanned).indexOf(item) === 0)
          ? { ...item, scanned: true, timestamp: new Date() }
          : item
      )
    );
  };

  const scannedCount = items.filter((i) => i.scanned).length;
  const allScanned = scannedCount === items.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
        <p className="text-sm text-muted-foreground mt-1">Mandatory scan before warehouse dispatch — full traceability</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Truck className="h-5 w-5 text-primary" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{items.length}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{scannedCount}</div>
            <div className="text-xs text-muted-foreground">Scanned</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{items.length - scannedCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <QRScannerComponent label="Dispatch Scan" onScanComplete={handleDispatchScan} />

        <div className="lg:col-span-2">
          {allScanned && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg scan-success border-2 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              All items scanned — Ready for dispatch
            </div>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 text-secondary-foreground">ID</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">QR Code</th>
                  <th className="text-left px-4 py-2 text-secondary-foreground">Product</th>
                  <th className="text-right px-4 py-2 text-secondary-foreground">Weight</th>
                  <th className="text-center px-4 py-2 text-secondary-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={`border-t border-border ${item.scanned ? "bg-success/5" : ""}`}>
                    <td className="px-4 py-2 text-foreground">{item.id}</td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{item.qrCode}</td>
                    <td className="px-4 py-2 text-foreground text-xs">{item.product}</td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{item.weight.toFixed(3)} kg</td>
                    <td className="px-4 py-2 text-center">
                      {item.scanned ? (
                        <CheckCircle2 className="h-4 w-4 text-success inline" />
                      ) : (
                        <span className="text-xs text-warning">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {allScanned && (
            <button className="mt-4 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Confirm Dispatch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatchPage;
