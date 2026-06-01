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
  source_group_key?: string | null;
  source_reference?: string | null;
  source_supplier?: string | null;
  source_line_number?: number | string | null;
  source_transaction_type?: string | null;
  source_transaction_no?: string | null;
  source_transaction_date?: string | null;
  source_created_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreStockRequest = {
  items?: Array<{
    id: number;
    item: number;
    item_code: string;
    item_name: string;
    category: string;
    group: string;
    sub_group: string;
    unit: string;
    requested_qty: string;
    approved_qty: string;
    issued_qty: string;
    available_qty: string;
    shortage_qty: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
  }>;
  id: number;
  request_no?: string | null;
  item: number | null;
  item_code: string | null;
  item_name: string | null;
  category: string | null;
  group: string | null;
  sub_group: string | null;
  unit: string | null;
  quantity: string;
  request_type: "GENERAL" | "ADDITIVE";
  department: string;
  request_date?: string | null;
  require_date?: string | null;
  require_time?: string | null;
  requested_for_name: string;
  request_reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PARTIALLY_APPROVED" | "CANCELLED";
  requested_by: number;
  requested_by_username: string;
  approved_by: number | null;
  approved_by_username: string | null;
  requested_at: string;
  approved_at: string | null;
  total_requested_qty?: string;
  total_approved_qty?: string;
  total_issued_qty?: string;
};

export type StoreTransactionRecord = {
  id: number;
  transaction_no?: string | null;
  transaction_date?: string | null;
  item: number;
  item_code: string;
  item_name: string;
  unit: string;
  transaction_type: string;
  reference_type?: string | null;
  quantity: string;
  reference_id: string;
  metadata: Record<string, unknown>;
  warehouse?: number;
  warehouse_code?: string | null;
  warehouse_name?: string | null;
  inward_qty?: string;
  outward_qty?: string;
  balance_qty?: string;
  remarks?: string | null;
  created_by?: number | null;
  created_by_username?: string | null;
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
  raw_payload?: Record<string, unknown>;
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
  remarks: string | null;
  moved_to_qcr_at: string;
  moved_to_qcr_by: string | null;
  created_at: string;
  updated_at: string;
};

// ── Presales ────────────────────────────────────────────────────────────────

export type PresalesRequestItem = {
  id: number;
  item: number;
  item_code: string;
  item_name: string;
  category: string;
  quantity: string;
  unit: string;
  unit_display: string;
  remarks: string;
  created_at: string;
};

export type PresalesRequest = {
  id: number;
  request_no: string;
  request_date: string;
  category: "STORE" | "PURCHASE";
  request_person: string;
  department: string;
  required_reason: string;
  customer_type: string;
  customer_name: string;
  remarks: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "SENT_TO_PRODUCTION";
  items: PresalesRequestItem[];
  submitted_by: number | null;
  submitted_by_username: string | null;
  submitted_at: string | null;
  approved_by: number | null;
  approved_by_username: string | null;
  approved_at: string | null;
  approval_remarks: string;
  sent_to_prod_at: string | null;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
};

export type PresalesAuditLog = {
  id: number;
  action: string;
  performed_by: number | null;
  performed_by_username: string | null;
  notes: string;
  created_at: string;
};

// ── Production ───────────────────────────────────────────────────────────────

export type ProductionMachine = {
  id: number;
  machine_code: string;
  name: string;
  machine_type: "HIGH_SPEED_MIX" | "GRANULATOR";
  applicable_stages: string;
  is_active: boolean;
  location: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type BOMVariantComponent = {
  id: number;
  item: number | null;
  product_subtype: number | null;
  source_type: "ITEM" | "PRODUCT_SUBTYPE";
  item_code: string;
  item_name: string;
  category: string;
  is_active: boolean | null;
  source_active?: boolean | null;
  target_weight_grams: string;
  min_weight_grams: string;
  max_weight_grams: string;
  sequence: number;
  is_regrind: boolean;
  unit: string;
};

export type BOMVariant = {
  id: number;
  variant_code: string;
  name: string;
  product_item: number | null;
  product_item_name: string | null;
  revision: string;
  batch_size?: string | null;
  batch_uom?: string;
  status?: "DRAFT" | "APPROVED" | "INACTIVE";
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  is_active: boolean;
  notes: string;
  component_count?: number;
  has_password?: boolean;
  components?: BOMVariantComponent[];
  created_at: string;
  updated_at: string;
};

export type BatchWeightEntry = {
  id: number;
  batch: number;
  bom_component: number;
  item: number | null;
  source_type: "ITEM" | "PRODUCT_SUBTYPE";
  item_code: string;
  item_name: string;
  category: string;
  target_weight_grams: string;
  min_weight_grams: string;
  max_weight_grams: string;
  entered_weight_grams: string | null;
  is_valid: boolean | null;
  validation_notes: string;
  source: string;
  entered_by: number | null;
  entered_by_username: string | null;
  entered_at: string;
};

export type RegrindEntry = {
  id: number;
  production_order: number;
  batch: number;
  stage: string;
  item: number;
  item_code: string;
  item_name: string;
  quantity_grams: string;
  source_lot_no: string;
  is_valid: boolean;
  validation_notes: string;
  notes: string;
  added_by: number | null;
  added_by_username: string | null;
  added_at: string;
};

export type ProductionBatch = {
  id: number;
  batch_no: string;
  production_order: number;
  bom_variant: number | null;
  bom_variant_name: string | null;
  stage: "AD" | "BL" | "GL";
  machine: number | null;
  machine_name: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  started_at: string | null;
  completed_at: string | null;
  operator: number | null;
  operator_username: string | null;
  notes: string;
  weight_entries: BatchWeightEntry[];
  regrind_entries: RegrindEntry[];
  created_at: string;
  updated_at: string;
};

export type ProductionOrder = {
  id: number;
  production_id: string;
  production_for?: string | null;
  production_type: string;
  status: "PLANNED" | "IN_PROGRESS" | "PLAN_COMPLETED" | "CLOSED";
  batch_number: string | null;
  batch_date: string | null;
  production_date: string;
  shift: string;
  planned_quantity: string;
  planned_weight: string;
  line_number: string | null;
  line_name: string | null;
  total_quantity: string;
  total_cost: string;
  material_cost: string;
  other_cost: string;
  start_date_time: string;
  end_date_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductionStageRecord = {
  id: number;
  order_id: number;
  production_id: string;
  stage: "BL" | "GL" | "PR";
  production_type: string;
  batch_no: string | null;
  production_date: string;
  shift: string;
  line_no: string;
  start_date_time: string | null;
  end_date_time: string | null;
  plan_id: string | null;
  status: string;
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
