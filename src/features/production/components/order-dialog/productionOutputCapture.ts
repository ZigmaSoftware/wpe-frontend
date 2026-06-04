import type { BOMVariantComponent, BatchWeightEntry, ProductionOutputCapture } from "@/lib/types";

export type OutputCaptureComponent = {
  id: string;
  bomComponentId?: number | null;
  itemCode: string;
  itemName: string;
  plannedWeightKg: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  toleranceKg?: number;
  sequence: number;
};

export type OutputCaptureMaterialSeed = {
  client_id: string;
  bom_component?: number | null;
  item_code: string;
  item_name: string;
  per_unit_quantity: string;
  tolerance_kg?: string;
  sequence: number;
};

const parseOutputWeightValue = (value?: string | null) => {
  const numeric = Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : 0;
};

export const mapBatchWeightEntryToOutputComponent = (
  entry: Pick<
    BatchWeightEntry,
    "bom_component" | "item_code" | "item_name" | "target_weight_grams" | "min_weight_grams" | "max_weight_grams"
  >,
  index: number,
): OutputCaptureComponent => ({
  id: String(entry.bom_component),
  bomComponentId: entry.bom_component,
  itemCode: entry.item_code,
  itemName: entry.item_name || entry.item_code,
  plannedWeightKg: parseOutputWeightValue(entry.target_weight_grams),
  minWeightKg: parseOutputWeightValue(entry.min_weight_grams),
  maxWeightKg: parseOutputWeightValue(entry.max_weight_grams),
  sequence: index + 1,
});

export const mapBomVariantComponentToOutputComponent = (component: BOMVariantComponent): OutputCaptureComponent => ({
  id: String(component.id),
  bomComponentId: component.id,
  itemCode: component.item_code,
  itemName: component.item_name || component.item_code,
  plannedWeightKg: parseOutputWeightValue(component.target_weight_grams),
  minWeightKg: parseOutputWeightValue(component.min_weight_grams),
  maxWeightKg: parseOutputWeightValue(component.max_weight_grams),
  sequence: component.sequence,
});

export const resolveOutputCaptureComponents = ({
  batchEntries,
  bomComponents,
  materials,
}: {
  batchEntries?: BatchWeightEntry[] | null;
  bomComponents?: BOMVariantComponent[] | null;
  materials: OutputCaptureMaterialSeed[];
}): OutputCaptureComponent[] => {
  if (batchEntries?.length) {
    return batchEntries.map(mapBatchWeightEntryToOutputComponent);
  }

  if (bomComponents?.length) {
    return [...bomComponents]
      .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0))
      .map(mapBomVariantComponentToOutputComponent);
  }

  return [...materials]
    .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0))
    .map((material, index) => ({
      id: material.bom_component ? String(material.bom_component) : material.client_id,
      bomComponentId: material.bom_component ?? null,
      itemCode: material.item_code,
      itemName: material.item_name || material.item_code,
      plannedWeightKg: parseOutputWeightValue(material.per_unit_quantity),
      toleranceKg:
        material.tolerance_kg !== undefined ? parseOutputWeightValue(material.tolerance_kg) : undefined,
      sequence: material.sequence ?? index + 1,
    }));
};

export type OutputComponentCapture = {
  componentId: string;
  weightKg: number;
  capturedAt: Date;
};

export type CapturedOutputDetail = {
  componentId: string;
  itemCode: string;
  itemName: string;
  weightKg: string;
  capturedAt: string;
};

export type CapturedOutputRecord = {
  id: string;
  sessionKey: string;
  scancodeId: string;
  recipeNo: string;
  capturedAt: string;
  qty: string;
  weightKg: string;
  binlot: string;
  isOutwarded: boolean;
  sourceBatchId?: number | null;
  sequence?: number | null;
  componentColumns: Array<{
    id: string;
    label: string;
  }>;
  details: CapturedOutputDetail[];
};

const sanitizeToken = (value: string) => value.replace(/[^A-Z0-9]/gi, "").toUpperCase() || "NA";

const formatTimestampToken = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export const formatOutputDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatOutputTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
};

export const formatOutputDetailDateTime = (value: string) => {
  const date = formatOutputDate(value);
  const time = formatOutputTime(value);

  if (date === "-" || time === "-") {
    return "-";
  }

  return `${date} ${time}`;
};

export const getRequiredOutputComponents = (components: OutputCaptureComponent[]) => {
  const positiveWeightComponents = components.filter((component) => component.plannedWeightKg > 0);
  return positiveWeightComponents.length > 0 ? positiveWeightComponents : components;
};

export const getMissingRequiredOutputComponents = (
  components: OutputCaptureComponent[],
  capturedWeights: Map<string, OutputComponentCapture>,
) => getRequiredOutputComponents(components).filter((component) => !capturedWeights.has(component.id));

export const areAllRequiredOutputComponentsCaptured = (
  components: OutputCaptureComponent[],
  capturedWeights: Map<string, OutputComponentCapture>,
) => getMissingRequiredOutputComponents(components, capturedWeights).length === 0;

export const buildOutputSessionKey = (
  components: OutputCaptureComponent[],
  capturedWeights: Map<string, OutputComponentCapture>,
) =>
  getRequiredOutputComponents(components)
    .map((component) => {
      const captured = capturedWeights.get(component.id);
      return `${component.id}:${captured?.weightKg.toFixed(3) ?? "missing"}:${captured?.capturedAt.toISOString() ?? "none"}`;
    })
    .join("|");

export const generateOutputScancode = ({
  productionId,
  batchNo,
  sequence,
  capturedAt,
}: {
  productionId: string;
  batchNo?: string | null;
  sequence: number;
  capturedAt: Date;
}) => {
  const primaryToken = sanitizeToken(batchNo?.trim() || productionId.trim() || "PRD");
  const itemToken = `OUT${String(sequence).padStart(3, "0")}`;

  return `BIN-${primaryToken}/ITEM-${itemToken}/REF-${formatTimestampToken(capturedAt)}`;
};

export const buildCapturedOutputRecord = ({
  components,
  capturedWeights,
  capturedAt,
  productionId,
  batchNo,
  recipeNo,
  sequence,
  binlot,
}: {
  components: OutputCaptureComponent[];
  capturedWeights: Map<string, OutputComponentCapture>;
  capturedAt: Date;
  productionId: string;
  batchNo?: string | null;
  recipeNo: string;
  sequence: number;
  binlot: string;
}): CapturedOutputRecord => {
  const requiredComponents = getRequiredOutputComponents(components);
  const totalWeight = requiredComponents.reduce(
    (sum, component) => sum + (capturedWeights.get(component.id)?.weightKg ?? 0),
    0,
  );
  const capturedAtIso = capturedAt.toISOString();

  return {
    id: `captured-output-${sequence}-${capturedAt.getTime()}`,
    sessionKey: buildOutputSessionKey(requiredComponents, capturedWeights),
    scancodeId: generateOutputScancode({
      productionId,
      batchNo,
      sequence,
      capturedAt,
    }),
    recipeNo,
    capturedAt: capturedAtIso,
    qty: totalWeight.toFixed(3),
    weightKg: totalWeight.toFixed(3),
    binlot: binlot.trim() || "-",
    isOutwarded: false,
    componentColumns: requiredComponents.map((component) => ({
      id: component.id,
      label: component.itemName,
    })),
    details: requiredComponents.map((component) => {
      const captured = capturedWeights.get(component.id);

      return {
        componentId: component.id,
        itemCode: component.itemCode,
        itemName: component.itemName,
        weightKg: (captured?.weightKg ?? 0).toFixed(3),
        capturedAt: captured?.capturedAt.toISOString() ?? capturedAtIso,
      };
    }),
  };
};

const resolveDisplayedBinlot = (capture: ProductionOutputCapture) => {
  const assignedBinlot = capture.binlot.trim();
  const sourceBatchNo = capture.source_batch_no.trim();

  if (!assignedBinlot || assignedBinlot === sourceBatchNo) {
    return "-";
  }

  return assignedBinlot;
};

export const mapPersistedOutputCaptureRecord = (capture: ProductionOutputCapture): CapturedOutputRecord => ({
  id: `persisted-output-${capture.id}`,
  sessionKey: capture.session_key,
  scancodeId: capture.scancode_id,
  recipeNo: capture.recipe_no || "—",
  capturedAt: capture.captured_at,
  qty: capture.quantity_kg,
  weightKg: capture.weight_kg,
  binlot: resolveDisplayedBinlot(capture),
  isOutwarded: capture.is_outwarded,
  sourceBatchId: capture.source_batch,
  sequence: capture.sequence,
  componentColumns: capture.component_columns.map((column) => ({
    id: String(column.id),
    label: column.label,
  })),
  details: capture.details.map((detail) => ({
    componentId: String(detail.component_id),
    itemCode: detail.item_code,
    itemName: detail.item_name,
    weightKg: detail.weight_kg,
    capturedAt: detail.captured_at,
  })),
});
