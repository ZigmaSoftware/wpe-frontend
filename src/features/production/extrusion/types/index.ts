import type { CodeMasterRecord, CodeMasterWritePayload, PaginatedResponse, TableParams } from "@/features/wpe-masters/types";

export type ExtrusionPaginatedResponse<T> = PaginatedResponse<T>;
export type ExtrusionTableParams = TableParams;

export type ToleranceType = "FIXED" | "PERCENTAGE";

export interface ExtrusionProfileConfigRecord {
  id: number;
  profile: number;
  profile_code: string;
  profile_name: string;
  section_weight_per_meter: string;
  standard_length_per_piece: string;
  default_pieces_per_packet: number;
  default_tare_weight: string;
  tolerance_type: ToleranceType;
  tolerance_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtrusionProfileConfigWritePayload {
  profile: number;
  section_weight_per_meter: number | string;
  standard_length_per_piece: number | string;
  default_pieces_per_packet: number;
  default_tare_weight: number | string;
  tolerance_type: ToleranceType;
  tolerance_value: number | string;
  is_active?: boolean;
}

export type WorkOrderStatus =
  | "DRAFT"
  | "RELEASED"
  | "IN_PRODUCTION"
  | "PACKING_IN_PROGRESS"
  | "QC_PENDING"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

export interface WorkOrderConsumableRecord {
  id: number;
  item: number;
  item_name: string;
  item_code: string;
  quantity: string;
  uom: string;
}

export interface WorkOrderConsumableInput {
  item: number;
  quantity: number | string;
  uom?: string;
}

export interface ExtrusionWorkOrderListRecord {
  id: number;
  work_order_no: string;
  profile: number;
  profile_name: string;
  profile_code: string;
  extrusion_line: number;
  extrusion_line_name: string;
  production_date: string;
  shift: string;
  planned_pieces: number;
  planned_meters: string;
  status: WorkOrderStatus;
  packet_count: number;
  created_at: string;
}

export interface ExtrusionWorkOrderDetailRecord {
  id: number;
  work_order_no: string;
  profile: number;
  profile_name: string;
  profile_code: string;
  extrusion_line: number;
  extrusion_line_name: string;
  production_date: string;
  shift: string;
  planned_pieces: number;
  planned_meters: string;
  packing_material: number;
  packing_material_name: string;
  expected_tare_weight: string;
  expected_section_weight_per_meter: string;
  tolerance_type: ToleranceType;
  tolerance_value: string;
  status: WorkOrderStatus;
  released_by: number | null;
  released_at: string | null;
  notes: string;
  consumables: WorkOrderConsumableRecord[];
  created_at: string;
  updated_at: string;
}

export interface ExtrusionWorkOrderWritePayload {
  profile: number;
  extrusion_line: number;
  production_date: string;
  shift: string;
  planned_pieces: number;
  planned_meters: number | string;
  packing_material: number;
  expected_tare_weight: number | string;
  expected_section_weight_per_meter: number | string;
  tolerance_type: ToleranceType;
  tolerance_value: number | string;
  notes?: string;
  consumables: WorkOrderConsumableInput[];
}

export type InspectionResult = "PASS" | "FAIL" | "NA";
export type OverallResult = "ACCEPTED" | "REJECTED" | "";
export type RejectionDecision = "NONE" | "REWORK" | "HOLD" | "SCRAP";

export interface ExtrusionInspectionRecord {
  id: number;
  work_order: number;
  work_order_no: string;
  batch_reference: string;
  inspected_pieces: number;
  straightness_result: InspectionResult;
  flatness_result: InspectionResult;
  section_weight_result: InspectionResult;
  length_result: InspectionResult;
  visual_result: InspectionResult;
  dimensional_result: InspectionResult;
  overall_result: OverallResult;
  rejection_decision: RejectionDecision;
  rejection_reason: string;
  remarks: string;
  inspected_by: number | null;
  inspected_by_name: string;
  inspected_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExtrusionInspectionWritePayload {
  work_order: number;
  batch_reference?: string;
  inspected_pieces: number;
  straightness_result: InspectionResult;
  flatness_result: InspectionResult;
  section_weight_result: InspectionResult;
  length_result: InspectionResult;
  visual_result: InspectionResult;
  dimensional_result?: InspectionResult;
  rejection_decision?: RejectionDecision;
  rejection_reason?: string;
  remarks?: string;
}

export type PacketStatus =
  | "CREATED"
  | "AWAITING_WEIGHT"
  | "WEIGHT_ACCEPTED"
  | "WEIGHT_REJECTED"
  | "STICKER_GENERATED"
  | "STICKER_SCANNED"
  | "QC_APPROVED"
  | "MOVED_TO_WAREHOUSE"
  | "SCRAPPED"
  | "CANCELLED";

export type WeightAttemptResult = "ACCEPTED" | "UNDERWEIGHT" | "OVERWEIGHT";
export type WeightSource = "SCALE" | "MANUAL";

export interface PacketWeightAttemptRecord {
  id: number;
  attempt_no: number;
  actual_gross_weight: string;
  result: WeightAttemptResult;
  weight_deviation: string;
  deviation_percentage: string;
  source: WeightSource;
  device_id: string;
  workstation_id: string;
  bridge_client_id: string;
  is_override: boolean;
  override_reason: string;
  weighed_by: number | null;
  weighed_by_name: string;
  weighed_at: string;
}

export interface PacketRecord {
  id: number;
  work_order: number;
  work_order_no: string;
  profile_name: string;
  inspection: number;
  packet_no: string;
  pieces: number;
  length_per_piece: string;
  total_meters: string;
  packing_material: number;
  packing_material_name: string;
  tare_weight: string;
  section_weight_per_meter: string;
  tolerance_type: ToleranceType;
  tolerance_value: string;
  expected_net_weight: string;
  expected_gross_weight: string;
  tolerance_amount: string;
  min_permissible_weight: string;
  max_permissible_weight: string;
  actual_gross_weight: string | null;
  weight_deviation: string | null;
  deviation_percentage: string | null;
  status: PacketStatus;
  qc_approved_by: number | null;
  qc_approved_at: string | null;
  qc_approval_remarks: string;
  warehouse: number | null;
  warehouse_received_by: number | null;
  warehouse_received_at: string | null;
  weight_attempts: PacketWeightAttemptRecord[];
  has_sticker: boolean;
  created_at: string;
  updated_at: string;
}

export interface PacketCreatePayload {
  work_order: number;
  inspection: number;
  pieces: number;
  length_per_piece: number | string;
  packing_material: number;
  tare_weight?: number | string | null;
}

export interface WeightCapturePayload {
  actual_gross_weight: number | string;
  source?: WeightSource;
  device_id?: string;
  workstation_id?: string;
  bridge_client_id?: string;
  is_override?: boolean;
  override_reason?: string;
}

export type StickerStatus = "ACTIVE" | "CANCELLED" | "SUPERSEDED" | "SCRAPPED";

export interface PacketStickerRecord {
  id: number;
  packet: number;
  packet_no: string;
  sticker_no: string;
  qr_payload: Record<string, unknown>;
  status: StickerStatus;
  reprint_count: number;
  last_reprint_reason: string;
  last_reprint_by: number | null;
  last_reprint_at: string | null;
  generated_by: number | null;
  generated_by_name: string;
  generated_at: string;
  scanned_by: number | null;
  scanned_by_name: string;
  scanned_at: string | null;
  cancelled_by: number | null;
  cancelled_at: string | null;
  cancellation_reason: string;
}

export type ScrapSourceStage = "QC_INSPECTION" | "PACKING" | "WEIGHT_VERIFICATION" | "SHIFT_END_QC";
export type ScrapTransactionStatus = "DRAFT" | "CONFIRMED" | "APPROVED" | "CLOSED" | "REVERSED";

export type ScrapCategoryRecord = CodeMasterRecord;
export type ScrapCategoryWritePayload = CodeMasterWritePayload;

export interface ScrapReasonRecord extends CodeMasterRecord {
  category: number;
  category_name: string;
}

export interface ScrapReasonWritePayload extends CodeMasterWritePayload {
  category: number;
}

export interface ScrapTransactionRecord {
  id: number;
  source_stage: ScrapSourceStage;
  work_order: number;
  work_order_no: string;
  profile: number;
  profile_name: string;
  inspection: number | null;
  packet: number | null;
  packet_no: string | null;
  production_date: string;
  shift: string;
  scrap_category: number;
  scrap_category_name: string;
  scrap_reason: number;
  scrap_reason_name: string;
  actual_scrap_weight: string;
  remarks: string;
  status: ScrapTransactionStatus;
  created_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  reversed_by: number | null;
  reversed_at: string | null;
  reversal_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ScrapTransactionCreatePayload {
  source_stage: ScrapSourceStage;
  work_order: number;
  inspection?: number | null;
  packet?: number | null;
  production_date: string;
  shift?: string;
  scrap_category: number;
  scrap_reason: number;
  actual_scrap_weight: number | string;
  remarks?: string;
}

export interface ShiftApprovalFilters {
  date_from?: string;
  date_to?: string;
  shift?: string;
  line?: number;
  work_order?: number;
  profile?: number;
}

export interface ShiftApprovalBulkPayload extends ShiftApprovalFilters {
  packet_ids?: number[];
  remarks?: string;
}

export interface ExtrusionKpiGroupRow {
  id: number | string;
  label: string;
  weight: string | number;
  percentage: string | number;
}

export interface ExtrusionKpiFilters {
  date_from?: string;
  date_to?: string;
  work_order?: number;
  profile?: number;
  shift?: string;
  line?: number;
  scrap_stage?: ScrapSourceStage;
  scrap_category?: number;
  scrap_reason?: number;
  cost_per_kg?: number;
}

export interface ExtrusionKpiResponse {
  accepted_production_weight: string;
  total_scrap_weight: string;
  total_production_weight: string;
  scrap_percentage: string;
  material_recovery_percentage: string;
  scrap_cost: string | null;
  first_pass_weight_acceptance_percentage: string;
  reweighing_rate_percentage: string;
  underweight_count: number;
  overweight_count: number;
  average_deviation: string;
  maximum_deviation: string;
  profile_wise: ExtrusionKpiGroupRow[];
  work_order_wise: ExtrusionKpiGroupRow[];
  shift_wise: ExtrusionKpiGroupRow[];
  line_wise: ExtrusionKpiGroupRow[];
  reason_wise: ExtrusionKpiGroupRow[];
  category_wise: ExtrusionKpiGroupRow[];
  stage_wise: ExtrusionKpiGroupRow[];
}

export interface ApiActionEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
