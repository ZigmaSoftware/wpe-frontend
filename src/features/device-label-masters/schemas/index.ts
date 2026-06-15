import { z } from "zod";

const trimmedRequired = (label: string) => z.string().trim().min(1, `${label} is required.`);

const numericRequired = (label: string, minimum = 0) =>
  z.coerce.number().min(minimum, `${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}.`);

const integerRequired = (label: string, minimum = 1) =>
  z.coerce.number().int().min(minimum, `${label} must be ${minimum === 1 ? "greater than zero" : `${minimum} or greater`}.`);

const integerOptional = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().min(0, `${label} must be zero or greater.`).optional(),
  );

const numericOptional = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(0, `${label} must be zero or greater.`).optional(),
  );

export const weighmentScaleSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Scale name"),
  department: z.coerce.number().min(1, "Department is required."),
  machine: z.coerce.number().min(1, "Machine is required."),
  connection_type: z.enum(["SERIAL", "USB", "API"]).default("SERIAL"),
  port_name: z.string().trim().optional().default("COM1"),
  baud_rate: integerRequired("Baud rate"),
  data_bits: integerRequired("Data bits"),
  parity: z.literal("NONE").default("NONE"),
  stop_bits: integerRequired("Stop bits"),
  unit: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().nullable(),
  ).default(null),
  is_auto_capture: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const printerCreationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Printer name"),
  printer_type: z.enum(["BARCODE", "QR", "STICKER", ""]).refine((value) => value !== "", "Printer type is required."),
  department: z.coerce.number().min(1, "Department is required."),
  connection_type: z.enum(["USB", "NETWORK", ""]).refine((value) => value !== "", "Connection type is required."),
  ip_address: z.string().trim().optional().default(""),
  port: integerOptional("Port"),
  paper_size: z.string().trim().optional().default("LABEL"),
  is_active: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.connection_type === "NETWORK") {
    if (!value.ip_address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ip_address"],
        message: "IP address is required for network printers.",
      });
    }
    if (value.port === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["port"],
        message: "Port is required for network printers.",
      });
    }
  }
});

export const qrLabelTemplateSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Template name"),
  label_type: z.enum(["BIN", "BAG", "PRODUCT", "REGRIND", ""]).refine((value) => value !== "", "Label type is required."),
  width: numericOptional("Width"),
  height: numericOptional("Height"),
  qr_data_format: z.enum(["JSON", "TEXT", ""]).default(""),
  printer: z.coerce.number().min(1, "Printer is required."),
  is_active: z.boolean().default(true),
});

export const serialPortConfigurationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Device name"),
  port_name: z.string().trim().optional().default("/dev/ttyS1"),
  baud_rate: integerRequired("Baud rate"),
  parity: z.literal("NONE").default("NONE"),
  data_bits: integerRequired("Data bits"),
  stop_bits: integerRequired("Stop bits"),
  timeout: integerOptional("Timeout"),
  read_format: z.enum(["ASCII", "HEX"]).default("ASCII"),
  is_active: z.boolean().default(true),
});

export type WeighmentScaleFormValues = z.infer<typeof weighmentScaleSchema>;
export type PrinterCreationFormValues = z.infer<typeof printerCreationSchema>;
export type QRLabelTemplateFormValues = z.infer<typeof qrLabelTemplateSchema>;
export type SerialPortConfigurationFormValues = z.infer<typeof serialPortConfigurationSchema>;
