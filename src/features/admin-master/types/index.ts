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
  designation_id?: number | null;
  designation_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  role_id?: number | null;
  role_name?: string | null;
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

export type UserTypeRecord = {
  id: number;
  unique_id?: string;
  department?: number | null;
  department_name?: string | null;
  role?: number | null;
  role_name?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserTypeWritePayload = {
  department: number;
  role: number;
  is_active: boolean;
};

export type StaffCreationRecord = {
  id: number;
  unique_id?: string;
  staff_code?: string | null;
  name: string;
  age?: number | null;
  department?: number | null;
  department_name?: string | null;
  designation?: number | null;
  designation_name?: string | null;
  role?: number | null;
  role_name?: string | null;
  mobile?: string | null;
  email?: string | null;
  joining_date?: string | null;
  gender?: "male" | "female" | "other" | null;
  address?: string | null;
  emergency_contact_no?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  remarks?: string | null;
};

export type StaffCreationWritePayload = {
  staff_code: string;
  name: string;
  age: number;
  designation: number;
  mobile: string;
  email: string;
  joining_date?: string | null;
  gender?: "male" | "female" | "other" | "" | null;
  address?: string | null;
  emergency_contact_no?: string | null;
  photo?: File | null;
  photo_url?: string;
  is_active: boolean;
  remarks?: string | null;
};

export type UserCreationRecord = {
  id: number;
  unique_id?: string;
  user?: number | null;
  username: string;
  staff: number;
  staff_id?: string;
  full_name?: string;
  user_type?: number | null;
  user_type_name?: string | null;
  mobile_no?: string | null;
  email?: string | null;
  department?: number | null;
  department_name?: string | null;
  role?: number | null;
  role_name?: string | null;
  company?: number | null;
  company_name?: string | null;
  account_status: "active" | "inactive" | "locked";
  is_active: boolean;
  password?: string | null;
  last_login?: string | null;
  password_changed_at?: string | null;
  failed_login_attempts?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserCreationWritePayload = {
  staff: number;
  user_type: number;
  company: number;
  username: string;
  password?: string;
  confirm_password?: string;
  mobile_no?: string | null;
  email?: string | null;
  account_status: "active" | "inactive" | "locked";
};

export type UserScreenPermissionRecord = {
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

export type UserScreenPermissionSummaryRecord = {
  id: number;
  user_type: number;
  user_type_name?: string;
  is_active: boolean;
};

export type PermissionAssignmentEntry = {
  scope_type: "main_screen" | "section" | "screen";
  main_screen?: number | null;
  screen_section?: number | null;
  user_screen?: number | null;
  action_permissions?: AdminActionPermissions;
  is_active?: boolean;
};
