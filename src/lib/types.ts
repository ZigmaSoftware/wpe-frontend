export type ApiListEnvelope<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  data?: T[] | ApiPaginatedResult<T>;
  status?: string;
  message?: string;
  success?: boolean;
};

export type ApiSuccessEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiPaginatedResult<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

export type Contact = {
  id: number;
  ref_code: string;
  name: string;
  phone: string;
  email: string | null;
  category: string;
  company_name: string | null;
  gstin: string | null;
  state: string;
  address: string;
  lead_source: string;
  market_segment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentStock = {
  id: number;
  item: number;
  item_code: string;
  item_name: string;
  category?: string;
  group?: string;
  sub_group?: string;
  unit: string;
  department: string;
  quantity: string;
  created_at: string;
  updated_at: string;
};

export type StoreStockRecord = {
  id: number;
  item: number;
  item_code: string;
  item_name: string;
  category: string;
  group: string;
  sub_group: string;
  unit: string;
  quantity: string;
  created_at: string;
  updated_at: string;
};

export type StoreStockRequest = {
  id: number;
  item: number;
  item_code: string;
  item_name: string;
  category: string;
  group: string;
  sub_group: string;
  unit: string;
  quantity: string;
  request_type: "GENERAL" | "ADDITIVE";
  department: string;
  requested_for_name: string;
  request_reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_by: number;
  requested_by_username: string;
  approved_by: number | null;
  approved_by_username: string | null;
  requested_at: string;
  approved_at: string | null;
};

export type StoreTransactionRecord = {
  id: number;
  item: number;
  item_code: string;
  item_name: string;
  unit: string;
  transaction_type: string;
  quantity: string;
  reference_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Presale = {
  id: number;
  order_code: string;
  stage: string;
  sale_type: string;
  sale_category: string;
  project_name: string;
  version_no: string;
  description: string;
  lead_source: string;
  sale_contact: string;
  gp_percent: string;
  gp_value: string;
  line_of_business: string;
  sub_segment: string;
  segment_keyword: string;
  required_date: string | null;
  request_person_id: number | null;
  request_department: string;
  required_time_start: string | null;
  required_time_end: string | null;
  required_reason: string;
  internal_ref_id: number | null;
  invoice_ref_id: number | null;
  tolerance: string;
  profile_type: string;
  capex: string;
  tl_code: string;
  delivery_challan_type: string;
  indent_number: string;
  indent_date: string | null;
  indent_receiving_datetime: string | null;
  movement_description: string;
  customer_po: string;
  customer_po_date: string | null;
  destination: string;
  document_contact: string;
  previous_document_contact: string;
  base_order_id: number | null;
  base_customer_id: number | null;
  base_customer_name: string;
  base_order_date: string | null;
  activity_id: number | null;
  created_at: string;
  updated_at: string;
};

export type GrnDocumentDetails = {
  po_no?: string;
  po_date?: string;
  grn_no?: string;
  grn_date?: string;
  supplier_invoice_no?: string;
  supplier_invoice_date?: string;
  gateentry_bookno?: string;
  gateentry_bookdate?: string;
  tolerance?: string;
};

export type GrnRequirementDetails = {
  req_date?: string;
  req_person_name?: string;
  req_person_id?: string;
  req_department?: string;
  req_reason?: string;
};

export type GrnSupplierDetails = {
  supplier_id?: string;
  gstin?: string;
  contact_name?: string;
  trade_name?: string;
  contact_type?: string;
  address1?: string;
  address2?: string;
  location?: string;
  pincode?: string;
  state_name?: string;
  state_code?: string;
  country?: string;
  person_name?: string;
  phone_number?: string;
  email?: string;
  category?: string;
  segment?: string;
  sub_segment?: string;
  sales_contact_id?: string;
  currency?: string;
};

export type GrnItemLine = {
  item_id?: string;
  item_serial_number?: number | string;
  product_description?: string;
  hsn_code?: string;
  total_quantity?: string | number;
  quantity?: string | number;
  free_quantity?: string | number;
  accepted_qty?: string | number;
  rejected_qty?: string | number;
  unit?: string;
  unit_price?: string | number;
  total_amount?: string | number;
  discount?: string;
  assessable_value?: string | number;
  gst_rate?: string | number;
  igst_amount?: string | number;
  cgst_amount?: string | number;
  sgst_amount?: string | number;
  total_item_value?: string | number;
};

export type GrnValueDetails = {
  freight_charge?: string | number;
  loading_unloading_charge?: string;
  total_before_tax?: string | number;
  total_tax_amount?: string | number;
  total_after_tax?: string | number;
};

export type GrnRecord = {
  id: number;
  unique_id: string;
  grn_no: string;
  grn_date: string | null;
  supplier_id: string | null;
  trade_name: string | null;
  item_id: string | null;
  product_description: string | null;
  total_after_tax: string | number | null;
  created_at: string;
  updated_at: string;
  status: boolean;
  process_status: string;
  moved_to_qcr_at: string | null;
  moved_to_qcr_by: string | null;
  document_details: GrnDocumentDetails;
  document_requirement_details: GrnRequirementDetails;
  supplier_details: GrnSupplierDetails;
  items: GrnItemLine[];
  value_details: GrnValueDetails;
};

export type GrnListResponse = {
  status: string;
  message: string;
  count: number;
  data: GrnRecord[];
};

export type QcrRecord = {
  id: number;
  unique_id: string;
  source_grn: number;
  source_grn_data: Record<string, unknown>;
  grn_reference_no: string;
  snapshot: Record<string, unknown>;
  status: string;
  moved_to_qcr_at: string;
  moved_to_qcr_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ImportResponse = {
  created_count: number;
  updated_count?: number;
  existing_count?: number;
  stock_transactions_count?: number;
  failed_count: number;
  processed_count: number;
  errors: Array<{
    row: number;
    message: string;
    details?: Record<string, unknown>;
  }>;
  detail?: string;
};
