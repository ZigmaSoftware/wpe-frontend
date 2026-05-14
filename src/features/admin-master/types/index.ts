export type AdminAction = "add" | "update" | "list" | "delete" | "view" | "print";

export type AdminActionPermissions = {
  all?: boolean;
  add?: boolean;
  update?: boolean;
  list?: boolean;
  delete?: boolean;
  view?: boolean;
  print?: boolean;
};

export type AdminMenuScreen = {
  id: number;
  screen_name: string;
  code: string;
  route_path?: string | null;
  icon?: string | null;
  description?: string | null;
  order_no: number;
  available_actions: AdminAction[];
  action_permissions: AdminActionPermissions;
};

export type AdminMenuSection = {
  id: number;
  name: string;
  code: string;
  order_no: number;
  screens: AdminMenuScreen[];
};

export type AdminMenuMain = {
  id: number;
  name: string;
  code: string;
  order_no: number;
  sections: AdminMenuSection[];
};

export type ResolvedPermissionResponse = {
  user_type: {
    id: number;
    name: string;
    code: string;
  };
  menu: AdminMenuMain[];
};

export type DataTableResponse<T> = {
  draw?: number;
  recordsTotal?: number;
  recordsFiltered?: number;
  data: T[];
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  filtered: number;
};

export type AdminTableParams = {
  page: number;
  pageSize: number;
  search: string;
  ordering?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
};

export type LookupOption = {
  id: number;
  name: string;
  code?: string | null;
  order_no?: number;
  main_screen_id?: number;
  screen_section_id?: number;
  staff_code?: string;
  mobile?: string | null;
  email?: string | null;
};

export type MainScreenRecord = {
  id: number;
  unique_id?: string;
  screen_name: string;
  code?: string | null;
  order_no: number;
  is_active: boolean;
};

export type ScreenSectionRecord = {
  id: number;
  unique_id?: string;
  main_screen: number;
  main_screen_name?: string;
  section_name: string;
  code?: string | null;
  order_no: number;
  is_active: boolean;
  description?: string | null;
};

export type UserScreenRecord = {
  id: number;
  unique_id?: string;
  main_screen: number;
  main_screen_name?: string;
  screen_section: number;
  screen_section_name?: string;
  screen_name: string;
  code?: string | null;
  route_path?: string | null;
  order_no: number;
  icon?: string | null;
  description?: string | null;
  is_active: boolean;
  available_actions: AdminAction[];
  created_at?: string;
  updated_at?: string;
};

export type StaffRecord = {
  id: number;
  unique_id?: string;
  staff_id?: string;
  staff_name: string;
  mobile_no?: string | null;
  email?: string | null;
  department?: number | null;
  department_name?: string;
  designation?: string | null;
  is_active: boolean;
};

export type UserTypeRecord = {
  id: number;
  unique_id?: string;
  user_type: string;
  code?: string | null;
  is_active: boolean;
  under_users?: string | null;
  company_wise: boolean;
  project_wise: boolean;
  department_wise: boolean;
  user_wise: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserAccountRecord = {
  id: number;
  unique_id?: string;
  user?: number | null;
  username: string;
  staff: number;
  staff_id?: string;
  staff_name?: string;
  mobile_no?: string | null;
  email?: string | null;
  user_type: number;
  user_type_name?: string;
  company?: number | null;
  company_name?: string;
  department?: number | null;
  department_name?: string;
  project?: string | null;
  under_users?: string | null;
  account_status: "active" | "inactive" | "locked";
  is_active: boolean;
  last_login?: string | null;
  password_changed_at?: string | null;
  failed_login_attempts?: number;
  force_password_change: boolean;
  is_team_head: boolean;
  team_members: number[];
  created_at?: string;
  updated_at?: string;
};

export type UserAccountWritePayload = {
  staff: number;
  username: string;
  password?: string;
  confirm_password?: string;
  user_type: number;
  mobile_no?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: number | null;
  department?: number | null;
  project?: string | null;
  under_users?: string | null;
  account_status: "active" | "inactive" | "locked";
  force_password_change: boolean;
  is_team_head: boolean;
  team_members?: number[];
  designation?: string | null;
};

export type UserPermissionRecord = {
  id: number;
  unique_id?: string;
  user_type: number;
  user_type_name?: string;
  scope_type: "main_screen" | "section" | "screen";
  main_screen: number;
  main_screen_name?: string;
  screen_section?: number | null;
  screen_section_name?: string;
  user_screen?: number | null;
  user_screen_name?: string;
  action_permissions: AdminActionPermissions;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PermissionAssignmentEntry = {
  scope_type: "main_screen" | "section" | "screen";
  main_screen?: number | null;
  screen_section?: number | null;
  user_screen?: number | null;
  action_permissions?: AdminActionPermissions;
  is_active?: boolean;
};
