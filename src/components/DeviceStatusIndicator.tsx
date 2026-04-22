import { Wifi, WifiOff, AlertTriangle, Signal } from "lucide-react";
import { DeviceConnectionStatus } from "@/hooks/useDeviceStatus";

interface DeviceStatusIndicatorProps {
  status: DeviceConnectionStatus;
  name: string;
  signal?: number;
  compact?: boolean;
}

const DeviceStatusIndicator = ({ status, name, signal, compact = false }: DeviceStatusIndicatorProps) => {
  const statusConfig: Record<DeviceConnectionStatus, { icon: React.ReactNode; label: string; className: string }> = {
    online: { icon: <Wifi className="h-3.5 w-3.5" />, label: "Online", className: "status-badge-online" },
    offline: { icon: <WifiOff className="h-3.5 w-3.5" />, label: "Offline", className: "status-badge-offline" },
    connecting: { icon: <Signal className="h-3.5 w-3.5 animate-pulse" />, label: "Connecting", className: "status-badge-warning" },
    error: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Error", className: "status-badge-offline" },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.className}`}>
          {config.icon}
        </div>
        <div>
          <div className="text-sm font-medium text-card-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{config.label}</div>
        </div>
      </div>
      {signal !== undefined && status === "online" && (
        <div className="text-xs text-muted-foreground">
          {signal.toFixed(0)}% signal
        </div>
      )}
    </div>
  );
};

export default DeviceStatusIndicator;
