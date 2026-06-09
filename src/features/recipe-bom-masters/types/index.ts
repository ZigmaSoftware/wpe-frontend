import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  LookupItem,
  PaginatedResponse,
  TableParams,
} from "@/features/wpe-masters/types";

export type RecipeBomLookupItem = LookupItem;
export type RecipeBomPaginatedResponse<T> = PaginatedResponse<T>;
export type RecipeBomTableParams = TableParams;

export interface RecipeRecord extends CodeMasterRecord {
  recipe_version: string;
  batch_size: string | null;
  batch_uom: string;
  status: "DRAFT" | "APPROVED" | "INACTIVE";
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  component_count: number;
}

export interface RecipeWritePayload extends CodeMasterWritePayload {
  name: string;
  recipe_version?: string;
  batch_size?: number | string | null;
  batch_uom?: string;
  status?: "DRAFT" | "APPROVED" | "INACTIVE";
  approved_by?: number | null;
  approved_at?: string | null;
  is_active?: boolean;
}

export interface RecipeItemRecord {
  id: number;
  item: number | null;
  product_subtype: number | null;
  source_type: "ITEM" | "PRODUCT_SUBTYPE";
  item_code: string;
  item_name: string;
  category: string;
  is_active: boolean;
  source_active: boolean | null;
  target_weight_grams: string;
  min_weight_grams: string;
  max_weight_grams: string;
  sequence: number;
  is_regrind: boolean;
  unit: string;
}

export interface RecipeDetailRecord extends RecipeRecord {
  components: RecipeItemRecord[];
}

export interface RecipeItemWritePayload {
  id?: number;
  item?: number | null;
  product_subtype?: number | null;
  target_weight_grams: number | string;
  min_weight_grams: number | string;
  max_weight_grams: number | string;
  sequence?: number;
  is_regrind?: boolean;
  unit?: string;
  is_active?: boolean;
}

export interface BOMCreationRecord extends CodeMasterRecord {
  product: number | null;
  product_name: string | null;
  product_code: string | null;
  bom_version: string;
  output_quantity: string | null;
  output_uom: "NOS" | "KG" | "";
  status: "DRAFT" | "APPROVED";
}

export interface BOMCreationWritePayload extends CodeMasterWritePayload {
  name: string;
  product?: number | null;
  bom_version?: string;
  output_quantity?: number | string | null;
  output_uom?: "NOS" | "KG" | "";
  status?: "DRAFT" | "APPROVED";
  is_active?: boolean;
}

export interface BOMItemCreationRecord {
  id: number;
  bom: number;
  bom_name: string;
  bom_code: string;
  item: number;
  item_name: string;
  item_code: string;
  item_type: "RM" | "PACKING" | "CONSUMABLE";
  required_quantity: string | null;
  uom: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BOMItemCreationWritePayload {
  bom: number;
  item: number;
  item_type: "RM" | "PACKING" | "CONSUMABLE";
  required_quantity?: number | string | null;
  uom?: string;
  is_active?: boolean;
}
