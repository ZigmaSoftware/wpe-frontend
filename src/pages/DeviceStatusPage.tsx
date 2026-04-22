import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import DeviceStatusIndicator from "@/components/DeviceStatusIndicator";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";

const DeviceStatusPage = () => {
  const { devices, onlineCount, offlineCount, connectingCount, totalCount } = useDeviceStatus();

  const grouped = {
    weighing_scale: devices.filter((d) => d.type === "weighing_scale"),
    qr_scanner: devices.filter((d) => d.type === "qr_scanner"),
    barcode_scanner: devices.filter((d) => d.type === "barcode_scanner"),
  };

  const typeLabels: Record<string, string> = {
    weighing_scale: "Weighing Scales",
    qr_scanner: "QR Scanners",
    barcode_scanner: "Barcode Readers",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Device Connection Status</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor all IoT devices on the plant floor</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Wifi className="h-5 w-5 text-success" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{onlineCount}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-destructive" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{offlineCount}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <div className="text-2xl font-bold text-card-foreground">{connectingCount}</div>
            <div className="text-xs text-muted-foreground">Connecting</div>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([type, devs]) => (
        <div key={type}>
          <h2 className="text-lg font-semibold text-foreground mb-3">{typeLabels[type] || type}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {devs.map((device) => (
              <div key={device.id} className="space-y-2">
                <DeviceStatusIndicator status={device.status} name={device.name} signal={device.signal} />
                <div className="px-3 text-xs text-muted-foreground flex justify-between">
                  <span>{device.location}</span>
                  <span>{device.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceStatusPage;
