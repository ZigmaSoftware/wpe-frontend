import { z } from "zod";

const trimmedRequired = (label: string) => z.string().trim().min(1, `${label} is required.`);

const numericRequired = (label: string, minimum = 0) =>
  z.coerce.number().min(minimum, `${label} must be ${minimum === 0 ? "zero or greater" : "greater than zero"}.`);

const numericOptional = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(0, `${label} must be zero or greater.`).optional(),
  );

const baseCodeSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Name"),
  description: z.string().trim().optional().default(""),
  is_active: z.boolean().default(true),
});

export const profileCreationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Product name"),
  profile_type: z.coerce.number().min(1, "Profile type is required."),
  profile_size: z.coerce.number().min(1, "Profile size is required."),
  color: z.coerce.number().min(1, "Color is required."),
  length: numericRequired("Length", 0.001),
  weight_per_piece: numericRequired("Weight per piece", 0.001),
  uom: z.enum(["NOS", "METER"], { required_error: "UOM is required." }),
  packing_type: z.coerce.number().nullable().optional(),
  is_active: z.boolean().default(true),
  image: z.instanceof(File).nullable().optional(),
  image_url: z.string().optional(),
});

export const profileSizeSchema = baseCodeSchema.extend({
  width: numericRequired("Width", 0.001),
  thickness: numericRequired("Thickness", 0.001),
  length: numericRequired("Length", 0.001),
  uom: z.enum(["MM", "METER"], { required_error: "UOM is required." }),
});

export const colorCreationSchema = baseCodeSchema.extend({
  color_group: z.enum(["DARK", "LIGHT", ""], { required_error: "Color group is required." }).default(""),
});

export const machineCreationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Machine name"),
  machine_type: z.enum(
    ["HIGH_SPEED_MIX", "GRANULATOR", "BLENDING", "GRANULATION", "EXTRUSION", "EXTRUDER", "MIXER"],
    { required_error: "Machine type is required." },
  ),
  department: z.coerce.number().nullable().optional(),
  capacity: numericOptional("Capacity"),
  capacity_uom: z.enum(["KG", "HOUR", "KG_PER_HOUR", ""], { required_error: "Capacity UOM is required." }).default(""),
  serial_no: trimmedRequired("Machine serial"),
  manufacturer: z.string().trim().optional().default(""),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "BREAKDOWN"], { required_error: "Status is required." }),
  is_active: z.boolean().default(true),
});

export const workCentreCreationSchema = baseCodeSchema.extend({
  department: z.coerce.number().nullable().optional(),
  capacity: numericOptional("Capacity"),
});

export const productionLineSchema = baseCodeSchema.extend({
  department: z.coerce.number().nullable().optional(),
  machine: z.coerce.number().nullable().optional(),
  line_capacity: numericOptional("Line capacity"),
  capacity_uom: z.enum(["KG", "HOUR", "KG_PER_HOUR", ""], { required_error: "Capacity UOM is required." }).default(""),
  status: z.enum(["FREE", "RUNNING", "MAINTENANCE"], { required_error: "Status is required." }),
});

export const binCreationSchema = baseCodeSchema.extend({
  current_status: z.enum(["FREE", "OCCUPIED", "HOLD", ""], { required_error: "Current status is required." }).default(""),
});

export const bagCreationSchema = baseCodeSchema.extend({
  standard_weight: numericOptional("Standard weight"),
  uom: z.literal("KG").default("KG"),
  department: z.preprocess(
    (value) => (value === "" || value === 0 || value === null || value === undefined ? null : Number(value)),
    z.number().int().positive().nullable().optional(),
  ),
  current_status: z.enum(["FREE", "OCCUPIED", "USED"]).default("FREE"),
});

export const tareMasterSchema = baseCodeSchema.extend({
  stage: z.enum(["AD", "BL", "GL", "PR"], { required_error: "Stage is required." }),
  tare_weight: numericRequired("Tare weight", 0),
  uom: z.literal("KG").default("KG"),
});

export const packingTypeSchema = baseCodeSchema.extend({
  standard_pcs: z.coerce.number().int().min(0, "Standard PCS must be zero or greater."),
  standard_weight: numericRequired("Standard weight", 0.001),
  uom: z.enum(["NOS", "KG"], { required_error: "UOM is required." }),
});

export const packingMaterialSchema = baseCodeSchema.extend({
  item: z.coerce.number().min(1, "Item is required."),
  uom: z.enum(["KG", "NOS"], { required_error: "UOM is required." }),
  standard_consumption: numericOptional("Standard consumption"),
});

export type ProfileCreationFormValues = z.infer<typeof profileCreationSchema>;
export type ProfileSizeFormValues = z.infer<typeof profileSizeSchema>;
export type ColorCreationFormValues = z.infer<typeof colorCreationSchema>;
export type MachineCreationFormValues = z.infer<typeof machineCreationSchema>;
export type WorkCentreCreationFormValues = z.infer<typeof workCentreCreationSchema>;
export type ProductionLineFormValues = z.infer<typeof productionLineSchema>;
export type BinCreationFormValues = z.infer<typeof binCreationSchema>;
export type BagCreationFormValues = z.infer<typeof bagCreationSchema>;
export type TareMasterFormValues = z.infer<typeof tareMasterSchema>;
export type PackingTypeFormValues = z.infer<typeof packingTypeSchema>;
export type PackingMaterialFormValues = z.infer<typeof packingMaterialSchema>;
