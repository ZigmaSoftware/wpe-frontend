export type OutputCaptureComponent = {
  id: string;
  itemCode: string;
  itemName: string;
  plannedWeightKg: number;
  toleranceKg?: number;
  sequence: number;
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
