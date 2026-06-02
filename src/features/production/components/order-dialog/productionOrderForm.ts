import { z } from "zod";
import type { ProductTypeSubtypeLookupItem } from "@/features/wpe-masters/types";
import type { BOMVariantComponent, ProductionMachine } from "@/lib/types";

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
export const WORKFLOW_STAGE_VALUES = ["AD", "BL", "GL"] as const;
export const SHIFT_VALUES = ["SHIFT_1", "SHIFT_2", "SHIFT_3"] as const;
export const MATERIAL_SOURCE_TYPE_VALUES = ["ITEM", "PRODUCT_SUBTYPE"] as const;

export type ProductionOrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];
export type WorkflowStageValue = (typeof WORKFLOW_STAGE_VALUES)[number];
export type ProductionShiftValue = (typeof SHIFT_VALUES)[number];
export type MaterialSourceTypeValue = (typeof MATERIAL_SOURCE_TYPE_VALUES)[number];

export type ProductionItemOption = {
  id: number;
  item_code: string;
  item_name: string;
  unit?: string;
  _source?: "profile";
  _profile_length?: string | null;
  _profile_weight?: string | null;
};

export type NamedOption = {
  id: string;
  name: string;
  description?: string;
};

export type ProductionTypeOption = {
  id: string;
  value: string;
  label: string;
  description?: string;
};

export const ORDER_STATUS_OPTIONS: Array<{ value: ProductionOrderStatusValue; label: string; description: string }> = [
  { value: "PLANNED", label: "Planned", description: "Created and queued for execution." },
  { value: "IN_PROGRESS", label: "In Progress", description: "Order is already on the shop floor." },
  { value: "PLAN_COMPLETED", label: "Plan Completed", description: "Ready for closure review." },
  { value: "CLOSED", label: "Closed", description: "Closed production order." },
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
  _source: z.literal("profile").optional(),
  _profile_length: z.string().nullable().optional(),
  _profile_weight: z.string().nullable().optional(),
});

const planRowSchema = z.object({
  length_mts: optionalDecimalString.default(""),
  qty_mts: optionalDecimalString.default(""),
  packets: optionalIntegerString.default(""),
});

const materialRowSchema = z.object({
  client_id: z.string(),
  sequence: z.number().int().positive(),
  source_type: z.enum(MATERIAL_SOURCE_TYPE_VALUES),
  is_bom_derived: z.boolean().default(false),
  is_manual: z.boolean().default(false),
  bom_variant: z.number().nullable().default(null),
  bom_component: z.number().nullable().default(null),
  item: z.number().nullable().default(null),
  product_subtype: z.number().nullable().default(null),
  item_code: z.string().trim().min(1, "Item code is required"),
  item_name: z.string().trim().min(1, "Item name is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  per_unit_quantity: optionalDecimalString.default("0"),
  received_quantity: optionalDecimalString.default("0"),
  request_quantity: optionalDecimalString.default("0"),
  rate: optionalDecimalString.default("0"),
  notes: z.string().trim().default(""),
});

export const productionOrderFormSchema = z
  .object({
    production_id: z.string().trim().min(1, "Production ID is required"),
    status: z.enum(ORDER_STATUS_VALUES),
    production_type: z.string().trim().min(1, "Production type is required"),
    stage: z.enum(WORKFLOW_STAGE_VALUES),
    next_workflow_stage: z.enum(WORKFLOW_STAGE_VALUES),
    finished_goods: finishedGoodsSchema.nullable().default(null),
    plan_rows: z.array(planRowSchema).min(1, "Add at least one plan row"),
    production_for: z.string().trim().min(1, "Production For is required"),
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
    materials: z.object({
      selected_bom_variant_id: z.string().default(""),
      bom_multiplier: optionalDecimalString.default("1"),
      rows: z.array(materialRowSchema).default([]),
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
  })
  .superRefine((values, ctx) => {
    const productionQty = getProductionQuantity(values.plan_rows);
    const bomMultiplier = parseNumericInput(values.materials.bom_multiplier);

    if (productionQty <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Production quantity must be greater than 0.",
        path: ["plan_rows", 0, "qty_mts"],
      });
    }

    if (bomMultiplier <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "BOM multiplier must be greater than 0.",
        path: ["materials", "bom_multiplier"],
      });
    }

    const duplicateKeys = new Set<string>();

    values.materials.rows.forEach((row, index) => {
      const sourceKey =
        row.source_type === "PRODUCT_SUBTYPE" && row.product_subtype
          ? `PRODUCT_SUBTYPE:${row.product_subtype}`
          : row.item
            ? `ITEM:${row.item}`
            : `CODE:${row.item_code}`;

      if (duplicateKeys.has(sourceKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate material row is not allowed.",
          path: ["materials", "rows", index, "item_code"],
        });
      }
      duplicateKeys.add(sourceKey);

      const perUnitQty = parseNumericInput(row.per_unit_quantity);
      const receivedQty = parseNumericInput(row.received_quantity);
      const requestQty = parseNumericInput(row.request_quantity);
      const rate = parseNumericInput(row.rate);
      const requiredQty = perUnitQty * productionQty * bomMultiplier;
      const remainingQty = Math.max(requiredQty - receivedQty, 0);

      if (requiredQty < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required quantity cannot be negative.",
          path: ["materials", "rows", index, "per_unit_quantity"],
        });
      }

      if (rate < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rate cannot be negative.",
          path: ["materials", "rows", index, "rate"],
        });
      }

      if (requestQty > remainingQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Request quantity cannot exceed remaining quantity.",
          path: ["materials", "rows", index, "request_quantity"],
        });
      }
    });
  });

export type ProductionOrderFormValues = z.infer<typeof productionOrderFormSchema>;
export type ProductionOrderMaterialRowForm = ProductionOrderFormValues["materials"]["rows"][number];

export type ProductionMaterialComputedRow = ProductionOrderMaterialRowForm & {
  bom_quantity: number;
  required_quantity: number;
  remaining_quantity: number;
  amount: number;
};

export type CreateProductionOrderPayload = {
  production_id: string;
  production_for?: string;
  production_type: string;
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
  material_cost?: string;
  total_cost?: string;
  materials?: Array<{
    sequence: number;
    source_type: MaterialSourceTypeValue;
    is_bom_derived: boolean;
    is_manual: boolean;
    bom_variant: number | null;
    bom_component: number | null;
    item: number | null;
    product_subtype: number | null;
    item_code: string;
    item_name: string;
    unit: string;
    per_unit_quantity: string;
    bom_quantity: string;
    required_quantity: string;
    received_quantity: string;
    remaining_quantity: string;
    request_quantity: string;
    rate: string;
    amount: string;
    notes: string;
  }>;
};

export const createEmptyPlanRow = (): ProductionOrderFormValues["plan_rows"][number] => ({
  length_mts: "",
  qty_mts: "",
  packets: "",
});

const createMaterialRowId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `material-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createEmptyMaterialsState = (): ProductionOrderFormValues["materials"] => ({
  selected_bom_variant_id: "",
  bom_multiplier: "1",
  rows: [],
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
    production_type: "",
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
    materials: createEmptyMaterialsState(),
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

export const getProductionQuantity = (rows: ProductionOrderFormValues["plan_rows"]) => sumPlanMetric(rows, "qty_mts");

export const createMaterialRowFromBomComponent = (
  component: BOMVariantComponent,
  sequence: number,
  bomVariantId: number,
): ProductionOrderMaterialRowForm => ({
  client_id: `bom-${bomVariantId}-${component.id}`,
  sequence,
  source_type: component.source_type,
  is_bom_derived: true,
  is_manual: false,
  bom_variant: bomVariantId,
  bom_component: component.id,
  item: component.item,
  product_subtype: component.product_subtype,
  item_code: component.item_code,
  item_name: component.item_name,
  unit: component.unit || "g",
  per_unit_quantity: component.target_weight_grams || "0",
  received_quantity: "0",
  request_quantity: "0",
  rate: "0",
  notes: "",
});

export const createMaterialRowFromItem = (
  item: ProductTypeSubtypeLookupItem,
  sequence: number,
  selectedBomVariantId?: number | null,
): ProductionOrderMaterialRowForm => ({
  client_id: createMaterialRowId(),
  sequence,
  source_type: "PRODUCT_SUBTYPE",
  is_bom_derived: false,
  is_manual: true,
  bom_variant: selectedBomVariantId ?? null,
  bom_component: null,
  item: null,
  product_subtype: item.id,
  item_code: item.code,
  item_name: item.name,
  unit: "g",
  per_unit_quantity: "0",
  received_quantity: "0",
  request_quantity: "0",
  rate: "0",
  notes: "",
});

export const createMaterialRowFromSubtype = createMaterialRowFromItem;

export const getMaterialRowIdentity = (row: Pick<ProductionOrderMaterialRowForm, "source_type" | "item" | "product_subtype" | "item_code">) => {
  if (row.source_type === "PRODUCT_SUBTYPE" && row.product_subtype) {
    return `PRODUCT_SUBTYPE:${row.product_subtype}`;
  }
  if (row.item) {
    return `ITEM:${row.item}`;
  }
  return `CODE:${row.item_code}`;
};

export const computeMaterialRow = (
  row: ProductionOrderMaterialRowForm,
  productionQty: number,
  bomMultiplier: number,
): ProductionMaterialComputedRow => {
  const perUnitQuantity = parseNumericInput(row.per_unit_quantity);
  const receivedQuantity = parseNumericInput(row.received_quantity);
  const rate = parseNumericInput(row.rate);
  const bomQuantity = perUnitQuantity * productionQty * bomMultiplier;
  const requiredQuantity = bomQuantity;
  const remainingQuantity = Math.max(requiredQuantity - receivedQuantity, 0);
  const amount = requiredQuantity * rate;

  return {
    ...row,
    bom_quantity: bomQuantity,
    required_quantity: requiredQuantity,
    remaining_quantity: remainingQuantity,
    amount,
  };
};

export const formatNumberInputValue = (value: number, minimumFractionDigits = 0, maximumFractionDigits = 3) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

export type MaterialPlanItem = {
  id?: number | null;
  sequence?: number;
  source_type?: string;
  is_bom_derived?: boolean;
  is_manual?: boolean;
  bom_variant?: number | null;
  bom_component?: number | null;
  item?: number | null;
  product_subtype?: number | null;
  item_code?: string;
  item_name?: string;
  unit?: string;
  per_unit_quantity?: string | number;
  rate?: string | number;
  notes?: string;
};

export type ProductionOrderDetail = {
  id: number;
  production_id: string;
  production_for?: string | null;
  production_type?: string;
  status?: string;
  batch_number?: string | null;
  production_date?: string;
  shift?: string;
  planned_quantity?: string;
  line_number?: string | null;
  line_name?: string | null;
  material_plans?: MaterialPlanItem[];
};

export const mapOrderDetailToFormValues = (
  order: ProductionOrderDetail,
  machines: Array<{ id: number; machine_code?: string | null; name: string }>,
): ProductionOrderFormValues => {
  const defaults = createProductionOrderDefaultValues();
  const shiftValue = SHIFT_OPTIONS.find((o) => o.apiLabel === order.shift)?.value ?? "SHIFT_1";
  const qty = parseFloat(String(order.planned_quantity ?? "0")) || 0;
  const machine = machines.find(
    (m) =>
      (order.line_number && m.machine_code === order.line_number) ||
      (order.line_name && m.name === order.line_name),
  );

  const materialRows: ProductionOrderFormValues["materials"]["rows"] = (order.material_plans ?? []).map(
    (plan, index) => ({
      client_id: `edit-${plan.id ?? index}`,
      sequence: plan.sequence ?? index + 1,
      source_type: (plan.source_type as MaterialSourceTypeValue) ?? "ITEM",
      is_bom_derived: plan.is_bom_derived ?? false,
      is_manual: plan.is_manual ?? true,
      bom_variant: plan.bom_variant ?? null,
      bom_component: plan.bom_component ?? null,
      item: plan.item ?? null,
      product_subtype: plan.product_subtype ?? null,
      item_code: plan.item_code ?? "",
      item_name: plan.item_name ?? "",
      unit: plan.unit ?? "g",
      per_unit_quantity: String(plan.per_unit_quantity ?? "0"),
      received_quantity: "0",
      request_quantity: "0",
      rate: String(plan.rate ?? "0"),
      notes: plan.notes ?? "",
    }),
  );

  return {
    ...defaults,
    production_id: order.production_id,
    status: (order.status as ProductionOrderStatusValue) ?? "PLANNED",
    production_for: order.production_for?.trim() || "",
    production_type: order.production_type?.trim() || defaults.production_type,
    plan_rows: [{ length_mts: "", qty_mts: qty > 0 ? qty.toFixed(3) : "", packets: "" }],
    resources: {
      ...defaults.resources,
      production_date: order.production_date ?? defaults.resources.production_date,
      shift: shiftValue,
      line_machine_id: machine ? String(machine.id) : "",
    },
    details: {
      ...defaults.details,
      batch_auto: order.batch_number?.trim() || defaults.details.batch_auto,
    },
    materials: { selected_bom_variant_id: "", bom_multiplier: "1", rows: materialRows },
  };
};

export const toProductionOrderPayload = (
  values: ProductionOrderFormValues,
  machines: ProductionMachine[],
): CreateProductionOrderPayload => {
  const selectedMachine = machines.find((machine) => String(machine.id) === values.resources.line_machine_id);
  const plannedQuantity = getProductionQuantity(values.plan_rows);
  const planId = values.base_order.base_plan_id.trim();
  const bomMultiplier = parseNumericInput(values.materials.bom_multiplier) || 1;
  const batchNumber = values.details.batch_auto.trim();
  const computedMaterialRows = values.materials.rows.map((row) => computeMaterialRow(row, plannedQuantity, bomMultiplier));
  const materialCost = computedMaterialRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    production_id: values.production_id.trim(),
    production_for: values.production_for.trim(),
    production_type: values.production_type.trim(),
    status: values.status,
    production_date: values.resources.production_date,
    shift: getShiftOption(values.resources.shift).apiLabel,
    planned_quantity: plannedQuantity.toFixed(3),
    planned_weight: "0.000",
    start_date_time: buildActualStartDateTimeValue(values.resources.production_date, values.resources.shift),
    batch_number:
      batchNumber && batchNumber.toLowerCase() !== "generated on save"
        ? batchNumber
        : "",
    line_name: selectedMachine?.name ?? "",
    line_number: selectedMachine?.machine_code ?? "",
    material_cost: materialCost.toFixed(2),
    total_cost: materialCost.toFixed(2),
    materials: computedMaterialRows.map((row) => ({
      sequence: row.sequence,
      source_type: row.source_type,
      is_bom_derived: row.is_bom_derived,
      is_manual: row.is_manual,
      bom_variant: row.bom_variant,
      bom_component: row.bom_component,
      item: row.item,
      product_subtype: row.product_subtype,
      item_code: row.item_code,
      item_name: row.item_name,
      unit: row.unit,
      per_unit_quantity: parseNumericInput(row.per_unit_quantity).toFixed(3),
      bom_quantity: row.bom_quantity.toFixed(3),
      required_quantity: row.required_quantity.toFixed(3),
      received_quantity: parseNumericInput(row.received_quantity).toFixed(3),
      remaining_quantity: row.remaining_quantity.toFixed(3),
      request_quantity: parseNumericInput(row.request_quantity).toFixed(3),
      rate: parseNumericInput(row.rate).toFixed(3),
      amount: row.amount.toFixed(2),
      notes: row.notes,
    })),
    ...(planId ? { plan_id: planId } : {}),
  };
};
