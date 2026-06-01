import type { CodeMasterRecord, CodeMasterWritePayload } from "@/features/wpe-masters/types";

export interface WeighmentScaleRecord extends CodeMasterRecord {
  department: number;
  department_name: string;
  machine: number;
  machine_name: string;
  machine_code: string;
  connection_type: "SERIAL" | "USB" | "API";
  port_name: string;
  baud_rate: number;
  data_bits: number;
  parity: "NONE";
  stop_bits: number;
  unit: number | null;
  unit_name: string | null;
  unit_code: string | null;
  is_auto_capture: boolean;
}

export interface WeighmentScaleWritePayload extends CodeMasterWritePayload {
  department: number;
  machine: number;
  connection_type: "SERIAL" | "USB" | "API";
  port_name?: string;
  baud_rate: number;
  data_bits: number;
  parity?: "NONE";
  stop_bits: number;
  unit?: number | null;
  is_auto_capture?: boolean;
  is_active?: boolean;
}

export interface PrinterCreationRecord extends CodeMasterRecord {
  printer_type: "BARCODE" | "QR" | "STICKER";
  department: number;
  department_name: string;
  connection_type: "USB" | "NETWORK";
  ip_address: string | null;
  port: number | null;
  paper_size: string;
}

export interface PrinterCreationWritePayload extends CodeMasterWritePayload {
  printer_type: "BARCODE" | "QR" | "STICKER";
  department: number;
  connection_type: "USB" | "NETWORK";
  ip_address?: string | null;
  port?: number | null;
  paper_size?: string;
  is_active?: boolean;
}

export interface QRLabelTemplateRecord extends CodeMasterRecord {
  label_type: "BIN" | "BAG" | "PRODUCT" | "REGRIND";
  width: string | null;
  height: string | null;
  qr_data_format: "JSON" | "TEXT";
  printer: number;
  printer_name: string;
  printer_code: string;
}

export interface QRLabelTemplateWritePayload extends CodeMasterWritePayload {
  label_type: "BIN" | "BAG" | "PRODUCT" | "REGRIND";
  width?: number | string | null;
  height?: number | string | null;
  qr_data_format?: "JSON" | "TEXT";
  printer: number;
  is_active?: boolean;
}

export interface SerialPortConfigurationRecord extends CodeMasterRecord {
  port_name: string;
  baud_rate: number;
  parity: "NONE";
  data_bits: number;
  stop_bits: number;
  timeout: number | null;
  read_format: "ASCII" | "HEX";
}

export interface SerialPortConfigurationWritePayload extends CodeMasterWritePayload {
  port_name?: string;
  baud_rate: number;
  parity?: "NONE";
  data_bits: number;
  stop_bits: number;
  timeout?: number | null;
  read_format?: "ASCII" | "HEX";
  is_active?: boolean;
}
