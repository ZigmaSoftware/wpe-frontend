export interface MasterRecord {
  id: number;
  unique_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterWritePayload {
  name: string;
  is_active?: boolean;
}

export interface CodeMasterRecord extends MasterRecord {
  code: string | null;
  description: string;
}

export interface CodeMasterWritePayload extends MasterWritePayload {
  description?: string;
}

export interface WarehouseMasterRecord extends CodeMasterRecord {
  warehouse_type: "FG" | "RM" | "SCRAP";
}

export interface WarehouseMasterWritePayload extends CodeMasterWritePayload {
  warehouse_type: "FG" | "RM" | "SCRAP";
}

export type StoreMasterRecord = CodeMasterRecord;

export interface DepartmentMasterRecord extends CodeMasterRecord {
  department_head: number | null;
  department_head_name: string | null;
}

export interface DepartmentMasterWritePayload extends CodeMasterWritePayload {
  department_head?: number | null;
}

export interface DesignationMasterRecord extends CodeMasterRecord {
  department: number;
  department_name: string;
}

export interface DesignationMasterWritePayload extends CodeMasterWritePayload {
  department: number;
}

export interface RoleMasterRecord extends CodeMasterRecord {
  designation: number | null;
  designation_name: string | null;
}

export interface RoleMasterWritePayload extends CodeMasterWritePayload {
  designation: number;
}

export interface UnitMasterRecord {
  id: number;
  unique_id: string;
  uom_code: string;
  name: string;
  decimal_allowed: boolean;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitMasterWritePayload {
  uom_code: string;
  name: string;
  decimal_allowed?: boolean;
  decimal_places?: number;
  is_active?: boolean;
}

export interface ItemMasterRecord {
  id: number;
  unique_id: string;
  item_code: string | null;
  item_name: string;
  sub_category: number;
  sub_category_name: string;
  category: number;
  category_name: string;
  description: string;
  item_type: "RM" | "ADDITIVE" | "PACKING" | "FG";
  uom: number;
  uom_code: string;
  uom_name: string;
  hsn_code: string;
  gst_percentage: string;
  minimum_stock: string;
  maximum_stock: string;
  reorder_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemMasterWritePayload {
  item_name: string;
  sub_category: number;
  description?: string;
  item_type: "RM" | "ADDITIVE" | "PACKING" | "FG";
  uom: number;
  hsn_code?: string;
  gst_percentage: string | number;
  minimum_stock: string | number;
  maximum_stock: string | number;
  reorder_level?: string | number;
  is_active?: boolean;
}

export interface ProductTypeCategoryRecord {
  id: number;
  unique_id: string;
  name: string;
  code: string;
  description: string;
  sort_order: number;
  subtype_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductTypeCategoryWritePayload {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ProductTypeSubtypeRecord {
  id: number;
  unique_id: string;
  category: number;
  category_name: string;
  name: string;
  code: string;
  description: string;
  variant_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductTypeSubtypeLookupItem {
  id: number;
  name: string;
  code: string;
  category: number;
  category_name: string;
  sort_order: number;
}

export interface ProductTypeSubtypeWritePayload {
  category: number;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ProductTypeTreeCategoryRecord extends ProductTypeCategoryRecord {
  subtypes: ProductTypeSubtypeRecord[];
}

export interface WPEUserRecord {
  id: number;
  unique_id: string;
  username: string;
  full_name: string;
  job_title: string;
  email: string;
  phone_no: string;
  location: number | null;
  location_name: string | null;
  default_branch: number | null;
  default_branch_name: string | null;
  authorized_branches: MasterRecord[];
  authorized_price_books: MasterRecord[];
  authorized_warehouses: MasterRecord[];
  authorized_production_types: MasterRecord[];
  authorized_sale_types: MasterRecord[];
  authorized_purchase_types: MasterRecord[];
  role: number | null;
  role_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WPEUserWritePayload {
  username: string;
  password?: string;
  confirm_password?: string;
  full_name: string;
  job_title?: string;
  email?: string;
  phone_no?: string;
  location?: number | null;
  default_branch?: number | null;
  authorized_branches?: number[];
  authorized_price_books?: number[];
  authorized_warehouses?: number[];
  authorized_production_types?: number[];
  authorized_sale_types?: number[];
  authorized_purchase_types?: number[];
  role?: number | null;
  is_active?: boolean;
}

export interface LookupItem {
  id: number;
  name: string;
  code?: string | null;
  username?: string | null;
  uom_code?: string | null;
  decimal_allowed?: boolean;
  decimal_places?: number;
  designation_id?: number | null;
  designation_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
}

export type ProductTypeStatusFilterValue = "all" | "active" | "inactive";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TableParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}
