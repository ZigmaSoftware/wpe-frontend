import ProductionTracker from "@/components/ProductionTracker";
import BinVisualizer, { BinInfo } from "@/components/BinVisualizer";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import DeviceStatusIndicator from "@/components/DeviceStatusIndicator";
import { Activity } from "lucide-react";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

const MONITOR_BINS: BinInfo[] = [
  { id: "B-R", label: "BIN R", status: "occupied", materialName: "HSM 500 WPE Blend", weightKg: 99.8, capacityKg: 150 },
  { id: "B-Q", label: "BIN Q", status: "in_process", materialName: "Granulated WPE", weightKg: 120, capacityKg: 150 },
  { id: "B-S", label: "BIN S", status: "empty", capacityKg: 150 },
  { id: "B-T", label: "BIN T", status: "full", materialName: "WPE Output", weightKg: 148, capacityKg: 150 },
];

const ProductionMonitorPage = () => {
  const { devices } = useDeviceStatus();
  const criticalDevices = devices.filter((d) => d.status !== "online").slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Production Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time production dashboard</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Production Lines</h2>
          <ProductionTracker lines={[]} />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Active Bins</h2>
            <BinVisualizer bins={MONITOR_BINS} compact />
          </div>

          {criticalDevices.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Device Alerts</h2>
              <div className="space-y-2">
                {criticalDevices.map((d) => (
                  <DeviceStatusIndicator key={d.id} status={d.status} name={d.name} signal={d.signal} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ModuleFormFieldsReference moduleId="production" />
    </div>
  );
};

export default ProductionMonitorPage;
