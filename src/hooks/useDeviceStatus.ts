import { useState, useEffect } from "react";

export type DeviceType = "weighing_scale" | "qr_scanner" | "barcode_scanner" | "plc" | "temperature_sensor";
export type DeviceConnectionStatus = "online" | "offline" | "connecting" | "error";

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceConnectionStatus;
  lastSeen: Date;
  location: string;
  firmware?: string;
  ipAddress?: string;
  signal?: number;
}

const MOCK_DEVICES: DeviceInfo[] = [
  { id: "WS-001", name: "Blending Scale A", type: "weighing_scale", status: "online", lastSeen: new Date(), location: "Blending Dept", firmware: "v2.4.1", ipAddress: "192.168.1.101", signal: 95 },
  { id: "WS-002", name: "Blending Scale B", type: "weighing_scale", status: "online", lastSeen: new Date(), location: "Blending Dept", firmware: "v2.4.1", ipAddress: "192.168.1.102", signal: 88 },
  { id: "WS-003", name: "Packing Scale", type: "weighing_scale", status: "online", lastSeen: new Date(), location: "Packing Line", firmware: "v2.4.0", ipAddress: "192.168.1.103", signal: 92 },
  { id: "WS-004", name: "QC Verification Scale", type: "weighing_scale", status: "connecting", lastSeen: new Date(Date.now() - 30000), location: "QC Lab", firmware: "v2.3.8", ipAddress: "192.168.1.104", signal: 45 },
  { id: "QR-001", name: "Bin Scanner - Blending", type: "qr_scanner", status: "online", lastSeen: new Date(), location: "Blending Dept", firmware: "v1.2.0", ipAddress: "192.168.1.201", signal: 98 },
  { id: "QR-002", name: "Bin Scanner - Granulation", type: "qr_scanner", status: "online", lastSeen: new Date(), location: "Granulation Dept", firmware: "v1.2.0", ipAddress: "192.168.1.202", signal: 91 },
  { id: "QR-003", name: "Line Scanner - Extrusion", type: "qr_scanner", status: "offline", lastSeen: new Date(Date.now() - 600000), location: "Extrusion Line", firmware: "v1.1.8", ipAddress: "192.168.1.203", signal: 0 },
  { id: "QR-004", name: "Packing Scanner", type: "qr_scanner", status: "online", lastSeen: new Date(), location: "Packing Line", firmware: "v1.2.0", ipAddress: "192.168.1.204", signal: 85 },
  { id: "QR-005", name: "Dispatch Scanner", type: "qr_scanner", status: "online", lastSeen: new Date(), location: "Warehouse", firmware: "v1.2.0", ipAddress: "192.168.1.205", signal: 90 },
  { id: "BC-001", name: "Material Barcode Reader", type: "barcode_scanner", status: "online", lastSeen: new Date(), location: "Store Dept", firmware: "v3.0.2", ipAddress: "192.168.1.301", signal: 96 },
];

export function useDeviceStatus() {
  const [devices, setDevices] = useState<DeviceInfo[]>(MOCK_DEVICES);

  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          lastSeen: d.status === "online" ? new Date() : d.lastSeen,
          signal: d.status === "online" ? Math.min(100, Math.max(60, (d.signal || 80) + (Math.random() - 0.5) * 5)) : d.signal,
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;
  const connectingCount = devices.filter((d) => d.status === "connecting").length;

  return { devices, onlineCount, offlineCount, connectingCount, totalCount: devices.length };
}
