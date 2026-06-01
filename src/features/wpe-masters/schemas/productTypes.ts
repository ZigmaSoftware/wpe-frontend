import { z } from "zod";

export const productTypeCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(200, "Category name must be 200 characters or fewer"),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").optional().default(""),
  sort_order: z.coerce.number().int().min(1, "Sort order must be at least 1"),
  is_active: z.boolean(),
});

export const productTypeSubtypeSchema = z.object({
  category: z.coerce.number().int().min(1, "Item category is required"),
  name: z.string().trim().min(1, "Sub category name is required").max(200, "Sub category name must be 200 characters or fewer"),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").optional().default(""),
  sort_order: z.coerce.number().int().min(1, "Sort order must be at least 1"),
  is_active: z.boolean(),
});

export type ProductTypeCategoryFormValues = z.infer<typeof productTypeCategorySchema>;
export type ProductTypeSubtypeFormValues = z.infer<typeof productTypeSubtypeSchema>;
