/**
 * Production Module Types
 * Defines all TypeScript interfaces for the production system
 */

/**
 * Production Order Status
 */
export enum ProductionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  PLAN_COMPLETED = "PLAN_COMPLETED",
  CLOSED = "CLOSED",
  PLANNED = "PLANNED",
}

/**
 * Production Type
 */
export enum ProductionType {
  RECYCLING_PRODUCTION = "RECYCLING_PRODUCTION",
  BLENDING_PRODUCTION = "BLENDING_PRODUCTION",
  COMPOUNDING = "COMPOUNDING",
}

/**
 * Material Movement Type
 */
export enum MaterialMovementType {
  RAW_MATERIAL_IN = "RAW_MATERIAL_IN",
  OUTPUT_IN_PRODUCTION = "OUTPUT_IN_PRODUCTION",
  RETURN_TO_MC = "RETURN_TO_MC",
  OUTPUT_TO_WAREHOUSE = "OUTPUT_TO_WAREHOUSE",
}

/**
 * Material Movement Status
 */
export enum MaterialMovementStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
}

/**
 * Transaction Type
 */
export enum TransactionType {
  INWARD = "INWARD",
  OUTWARD = "OUTWARD",
}

/**
 * Production Order Model
 */
export interface ProductionOrder {
  id: number;
  production_id: string;
  production_type: ProductionType;
  status: ProductionStatus;
  batch_number: string | null;
  batch_date: string | null;
  production_date: string;
  shift: string;
  plan_id: string | null;
  planned_quantity: number;
  planned_weight: number;
  line_number: string | null;
  line_name: string | null;
  total_quantity: number;
  other_cost: number;
  material_cost: number;
  total_cost: number;
  start_date_time: string;
  end_date_time: string | null;
  cost_per_unit: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Material Movement Model
 */
export interface MaterialMovement {
  id: number;
  movement_type: MaterialMovementType;
  item_id: string | null;
  item_name: string;
  item_code: string | null;
  source_location: string;
  destination_location: string;
  quantity: number;
  unit: string;
  warehouse: string | null;
  bin_number: string | null;
  status: MaterialMovementStatus;
  movement_date: string;
}

/**
 * Production Transaction Model
 */
export interface ProductionTransaction {
  id: number;
  transaction_id: string;
  transaction_type: TransactionType;
  transaction_date: string;
  transaction_time: string | null;
  item_id: string;
  item_number: string;
  item_name: string;
  item_code: string | null;
  quantity_in: number;
  quantity_out: number;
  unit: string;
  warehouse: string | null;
  bin_location: string | null;
  reference_id: string | null;
  remarks: string | null;
}

/**
 * Production Summary Model
 */
export interface ProductionSummary {
  id: number;
  total_raw_material_cost: number;
  total_other_cost: number;
  total_production_cost: number;
  total_input_quantity: number;
  total_output_quantity: number;
  total_waste_quantity: number;
  yield_percentage: number;
  cost_per_unit: number;
  is_finalized: boolean;
}

/**
 * Production Order Details (Full Response from API)
 */
export interface ProductionOrderDetail extends ProductionOrder {
  material_movements: MaterialMovement[];
  transactions: ProductionTransaction[];
  summary: ProductionSummary | null;
}

/**
 * API Request/Response Types
 */
export interface ProductionOrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductionOrder[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductionOrderFilters extends PaginationParams {
  status?: ProductionStatus;
  production_type?: ProductionType;
  batch_number?: string;
  production_date?: string;
  search?: string;
}

/**
 * Cost Breakdown
 */
export interface CostBreakdown {
  production_id: string;
  total_quantity: number;
  material_cost: number;
  other_cost: number;
  total_cost: number;
  cost_per_unit: number;
}

/**
 * Material Flow DTO for UI
 */
export interface MaterialFlowCard {
  id: string;
  type: MaterialMovementType;
  source: {
    name: string;
    omfsId: string;
    docId: string;
  };
  destination: {
    name: string;
    omfsId: string;
    docId: string;
  };
  quantity: number;
  unit: string;
}

export interface MaterialMovementFilters extends PaginationParams {
  movement_type?: MaterialMovementType;
  status?: MaterialMovementStatus;
  production_order?: string;
}

export interface ProductionTransactionFilters extends PaginationParams {
  transaction_type?: TransactionType;
  transaction_date?: string;
  production_order?: string;
}

export interface ProductionSummaryFilters extends PaginationParams {
  is_finalized?: boolean;
  production_order?: string;
}
