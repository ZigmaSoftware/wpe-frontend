import { codeMasterResource } from "@/lib/api/resourceHelpers";
import type {
  PrinterCreationRecord,
  PrinterCreationWritePayload,
  QRLabelTemplateRecord,
  QRLabelTemplateWritePayload,
  SerialPortConfigurationRecord,
  SerialPortConfigurationWritePayload,
  WeighmentScaleRecord,
  WeighmentScaleWritePayload,
} from "@/features/device-label-masters/types";

const BASE = "/api/wpe-masters";

export const deviceLabelMastersApi = {
  weighmentScaleCreations: codeMasterResource<WeighmentScaleRecord, WeighmentScaleWritePayload>(BASE, "weighment-scale-creations"),
  printerCreations: codeMasterResource<PrinterCreationRecord, PrinterCreationWritePayload>(BASE, "printer-creations"),
  qrLabelTemplates: codeMasterResource<QRLabelTemplateRecord, QRLabelTemplateWritePayload>(BASE, "qr-label-templates"),
  serialPortConfigurations: codeMasterResource<SerialPortConfigurationRecord, SerialPortConfigurationWritePayload>(BASE, "serial-port-configurations"),
};
