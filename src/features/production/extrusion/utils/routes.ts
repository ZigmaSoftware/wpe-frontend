import {
  ClipboardCheck,
  Package,
  QrCode,
  Recycle,
  Scale,
  ShieldCheck,
  Warehouse,
  ClipboardList,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export const EXTRUSION_ROUTE = "/app/production/extrusion";
export const EXTRUSION_WORK_ORDERS_ROUTE = `${EXTRUSION_ROUTE}/work-orders`;
export const EXTRUSION_INSPECTIONS_ROUTE = `${EXTRUSION_ROUTE}/inspections`;
export const EXTRUSION_PACKING_ROUTE = `${EXTRUSION_ROUTE}/packing`;
export const EXTRUSION_WEIGHING_ROUTE = `${EXTRUSION_ROUTE}/weighing`;
export const EXTRUSION_STICKERS_ROUTE = `${EXTRUSION_ROUTE}/stickers`;
export const EXTRUSION_SHIFT_APPROVAL_ROUTE = `${EXTRUSION_ROUTE}/shift-approval`;
export const EXTRUSION_SCRAP_ROUTE = `${EXTRUSION_ROUTE}/scrap`;
export const EXTRUSION_WAREHOUSE_ROUTE = `${EXTRUSION_ROUTE}/warehouse`;
export const EXTRUSION_KPI_DASHBOARD_ROUTE = `${EXTRUSION_ROUTE}/kpi-dashboard`;

export type ExtrusionWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const extrusionWorkspaceModuleDefinitions: ExtrusionWorkspaceModuleDefinition[] = [
  {
    to: EXTRUSION_WORK_ORDERS_ROUTE,
    icon: ClipboardList,
    label: "Work Orders",
    description: "Create and release extrusion work orders against the production plan.",
  },
  {
    to: EXTRUSION_INSPECTIONS_ROUTE,
    icon: ClipboardCheck,
    label: "Quality Inspection",
    description: "Record straightness, flatness, section weight, length and visual results.",
  },
  {
    to: EXTRUSION_PACKING_ROUTE,
    icon: Package,
    label: "Packing",
    description: "Create packets from accepted profiles and calculate the permissible weight range.",
  },
  {
    to: EXTRUSION_WEIGHING_ROUTE,
    icon: Scale,
    label: "Weight Verification",
    description: "Capture actual packet weight and validate against the permissible range.",
  },
  {
    to: EXTRUSION_STICKERS_ROUTE,
    icon: QrCode,
    label: "Sticker & Scan",
    description: "Generate, reprint and scan QR packet stickers.",
  },
  {
    to: EXTRUSION_SHIFT_APPROVAL_ROUTE,
    icon: ShieldCheck,
    label: "Shift-End QC Approval",
    description: "Approve accepted packets individually or in bulk at shift end.",
  },
  {
    to: EXTRUSION_SCRAP_ROUTE,
    icon: Recycle,
    label: "Scrap Management",
    description: "Record scrap with actual weight only and track reversal history.",
  },
  {
    to: EXTRUSION_WAREHOUSE_ROUTE,
    icon: Warehouse,
    label: "Warehouse Transfer",
    description: "Scan and acknowledge QC-approved packets received into the warehouse.",
  },
  {
    to: EXTRUSION_KPI_DASHBOARD_ROUTE,
    icon: Gauge,
    label: "Scrap KPI Dashboard",
    description: "Monitor production, scrap and recovery KPIs across profile, shift and line.",
  },
];
