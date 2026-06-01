export type MasterStatus = boolean;

export type DatatableResponse<T> = {
  draw?: number;
  recordsTotal?: number;
  recordsFiltered?: number;
  data: T[];
};

export type DRFPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type LookupOption = {
  id: number;
  name: string;
  code?: string;
  country_id?: number;
  state_id?: number;
  customer_no?: string;
  customer_name?: string;
  supplier_no?: string;
  supplier_name?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  filtered: number;
  next?: string | null;
  previous?: string | null;
};

export type TableParams = {
  page: number;
  pageSize: number;
  search: string;
  ordering?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
};

export type ApiMutationResponse<T> = {
  message: string;
  data: T;
};

export type ContinentRecord = {
  id: number;
  unique_id?: string;
  name: string;
  code?: string | null;
  order_no?: number;
  is_active?: boolean;
  status: boolean;
};

export type CountryRecord = {
  id: number;
  unique_id?: string;
  continent: number;
  continent_name?: string;
  name: string;
  code: string;
  currency?: number | null;
  currency_name?: string | null;
  currency_code?: string | null;
  is_active?: boolean;
  status: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CountryListRow = {
  id: number;
  sno: number;
  country_name: string;
  country_code: string;
  continent: string;
  currency: string;
  status: string;
};

export type StateRecord = {
  id: number;
  unique_id?: string;
  name: string;
  code?: string | null;
  country: number;
  country_name?: string;
  is_active: boolean;
  created_at?: string;
};

export type StateListRow = {
  id: number;
  sno: number;
  state_code: string;
  country: string;
  state_name: string;
  is_active: boolean;
};

export type CityTypeOption = {
  id: number;
  name: string;
};

export type CityRecord = {
  id: number;
  unique_id?: string;
  country: number;
  country_name?: string;
  state: number;
  state_name?: string;
  name: string;
  code?: string | null;
  pincode?: string | null;
  city_type?: number | null;
  city_type_name?: string;
  is_active: boolean;
  created_at?: string;
};

export type CityListRow = {
  id: number;
  sno: number;
  city_code: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: boolean;
};

export type TaxRecord = {
  id: number;
  unique_id?: string;
  country?: number | null;
  country_name?: string;
  name: string;
  code?: string | null;
  value: string | number;
  is_active: boolean;
  created_at?: string;
};

export type TaxListRow = {
  id: number;
  sno: number;
  tax_code: string;
  tax_name: string;
  tax_value: number;
  country: string;
  status: boolean;
};

export type CurrencyRecord = {
  id: number;
  unique_id?: string;
  country: number;
  country_name?: string;
  name: string;
  code: string;
  symbol?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerStatus = "active" | "inactive" | "blocked";
export type GSTStatus = "registered" | "unregistered" | "provisional";
export type CustomerGroup = "international" | "domestic";
export type MSMEType = "micro" | "small" | "medium" | "not_applicable";

export type PartnerContactPerson = {
  id?: number;
  unique_id?: string;
  contact_person_name: string;
  designation?: string | null;
  email?: string | null;
  mobile_no?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupplierContactPersonRecord = PartnerContactPerson & {
  landline?: string | null;
  department?: string | null;
};

export type CustomerStatutoryDetailRecord = {
  ecc_no?: string | null;
  commissionerate?: string | null;
  division?: string | null;
  range_name?: string | null;
  cst_no?: string | null;
  tin_no?: string | null;
  service_tax_no?: string | null;
  iec_code?: string | null;
  cin_no?: string | null;
  tan_no?: string | null;
};

export type SupplierStatutoryDetailRecord = CustomerStatutoryDetailRecord;

export type CustomerBankDetailRecord = {
  id?: number;
  unique_id?: string;
  bank_name: string;
  bank_address?: string | null;
  ifsc_code?: string | null;
  beneficiary_account_name: string;
  account_number: string;
  is_primary?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupplierBankDetailRecord = {
  id?: number;
  unique_id?: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  bank_address?: string | null;
  ifsc_code?: string | null;
  swift_code?: string | null;
  is_primary?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AddressRecord = {
  id?: number;
  unique_id?: string;
  address_type?: "billing" | "shipping";
  same_as_billing?: boolean;
  name?: string | null;
  address?: string | null;
  country?: number | null;
  country_name?: string;
  state?: number | null;
  state_name?: string;
  city?: number | null;
  city_name?: string;
  pincode?: string | null;
  contact_name?: string | null;
  contact_no?: string | null;
  gst_number?: string | null;
  gst_status?: GSTStatus;
  ecc_no?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DocumentRecord = {
  id: number;
  unique_id?: string;
  customer?: number;
  supplier?: number;
  document_type: string;
  file?: string;
  file_url?: string | null;
  remarks?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerRecord = {
  id: number;
  unique_id?: string;
  customer_no: string;
  customer_name: string;
  customer_group: CustomerGroup;
  customer_division?: string | null;
  currency?: number | null;
  currency_name?: string | null;
  currency_code?: string | null;
  country?: number | null;
  country_name?: string | null;
  state?: number | null;
  state_name?: string | null;
  city?: number | null;
  city_name?: string | null;
  address?: string | null;
  pincode?: string | null;
  mobile_no?: string | null;
  phone_no?: string | null;
  email?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  gst_registered?: boolean;
  gst_provisional?: boolean;
  customer_status: CustomerStatus;
  is_active: boolean;
  website?: string | null;
  remarks?: string | null;
  credit_limit?: string | number;
  payment_terms?: string | null;
  customer_since?: string | null;
  contact_persons?: PartnerContactPerson[];
  statutory_detail?: CustomerStatutoryDetailRecord | null;
  bank_details?: CustomerBankDetailRecord[];
  billing_address?: AddressRecord | null;
  shipping_address?: AddressRecord | null;
  documents?: DocumentRecord[];
  created_at?: string;
  updated_at?: string;
};

export type SupplierRecord = {
  id: number;
  unique_id?: string;
  supplier_no: string;
  supplier_name: string;
  supplier_group?: string | null;
  currency?: number | null;
  currency_name?: string | null;
  currency_code?: string | null;
  reference?: string | null;
  country?: number | null;
  country_name?: string | null;
  state?: number | null;
  state_name?: string | null;
  city?: number | null;
  city_name?: string | null;
  pincode?: string | null;
  address?: string | null;
  corporate_address?: string | null;
  mobile_no?: string | null;
  phone_no?: string | null;
  fax_no?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  gst_registration_date?: string | null;
  gst_status: GSTStatus;
  is_active: boolean;
  email?: string | null;
  website?: string | null;
  msme_type?: MSMEType;
  arn_no?: string | null;
  payment_terms?: string | null;
  credit_days?: number;
  vendor_rating?: string | number;
  remarks?: string | null;
  contact_persons?: SupplierContactPersonRecord[];
  statutory_detail?: SupplierStatutoryDetailRecord | null;
  bank_details?: SupplierBankDetailRecord[];
  billing_address?: AddressRecord | null;
  shipping_address?: AddressRecord | null;
  documents?: DocumentRecord[];
  created_at?: string;
  updated_at?: string;
};

export type CompanyRecord = {
  id: number;
  unique_id?: string;
  name: string;
  code: string;
  gst_number?: string | null;
  pan_number?: string | null;
  address?: string | null;
  country?: number | null;
  country_name?: string;
  state?: number | null;
  state_name?: string;
  city?: number | null;
  city_name?: string;
  pincode?: string | null;
  contact_person?: string | null;
  mobile_no?: string | null;
  email?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  logo?: File | string | null;
  logo_url?: string | null;
  document?: File | string | null;
  document_url?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type CompanyListRow = {
  id: number;
  sno: number;
  company_name: string;
  company_code: string;
  country: string;
  state: string;
  city: string;
  manager_name: string;
  contact_number: string;
  pincode: string;
  latitude: string | number | null;
  longitude: string | number | null;
  logo: string;
  document: string;
  status: string;
};

export type ProjectRecord = {
  id: number;
  unique_id?: string;
  company: number;
  company_name?: string;
  name: string;
  code: string;
  client_name?: string | null;
  application_type?: number | null;
  application_type_name?: string;
  capacity?: string | null;
  duration?: string | null;
  project_date: string;
  country?: number | null;
  country_name?: string;
  state?: number | null;
  state_name?: string;
  city?: number | null;
  city_name?: string;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  pincode?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  gst_reg_date?: string | null;
  contact_person?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  website?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type ProjectListRow = {
  id: number;
  sno: number;
  company_name: string;
  project_name: string;
  project_code: string;
  client_name?: string | null;
  application_type: string;
  capacity?: string | null;
  state: string;
  city: string;
  contact_person?: string | null;
  contact_number?: string | null;
  status: string;
};

export type CompanyLookup = {
  id: number;
  name: string;
  code?: string;
};

export type FormMode = "create" | "edit";
