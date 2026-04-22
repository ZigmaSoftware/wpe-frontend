import { Package, AlertTriangle } from "lucide-react";

export type BinStatus = "empty" | "occupied" | "in_process" | "full";

interface BinInfo {
  id: string;
  label: string;
  status: BinStatus;
  materialName?: string;
  weightKg?: number;
  capacityKg?: number;
  qrCode?: string;
}

interface BinVisualizerProps {
  bins: BinInfo[];
  onBinClick?: (bin: BinInfo) => void;
  compact?: boolean;
}

const statusColors: Record<BinStatus, { bg: string; border: string; text: string }> = {
  empty: { bg: "bg-secondary", border: "border-border", text: "text-muted-foreground" },
  occupied: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
  in_process: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  full: { bg: "bg-success/10", border: "border-success/30", text: "text-success" },
};

const BinVisualizer = ({ bins, onBinClick, compact = false }: BinVisualizerProps) => {
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
      {bins.map((bin) => {
        const colors = statusColors[bin.status];
        const fillPercent = bin.capacityKg && bin.weightKg ? (bin.weightKg / bin.capacityKg) * 100 : 0;

        return (
          <div
            key={bin.id}
            onClick={() => onBinClick?.(bin)}
            className={`relative rounded-lg border-2 ${colors.border} ${colors.bg} cursor-pointer transition-all hover:shadow-md overflow-hidden ${
              compact ? "p-2" : "p-3"
            }`}
          >
            {/* Fill level indicator */}
            {bin.status !== "empty" && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-current opacity-10 transition-all"
                style={{ height: `${fillPercent}%` }}
              />
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${colors.text}`}>{bin.label}</span>
                <Package className={`h-3.5 w-3.5 ${colors.text}`} />
              </div>

              {!compact && (
                <>
                  <div className="text-xs text-muted-foreground capitalize mb-1">{bin.status.replace("_", " ")}</div>
                  {bin.materialName && (
                    <div className="text-xs font-medium text-foreground truncate">{bin.materialName}</div>
                  )}
                  {bin.weightKg !== undefined && (
                    <div className="text-sm font-mono font-semibold text-foreground mt-1">
                      {bin.weightKg.toFixed(1)} kg
                    </div>
                  )}
                  {bin.capacityKg && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          fillPercent > 90 ? "bg-destructive" : fillPercent > 70 ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {bin.status === "in_process" && (
              <div className="absolute top-1 right-1">
                <AlertTriangle className="h-3 w-3 text-warning animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { type BinInfo };
export default BinVisualizer;
