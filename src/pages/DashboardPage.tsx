import { Scale, ScanLine, Package, Activity, AlertTriangle, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import ProductionTracker from "@/components/ProductionTracker";
import BinVisualizer, { BinInfo } from "@/components/BinVisualizer";

const SAMPLE_BINS: BinInfo[] = [
  { id: "B-R", label: "BIN R", status: "occupied", materialName: "HSM 500 WPE Blend", weightKg: 99.8, capacityKg: 150 },
  { id: "B-Q", label: "BIN Q", status: "in_process", materialName: "Granulated WPE", weightKg: 120, capacityKg: 150 },
  { id: "B-S", label: "BIN S", status: "empty", capacityKg: 150 },
  { id: "B-T", label: "BIN T", status: "full", materialName: "WPE Blend Output", weightKg: 148, capacityKg: 150 },
  { id: "B-U", label: "BIN U", status: "occupied", materialName: "Raw Material Mix", weightKg: 65, capacityKg: 150 },
  { id: "B-V", label: "BIN V", status: "empty", capacityKg: 150 },
];

const DashboardPage = () => {
  const { onlineCount, offlineCount, totalCount } = useDeviceStatus();

  const stats = [
    { label: "Devices Online", value: `${onlineCount}/${totalCount}`, icon: Wifi, color: "text-success" },
    { label: "Devices Offline", value: offlineCount.toString(), icon: WifiOff, color: "text-destructive" },
    { label: "Today's Output", value: "1,470 pcs", icon: TrendingUp, color: "text-primary" },
    { label: "Active Bins", value: "4", icon: Package, color: "text-accent" },
    { label: "Scans Today", value: "238", icon: ScanLine, color: "text-info" },
    { label: "Weight Captures", value: "156", icon: Scale, color: "text-primary" },
    { label: "QC Alerts", value: "3", icon: AlertTriangle, color: "text-warning" },
    { label: "Lines Running", value: "2/4", icon: Activity, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Production Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time plant floor monitoring — WPE Production</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Production Lines</h2>
          <ProductionTracker lines={[]} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Bin Status Overview</h2>
          <BinVisualizer bins={SAMPLE_BINS} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
