import { z } from "zod";

const trimmedRequired = (label: string) => z.string().trim().min(1, `${label} is required.`);

export const codeMasterSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Name"),
  description: z.string().trim().optional().default(""),
  is_active: z.boolean().default(true),
});

export const warehouseMasterSchema = codeMasterSchema.extend({
  warehouse_type: z.enum(["FG", "RM", "SCRAP"], {
    required_error: "Warehouse type is required.",
  }),
});

export const departmentMasterSchema = codeMasterSchema.extend({
  department_head: z.coerce.number().nullable().optional(),
});

export const designationMasterSchema = codeMasterSchema.extend({
  department: z.coerce.number().min(1, "Department is required."),
});

export const roleMasterSchema = codeMasterSchema.extend({
  designation: z.coerce.number().min(1, "Designation is required."),
});

export const unitMasterSchema = z.object({
  uom_code: trimmedRequired("UOM code"),
  name: trimmedRequired("UOM name"),
  decimal_allowed: z.boolean().default(false),
  decimal_places: z.coerce.number().int().min(0, "Decimal places must be zero or greater."),
  is_active: z.boolean().default(true),
}).superRefine((value, context) => {
  if (!value.decimal_allowed && value.decimal_places !== 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["decimal_places"],
      message: "Decimal places must be 0 when decimal values are not allowed.",
    });
  }
});

export const itemMasterSchema = z.object({
  code: z.string().optional().default(""),
  item_name: trimmedRequired("Variant name"),
  category: z.coerce.number().min(1, "Item category is required."),
  sub_category: z.coerce.number().min(1, "Item sub category is required."),
  description: z.string().trim().optional().default(""),
  item_type: z.enum(["RM", "ADDITIVE", "PACKING", "FG"], {
    required_error: "Item type is required.",
  }),
  uom: z.coerce.number().min(1, "UOM is required."),
  hsn_code: z.string().trim().optional().default(""),
  gst_percentage: z.coerce.number().min(0, "GST percentage must be zero or greater."),
  minimum_stock: z.coerce.number().min(0, "Minimum stock must be zero or greater."),
  maximum_stock: z.coerce.number().min(0, "Maximum stock must be zero or greater."),
  reorder_level: z.coerce.number().min(0, "Reorder level must be zero or greater."),
  is_active: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.minimum_stock > value.maximum_stock) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minimum_stock"],
      message: "Minimum stock cannot exceed maximum stock.",
    });
  }
  if (value.reorder_level > value.maximum_stock) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reorder_level"],
      message: "Reorder level cannot exceed maximum stock.",
    });
  }
});

export type CodeMasterFormValues = z.infer<typeof codeMasterSchema>;
export type WarehouseMasterFormValues = z.infer<typeof warehouseMasterSchema>;
export type DepartmentMasterFormValues = z.infer<typeof departmentMasterSchema>;
export type DesignationMasterFormValues = z.infer<typeof designationMasterSchema>;
export type RoleMasterFormValues = z.infer<typeof roleMasterSchema>;
export type UnitMasterFormValues = z.infer<typeof unitMasterSchema>;
export type ItemMasterFormValues = z.infer<typeof itemMasterSchema>;
