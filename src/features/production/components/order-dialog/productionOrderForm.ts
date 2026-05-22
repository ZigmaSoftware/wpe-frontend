import { z } from "zod";
import type { ProductionMachine } from "@/lib/types";

export const PRODUCTION_ORDER_TABS = [
  { value: "general", label: "General" },
  { value: "materials", label: "Materials" },
  { value: "stages", label: "Stages" },
  { value: "output", label: "Output" },
  { value: "scrap", label: "Scrap" },
  { value: "cost", label: "Cost" },
  { value: "resources", label: "Resources" },
] as const;

export type ProductionDialogTab = (typeof PRODUCTION_ORDER_TABS)[number]["value"];

export const ORDER_STATUS_VALUES = ["PLANNED", "IN_PROGRESS", "PLAN_COMPLETED", "CLOSED"] as const;
export const PRODUCTION_TYPE_VALUES = ["RECYCLING_PRODUCTION", "BLENDING_PRODUCTION", "COMPOUNDING"] as const;
export const WORKFLOW_STAGE_VALUES = ["AD", "BL", "GL"] as const;
export const SHIFT_VALUES = ["SHIFT_1", "SHIFT_2", "SHIFT_3"] as const;

export type ProductionOrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];
export type ProductionTypeValue = (typeof PRODUCTION_TYPE_VALUES)[number];
export type WorkflowStageValue = (typeof WORKFLOW_STAGE_VALUES)[number];
export type ProductionShiftValue = (typeof SHIFT_VALUES)[number];

export type ProductionItemOption = {
  id: number;
  item_code: string;
  item_name: string;
  unit?: string;
};

export type NamedOption = {
  id: string;
  name: string;
  description?: string;
};

export const ORDER_STATUS_OPTIONS: Array<{ value: ProductionOrderStatusValue; label: string; description: string }> = [
  { value: "PLANNED", label: "Planned", description: "Created and queued for execution." },
  { value: "IN_PROGRESS", label: "In Progress", description: "Order is already on the shop floor." },
  { value: "PLAN_COMPLETED", label: "Plan Completed", description: "Ready for closure review." },
  { value: "CLOSED", label: "Closed", description: "Closed production order." },
];

export const PRODUCTION_TYPE_OPTIONS: Array<{ value: ProductionTypeValue; label: string; description: string }> = [
  { value: "RECYCLING_PRODUCTION", label: "Recycling Production", description: "WPE recycling workflow." },
  { value: "BLENDING_PRODUCTION", label: "Blending Production", description: "Blend and compound preparation." },
  { value: "COMPOUNDING", label: "Compounding", description: "Compounding production route." },
];

export const WORKFLOW_STAGE_OPTIONS: Array<{ value: WorkflowStageValue; label: string; description: string }> = [
  { value: "AD", label: "AD · Material Prep", description: "Additive and raw mix preparation." },
  { value: "BL", label: "BL · Blending", description: "Blend setup and processing." },
  { value: "GL", label: "GL · Granulation", description: "Granulation and downstream conversion." },
];

export const SHIFT_OPTIONS: Array<{
  value: ProductionShiftValue;
  label: string;
  timeRange: string;
  apiLabel: string;
  startTime: string;
}> = [
  {
    value: "SHIFT_1",
    label: "Shift 1",
    timeRange: "6:00am - 2:00pm",
    apiLabel: "Shift 1 (6:00 am - 2:00 pm)",
    startTime: "06:00",
  },
  {
    value: "SHIFT_2",
    label: "Shift 2",
    timeRange: "2:00pm - 10:00pm",
    apiLabel: "Shift 2 (2:00 pm - 10:00 pm)",
    startTime: "14:00",
  },
  {
    value: "SHIFT_3",
    label: "Shift 3",
    timeRange: "10:00pm - 6:00am",
    apiLabel: "Shift 3 (10:00 pm - 6:00 am)",
    startTime: "22:00",
  },
];

const optionalDecimalString = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+(\.\d{1,3})?$/.test(value), "Enter a valid number");

const optionalIntegerString = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "Enter a whole number");

const finishedGoodsSchema = z.object({
  id: z.number(),
  item_code: z.string(),
  item_name: z.string(),
  unit: z.string().optional(),
});

const planRowSchema = z.object({
  length_mts: optionalDecimalString.default(""),
  qty_mts: optionalDecimalString.default(""),
  packets: optionalIntegerString.default(""),
});

export const productionOrderFormSchema = z.object({
  production_id: z.string().trim().min(1, "Production ID is required"),
  status: z.enum(ORDER_STATUS_VALUES),
  production_type: z.enum(PRODUCTION_TYPE_VALUES),
  stage: z.enum(WORKFLOW_STAGE_VALUES),
  next_workflow_stage: z.enum(WORKFLOW_STAGE_VALUES),
  finished_goods: finishedGoodsSchema.nullable().default(null),
  plan_rows: z.array(planRowSchema).min(1, "Add at least one plan row"),
  production_for: z.string().trim().default(""),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").default(""),
  base_order: z.object({
    base_plan_id: z.string().default(""),
    base_order_id: z.string().default(""),
    base_customer_id: z.string().default(""),
    base_customer_name: z.string().default(""),
    base_order_date: z.string().default(""),
  }),
  resources: z.object({
    production_date: z.string().min(1, "Production date is required"),
    shift: z.enum(SHIFT_VALUES),
    production_facility: z.string().min(1, "Production facility is required"),
    work_center: z.string().min(1, "Work center is required"),
    line_machine_id: z.string().default(""),
    shift_incharge: z.string().min(1, "Shift incharge is required"),
  }),
  custom_specs: z.object({
    material_type: z.string().trim().default(""),
    cbhr_inward_qty: optionalDecimalString.default(""),
    cbhr_ok_qty: optionalDecimalString.default(""),
    cbhr_scrap_qty: optionalDecimalString.default(""),
    yet_to_pack_mtrs: optionalDecimalString.default(""),
    yet_to_pack_pcs: optionalIntegerString.default(""),
  }),
  details: z.object({
    batch_auto: z.string().default("Generated on save"),
    actual_start_time: z.string().default(""),
    actual_end_time: z.string().default("Captured when the order is completed"),
  }),
});

export type ProductionOrderFormValues = z.infer<typeof productionOrderFormSchema>;

export type CreateProductionOrderPayload = {
  production_id: string;
  production_type: ProductionTypeValue;
  status: ProductionOrderStatusValue;
  production_date: string;
  shift: string;
  planned_quantity: string;
  planned_weight: string;
  start_date_time: string;
  batch_number: string;
  line_name?: string;
  line_number?: string;
  plan_id?: string;
};

export const createEmptyPlanRow = (): ProductionOrderFormValues["plan_rows"][number] => ({
  length_mts: "",
  qty_mts: "",
  packets: "",
});

const today = () => new Date().toISOString().slice(0, 10);

export const getShiftOption = (value: ProductionShiftValue) =>
  SHIFT_OPTIONS.find((option) => option.value === value) ?? SHIFT_OPTIONS[0];

export const buildActualStartDateTimeValue = (productionDate: string, shift: ProductionShiftValue) => {
  const shiftOption = getShiftOption(shift);
  return `${productionDate}T${shiftOption.startTime}:00`;
};

export const formatDateTimeLabel = (value?: string) => {
  if (!value) {
    return "Generated on save";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const createProductionOrderDefaultValues = (): ProductionOrderFormValues => {
  const productionDate = today();

  return {
    production_id: "",
    status: "PLANNED",
    production_type: "RECYCLING_PRODUCTION",
    stage: "AD",
    next_workflow_stage: "BL",
    finished_goods: null,
    plan_rows: [createEmptyPlanRow()],
    production_for: "",
    notes: "",
    base_order: {
      base_plan_id: "",
      base_order_id: "",
      base_customer_id: "",
      base_customer_name: "",
      base_order_date: "",
    },
    resources: {
      production_date: productionDate,
      shift: "SHIFT_1",
      production_facility: "",
      work_center: "",
      line_machine_id: "",
      shift_incharge: "",
    },
    custom_specs: {
      material_type: "",
      cbhr_inward_qty: "",
      cbhr_ok_qty: "",
      cbhr_scrap_qty: "",
      yet_to_pack_mtrs: "",
      yet_to_pack_pcs: "",
    },
    details: {
      batch_auto: "Generated on save",
      actual_start_time: formatDateTimeLabel(buildActualStartDateTimeValue(productionDate, "SHIFT_1")),
      actual_end_time: "Captured when the order is completed",
    },
  };
};

export const parseNumericInput = (value?: string | null) => {
  if (!value?.trim()) {
    return 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const sumPlanMetric = (
  rows: ProductionOrderFormValues["plan_rows"],
  field: keyof ProductionOrderFormValues["plan_rows"][number],
) => rows.reduce((total, row) => total + parseNumericInput(row[field]), 0);

export const toProductionOrderPayload = (
  values: ProductionOrderFormValues,
  machines: ProductionMachine[],
): CreateProductionOrderPayload => {
  const selectedMachine = machines.find((machine) => String(machine.id) === values.resources.line_machine_id);
  const plannedQuantity = sumPlanMetric(values.plan_rows, "qty_mts");
  const planId = values.base_order.base_plan_id.trim();

  return {
    production_id: values.production_id.trim(),
    production_type: values.production_type,
    status: values.status,
    production_date: values.resources.production_date,
    shift: getShiftOption(values.resources.shift).apiLabel,
    planned_quantity: plannedQuantity.toFixed(3),
    planned_weight: "0.000",
    start_date_time: buildActualStartDateTimeValue(values.resources.production_date, values.resources.shift),
    batch_number: "",
    line_name: selectedMachine?.name ?? "",
    line_number: selectedMachine?.machine_code ?? "",
    ...(planId ? { plan_id: planId } : {}),
  };
};
