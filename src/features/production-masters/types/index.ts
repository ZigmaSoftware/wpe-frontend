import type {
  CodeMasterRecord,
  CodeMasterWritePayload,
  LookupItem,
  PaginatedResponse,
  TableParams,
} from "@/features/wpe-masters/types";

export type ProductionLookupItem = LookupItem;
export type ProductionPaginatedResponse<T> = PaginatedResponse<T>;
export type ProductionTableParams = TableParams;

export interface ProfileCreationRecord extends CodeMasterRecord {
  profile_type: number;
  profile_type_name: string;
  profile_size: number;
  profile_size_name: string;
  color: number;
  color_name: string;
  length: string;
  weight_per_piece: string | null;
  uom: "NOS" | "METER";
  packing_type: number | null;
  packing_type_name: string | null;
}

export interface ProfileCreationWritePayload extends CodeMasterWritePayload {
  profile_type: number;
  profile_size: number;
  color: number;
  length: number | string;
  weight_per_piece?: number | string | null;
  uom: "NOS" | "METER";
  packing_type?: number | null;
  is_active?: boolean;
}

export interface ProfileSizeRecord extends CodeMasterRecord {
  width: string;
  thickness: string;
  length: string;
  uom: "MM" | "METER";
}

export interface ProfileSizeWritePayload extends CodeMasterWritePayload {
  width: number | string;
  thickness: number | string;
  length: number | string;
  uom: "MM" | "METER";
  is_active?: boolean;
}

export interface ColorCreationRecord extends CodeMasterRecord {
  color_group: "DARK" | "LIGHT" | "";
}

export interface ColorCreationWritePayload extends CodeMasterWritePayload {
  color_group?: "DARK" | "LIGHT" | "";
  is_active?: boolean;
}

export interface MachineCreationRecord extends CodeMasterRecord {
  machine_code: string;
  machine_type:
    | "HIGH_SPEED_MIX"
    | "GRANULATOR"
    | "BLENDING"
    | "GRANULATION"
    | "EXTRUSION"
    | "EXTRUDER"
    | "MIXER";
  department: number | null;
  department_name: string | null;
  capacity: string | null;
  capacity_uom: "KG" | "HOUR" | "KG_PER_HOUR" | "";
  serial_no: string;
  manufacturer: string;
  status: "AVAILABLE" | "MAINTENANCE" | "BREAKDOWN";
  applicable_stages: string;
  location: string;
  notes: string;
}

export interface MachineCreationWritePayload extends CodeMasterWritePayload {
  name: string;
  machine_type:
    | "HIGH_SPEED_MIX"
    | "GRANULATOR"
    | "BLENDING"
    | "GRANULATION"
    | "EXTRUSION"
    | "EXTRUDER"
    | "MIXER";
  department?: number | null;
  capacity?: number | string | null;
  capacity_uom?: "KG" | "HOUR" | "KG_PER_HOUR" | "";
  serial_no: string;
  manufacturer?: string;
  status?: "AVAILABLE" | "MAINTENANCE" | "BREAKDOWN";
  applicable_stages?: string;
  location?: string;
  notes?: string;
  is_active?: boolean;
}

export interface WorkCentreCreationRecord extends CodeMasterRecord {
  department: number | null;
  department_name: string | null;
  capacity: string | null;
}

export interface WorkCentreCreationWritePayload extends CodeMasterWritePayload {
  department?: number | null;
  capacity?: number | string | null;
  is_active?: boolean;
}

export interface ProductionLineRecord extends CodeMasterRecord {
  department: number | null;
  department_name: string | null;
  machine: number | null;
  machine_name: string | null;
  machine_code: string | null;
  line_capacity: string | null;
  capacity_uom: "KG" | "HOUR" | "KG_PER_HOUR" | "";
  status: "FREE" | "RUNNING" | "MAINTENANCE";
}

export interface ProductionLineWritePayload extends CodeMasterWritePayload {
  department?: number | null;
  machine?: number | null;
  line_capacity?: number | string | null;
  capacity_uom?: "KG" | "HOUR" | "KG_PER_HOUR" | "";
  status?: "FREE" | "RUNNING" | "MAINTENANCE";
  is_active?: boolean;
}

export interface BinCreationRecord extends CodeMasterRecord {
  department: number;
  department_name: string;
  capacity: string;
  capacity_uom: "KG" | "NOS";
  current_status: "FREE" | "OCCUPIED" | "HOLD" | "";
  current_material: string;
}

export interface BinCreationWritePayload extends CodeMasterWritePayload {
  department: number;
  capacity: number | string;
  capacity_uom: "KG" | "NOS";
  current_status?: "FREE" | "OCCUPIED" | "HOLD" | "";
  current_material?: string;
  is_active?: boolean;
}

export interface BagCreationRecord extends CodeMasterRecord {
  standard_weight: string;
  uom: "KG";
  department: number;
  department_name: string;
  current_status: "FREE" | "OCCUPIED" | "USED";
}

export interface BagCreationWritePayload extends CodeMasterWritePayload {
  standard_weight: number | string;
  uom: "KG";
  department: number;
  current_status: "FREE" | "OCCUPIED" | "USED";
  is_active?: boolean;
}

export interface PackingTypeRecord extends CodeMasterRecord {
  standard_pcs: number;
  standard_weight: string;
  uom: "NOS" | "KG";
}

export interface PackingTypeWritePayload extends CodeMasterWritePayload {
  standard_pcs: number;
  standard_weight: number | string;
  uom: "NOS" | "KG";
  is_active?: boolean;
}

export interface PackingMaterialRecord extends CodeMasterRecord {
  item: number;
  item_name: string;
  item_code: string;
  uom: "KG" | "NOS";
  standard_consumption: string | null;
}

export interface PackingMaterialWritePayload extends CodeMasterWritePayload {
  item: number;
  uom: "KG" | "NOS";
  standard_consumption?: number | string | null;
  is_active?: boolean;
}

