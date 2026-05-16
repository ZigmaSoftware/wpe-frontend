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
}

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
}

export interface PermissionRow {
  role_id: number;
  role_name: string;
  view_all: boolean;
  view_self: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_duplicate: boolean;
  can_delete: boolean;
  generate_invoice_access: boolean;
  invoice_access: boolean;
  access: boolean;
}

export type PermKey = keyof Omit<PermissionRow, "role_id" | "role_name">;

export interface UserScreenPermRow {
  user_screen_id: number;
  screen_name: string;
  screen_section_name: string;
  view_all: boolean;
  view_self: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_duplicate: boolean;
  can_delete: boolean;
  generate_invoice_access: boolean;
  invoice_access: boolean;
  access: boolean;
}

export type UserScreenPermKey = keyof Omit<UserScreenPermRow, "user_screen_id" | "screen_name" | "screen_section_name">;
