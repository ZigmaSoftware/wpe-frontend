import { Cable, Printer, QrCode, Scale, type LucideIcon } from "lucide-react";

export const DEVICE_LABEL_MASTERS_ROUTE = "/masters/device-label-masters";

export type DeviceLabelMasterModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const deviceLabelMasterModuleDefinitions: DeviceLabelMasterModuleDefinition[] = [
  {
    to: `${DEVICE_LABEL_MASTERS_ROUTE}/weighment-scale-creations`,
    icon: Scale,
    label: "Weighment Scale Creation",
    description: "Configure weighing scale devices, machine mapping, communication settings, and auto-capture behavior.",
  },
  {
    to: `${DEVICE_LABEL_MASTERS_ROUTE}/printer-creations`,
    icon: Printer,
    label: "Printer Creation",
    description: "Manage barcode, QR, and sticker printers with department and connection details.",
  },
  {
    to: `${DEVICE_LABEL_MASTERS_ROUTE}/qr-label-templates`,
    icon: QrCode,
    label: "QR Label Template",
    description: "Configure QR label templates for bins, bags, products, and regrind labels.",
  },
  {
    to: `${DEVICE_LABEL_MASTERS_ROUTE}/serial-port-configurations`,
    icon: Cable,
    label: "Serial Port Configuration",
    description: "Maintain serial communication settings for connected hardware devices.",
  },
];
