import { z } from "zod";

const trimmedRequired = (label: string) => z.string().trim().min(1, `${label} is required.`);

const numericOptional = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(0, `${label} must be zero or greater.`).optional(),
  );

const numericRequired = (label: string, minimum = 0.001) =>
  z.coerce.number().min(minimum, `${label} must be greater than zero.`);

export const recipeCreationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("Recipe name"),
  description: z.string().trim().optional().default(""),
  recipe_version: z.string().trim().optional().default(""),
  batch_size: numericOptional("Batch size"),
  is_active: z.boolean().default(true),
});

export const bomCreationSchema = z.object({
  code: z.string().optional().default(""),
  name: trimmedRequired("BOM name"),
  description: z.string().trim().optional().default(""),
  product: z.coerce.number().nullable().optional(),
  bom_version: z.string().trim().optional().default(""),
  output_quantity: numericOptional("Output quantity"),
  output_uom: z.enum(["NOS", "KG", ""], { required_error: "Output UOM is required." }).default(""),
  status: z.enum(["DRAFT", "APPROVED"], { required_error: "Status is required." }),
  is_active: z.boolean().default(true),
});

export const bomItemCreationSchema = z.object({
  bom: z.coerce.number().min(1, "BOM is required."),
  item: z.coerce.number().min(1, "Item is required."),
  item_type: z.enum(["RM", "PACKING", "CONSUMABLE"], { required_error: "Item type is required." }),
  required_quantity: numericOptional("Required quantity"),
  uom: trimmedRequired("UOM"),
  is_active: z.boolean().default(true),
});

export type RecipeCreationFormValues = z.infer<typeof recipeCreationSchema>;
export type BOMCreationFormValues = z.infer<typeof bomCreationSchema>;
export type BOMItemCreationFormValues = z.infer<typeof bomItemCreationSchema>;
