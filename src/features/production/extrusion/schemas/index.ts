import { z } from "zod";

const numericRequired = (label: string, minimum = 0) =>
  z.coerce.number().min(minimum, `${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}.`);

const trimmedRequired = (label: string) => z.string().trim().min(1, `${label} is required.`);

export const workOrderConsumableSchema = z.object({
  item: z.coerce.number().min(1, "Item is required."),
  quantity: numericRequired("Quantity", 0.001),
  uom: z.string().trim().optional().default(""),
});

export const workOrderSchema = z.object({
  profile: z.coerce.number().min(1, "Profile is required."),
  extrusion_line: z.coerce.number().min(1, "Extrusion line is required."),
  production_date: trimmedRequired("Production date"),
  shift: trimmedRequired("Shift"),
  planned_pieces: z.coerce.number().int().min(0, "Planned pieces must be zero or greater."),
  planned_meters: numericRequired("Planned meters", 0),
  packing_material: z.coerce.number().min(1, "Packing material is required."),
  expected_tare_weight: numericRequired("Tare weight", 0),
  expected_section_weight_per_meter: numericRequired("Section weight per meter", 0.001),
  tolerance_type: z.enum(["FIXED", "PERCENTAGE"], { required_error: "Tolerance type is required." }),
  tolerance_value: numericRequired("Tolerance value", 0),
  notes: z.string().trim().optional().default(""),
  consumables: z.array(workOrderConsumableSchema).min(1, "At least one consumable is required."),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export const inspectionSchema = z.object({
  work_order: z.coerce.number().min(1, "Work order is required."),
  batch_reference: z.string().trim().optional().default(""),
  inspected_pieces: z.coerce.number().int().min(0, "Inspected pieces must be zero or greater."),
  straightness_result: z.enum(["PASS", "FAIL", "NA"]),
  flatness_result: z.enum(["PASS", "FAIL", "NA"]),
  section_weight_result: z.enum(["PASS", "FAIL", "NA"]),
  length_result: z.enum(["PASS", "FAIL", "NA"]),
  visual_result: z.enum(["PASS", "FAIL", "NA"]),
  dimensional_result: z.enum(["PASS", "FAIL", "NA"]).default("NA"),
  rejection_decision: z.enum(["NONE", "REWORK", "HOLD", "SCRAP"]).default("NONE"),
  rejection_reason: z.string().trim().optional().default(""),
  remarks: z.string().trim().optional().default(""),
});

export type InspectionFormValues = z.infer<typeof inspectionSchema>;

export const packetCreateSchema = z.object({
  work_order: z.coerce.number().min(1, "Work order is required."),
  inspection: z.coerce.number().min(1, "Accepted inspection is required."),
  pieces: z.coerce.number().int().min(1, "Pieces must be greater than zero."),
  length_per_piece: numericRequired("Length per piece", 0.001),
  packing_material: z.coerce.number().min(1, "Packing material is required."),
  tare_weight: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(0).optional(),
  ),
});

export type PacketCreateFormValues = z.infer<typeof packetCreateSchema>;

export const weightCaptureSchema = z.object({
  actual_gross_weight: numericRequired("Actual gross weight", 0.001),
  source: z.enum(["SCALE", "MANUAL"]).default("SCALE"),
  is_override: z.boolean().default(false),
  override_reason: z.string().trim().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.is_override && !data.override_reason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["override_reason"], message: "A reason is required for manual override." });
  }
});

export type WeightCaptureFormValues = z.infer<typeof weightCaptureSchema>;

export const reasonInputSchema = z.object({
  reason: trimmedRequired("Reason"),
});

export type ReasonFormValues = z.infer<typeof reasonInputSchema>;

export const scrapTransactionSchema = z.object({
  source_stage: z.enum(["QC_INSPECTION", "PACKING", "WEIGHT_VERIFICATION", "SHIFT_END_QC"]),
  work_order: z.coerce.number().min(1, "Work order is required."),
  inspection: z.coerce.number().nullable().optional(),
  packet: z.coerce.number().nullable().optional(),
  production_date: trimmedRequired("Production date"),
  shift: z.string().trim().optional().default(""),
  scrap_category: z.coerce.number().min(1, "Scrap category is required."),
  scrap_reason: z.coerce.number().min(1, "Scrap reason is required."),
  actual_scrap_weight: numericRequired("Actual scrap weight", 0.001),
  remarks: z.string().trim().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.source_stage === "QC_INSPECTION" && !data.inspection) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["inspection"], message: "Inspection is required for QC inspection scrap." });
  }
  if (data.source_stage !== "QC_INSPECTION" && !data.packet) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["packet"], message: "Packet is required for this scrap stage." });
  }
});

export type ScrapTransactionFormValues = z.infer<typeof scrapTransactionSchema>;

export const profileConfigSchema = z.object({
  profile: z.coerce.number().min(1, "Profile is required."),
  section_weight_per_meter: numericRequired("Section weight per meter", 0.001),
  standard_length_per_piece: numericRequired("Standard length per piece", 0.001),
  default_pieces_per_packet: z.coerce.number().int().min(1, "Default pieces per packet must be greater than zero."),
  default_tare_weight: numericRequired("Default tare weight", 0),
  tolerance_type: z.enum(["FIXED", "PERCENTAGE"]),
  tolerance_value: numericRequired("Tolerance value", 0),
  is_active: z.boolean().default(true),
});

export type ProfileConfigFormValues = z.infer<typeof profileConfigSchema>;

export const scrapCategorySchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Name"),
  description: z.string().trim().optional().default(""),
  is_active: z.boolean().default(true),
});

export type ScrapCategoryFormValues = z.infer<typeof scrapCategorySchema>;

export const scrapReasonSchema = scrapCategorySchema.extend({
  category: z.coerce.number().min(1, "Scrap category is required."),
});

export type ScrapReasonFormValues = z.infer<typeof scrapReasonSchema>;
