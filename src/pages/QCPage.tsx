import LiveWeightDisplay from "@/components/LiveWeightDisplay";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface QCRecord {
  id: string;
  productName: string;
  expectedWeight: number;
  actualWeight: number | null;
  variance: number | null;
  status: "pending" | "pass" | "fail";
  timestamp: Date | null;
}

const INITIAL_RECORDS: QCRecord[] = [
  { id: "QC-001", productName: "EliteDeck Base Woodline B[146x24]", expectedWeight: 20.477, actualWeight: null, variance: null, status: "pending", timestamp: null },
  { id: "QC-002", productName: "Elite Clad 4L [224x28]", expectedWeight: 18.866, actualWeight: null, variance: null, status: "pending", timestamp: null },
  { id: "QC-003", productName: "EliteDeck Base Woodline B[146x24]", expectedWeight: 20.477, actualWeight: 20.512, variance: 0.17, status: "pass", timestamp: new Date(Date.now() - 600000) },
  { id: "QC-004", productName: "EliteDeck Base Woodline B[146x24]", expectedWeight: 20.477, actualWeight: 21.1, variance: 3.04, status: "fail", timestamp: new Date(Date.now() - 1200000) },
];

const QCPage = () => {
  const [records, setRecords] = useState<QCRecord[]>(INITIAL_RECORDS);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleWeightCapture = (weight: number) => {
    setRecords((prev) => {
      const next = [...prev];
      const record = next[activeIdx];
      const variance = Math.abs(weight - record.expectedWeight) / record.expectedWeight * 100;
      next[activeIdx] = {
        ...record,
        actualWeight: weight,
        variance,
        status: variance <= 1 ? "pass" : "fail",
        timestamp: new Date(),
      };
      return next;
    });
    if (activeIdx < records.length - 1) setActiveIdx(activeIdx + 1);
  };

  const passCount = records.filter((r) => r.status === "pass").length;
  const failCount = records.filter((r) => r.status === "fail").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QC Inspection</h1>
        <p className="text-sm text-muted-foreground mt-1">Hardware-captured weight verification with variance analysis</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-card-foreground">{records.length}</div>
          <div className="text-xs text-muted-foreground">Total Checks</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-success">{passCount}</div>
          <div className="text-xs text-muted-foreground">Passed</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{failCount}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <LiveWeightDisplay
          deviceId="WS-004"
          label={`QC Scale — ${records[activeIdx]?.productName?.slice(0, 25) || "Ready"}`}
          expectedWeight={records[activeIdx]?.expectedWeight}
          tolerancePercent={1}
          onWeightStable={handleWeightCapture}
        />

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-3 py-2 text-secondary-foreground">ID</th>
                  <th className="text-left px-3 py-2 text-secondary-foreground">Product</th>
                  <th className="text-right px-3 py-2 text-secondary-foreground">Expected</th>
                  <th className="text-right px-3 py-2 text-secondary-foreground">Actual</th>
                  <th className="text-right px-3 py-2 text-secondary-foreground">Variance</th>
                  <th className="text-center px-3 py-2 text-secondary-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-border cursor-pointer ${i === activeIdx ? "bg-primary/5" : ""}`}
                    onClick={() => r.status === "pending" && setActiveIdx(i)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{r.id}</td>
                    <td className="px-3 py-2 text-foreground text-xs">{r.productName}</td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">{r.expectedWeight.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">{r.actualWeight?.toFixed(3) || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">{r.variance !== null ? `${r.variance.toFixed(2)}%` : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {r.status === "pass" && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                      {r.status === "fail" && <XCircle className="h-4 w-4 text-destructive inline" />}
                      {r.status === "pending" && <AlertTriangle className="h-4 w-4 text-warning inline" />}
                    </td>
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

export default QCPage;
