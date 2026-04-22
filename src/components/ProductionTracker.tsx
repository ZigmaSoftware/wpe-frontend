import { Activity, TrendingUp, Clock, Package } from "lucide-react";

interface ProductionLine {
  id: string;
  name: string;
  status: "running" | "idle" | "maintenance" | "error";
  currentProduct?: string;
  outputToday: number;
  targetToday: number;
  efficiency: number;
  lastUpdate: Date;
}

interface ProductionTrackerProps {
  lines: ProductionLine[];
}

const MOCK_LINES: ProductionLine[] = [
  { id: "L01", name: "Extrusion Line 01", status: "running", currentProduct: "EliteDeck Base Woodline", outputToday: 847, targetToday: 1000, efficiency: 92, lastUpdate: new Date() },
  { id: "L02", name: "Extrusion Line 02", status: "running", currentProduct: "Elite Clad 4L", outputToday: 623, targetToday: 800, efficiency: 88, lastUpdate: new Date() },
  { id: "L03", name: "Extrusion Line 03", status: "idle", outputToday: 0, targetToday: 600, efficiency: 0, lastUpdate: new Date(Date.now() - 3600000) },
  { id: "L04", name: "Extrusion Line 04", status: "maintenance", outputToday: 312, targetToday: 700, efficiency: 45, lastUpdate: new Date(Date.now() - 7200000) },
];

const statusConfig = {
  running: { label: "Running", className: "status-badge-online" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
  maintenance: { label: "Maintenance", className: "status-badge-warning" },
  error: { label: "Error", className: "status-badge-offline" },
};

const ProductionTracker = ({ lines = MOCK_LINES }: ProductionTrackerProps) => {
  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const progress = line.targetToday > 0 ? (line.outputToday / line.targetToday) * 100 : 0;
        const config = statusConfig[line.status];

        return (
          <div key={line.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${line.status === "running" ? "text-success animate-pulse" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm text-card-foreground">{line.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
              </span>
            </div>

            {line.currentProduct && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                {line.currentProduct}
              </div>
            )}

            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Output: {line.outputToday} / {line.targetToday}</span>
              <span className="flex items-center gap-1 text-foreground font-medium">
                <TrendingUp className="h-3 w-3" />
                {line.efficiency}%
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progress >= 90 ? "bg-success" : progress >= 60 ? "bg-primary" : "bg-warning"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last update: {line.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductionTracker;
