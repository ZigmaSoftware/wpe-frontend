import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, ChevronDown, ChevronRight, PackageCheck, Scale } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useScannerInput } from "@/hooks/useScannerInput";
import { useWeightStream } from "@/hooks/useWeightStream";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  areAllRequiredOutputComponentsCaptured,
  buildCapturedOutputRecord,
  formatOutputDate,
  formatOutputDetailDateTime,
  formatOutputTime,
  getMissingRequiredOutputComponents,
  getRequiredOutputComponents,
  type CapturedOutputRecord,
  type OutputCaptureComponent,
  type OutputComponentCapture,
} from "./productionOutputCapture";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import { useBomComponents } from "./useBomComponents";

const TOLERANCE_PERCENT = 0.5;

type DemoMaterial = {
  client_id: string;
  item_code: string;
  item_name: string;
  per_unit_quantity: string;
  tolerance_kg?: string;
  sequence: number;
};

const DEMO_MATERIALS: DemoMaterial[] = [
  { client_id: "demo-1", item_code: "WGO:2001", item_name: "Wood Powder", per_unit_quantity: "-0.40", tolerance_kg: "0.40", sequence: 1 },
  { client_id: "demo-2", item_code: "HOP:2020", item_name: "HDPE Chips (White)", per_unit_quantity: "22.900", sequence: 2 },
  { client_id: "demo-3", item_code: "CAL:2001", item_name: "Calcium carbonate", per_unit_quantity: "4.600", sequence: 3 },
  { client_id: "demo-4", item_code: "COU:2003", item_name: "Coupling agent", per_unit_quantity: "3.500", sequence: 4 },
  { client_id: "demo-5", item_code: "LUB:2007", item_name: "Lubricant", per_unit_quantity: "1.100", sequence: 5 },
  { client_id: "demo-6", item_code: "REG:2019", item_name: "Regrind Material - HDPE", per_unit_quantity: "22.900", sequence: 6 },
  { client_id: "demo-7", item_code: "ANT:2005", item_name: "Antioxidant Agent", per_unit_quantity: "0.140", sequence: 7 },
  { client_id: "demo-8", item_code: "REG:2025", item_name: "Regrind Material - LDPE", per_unit_quantity: "9.200", sequence: 8 },
];

type OutputMaterialRow = ProductionOrderFormValues["materials"]["rows"][number] | DemoMaterial;

type ProductionOutputTabProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const parseNumericValue = (value?: string | null) => {
  const numeric = Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : 0;
};

const ProductionOutputTab = ({ form }: ProductionOutputTabProps) => {
  const formMaterials = form.watch("materials.rows");
  const selectedBomVariantId = form.watch("materials.selected_bom_variant_id");
  const productionId = form.watch("production_id");
  const batchAuto = form.watch("details.batch_auto");

  const materials: OutputMaterialRow[] = formMaterials.length > 0 ? formMaterials : DEMO_MATERIALS;
  const outputComponents = useMemo<OutputCaptureComponent[]>(
    () =>
      [...materials]
        .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0))
        .map((material, index) => ({
          id: material.client_id,
          itemCode: material.item_code,
          itemName: material.item_name || material.item_code,
          plannedWeightKg: parseNumericValue(material.per_unit_quantity),
          toleranceKg:
            "tolerance_kg" in material && material.tolerance_kg !== undefined
              ? parseNumericValue(material.tolerance_kg)
              : undefined,
          sequence: material.sequence ?? index + 1,
        })),
    [materials],
  );

  const requiredComponents = useMemo(
    () => getRequiredOutputComponents(outputComponents),
    [outputComponents],
  );

  const bomVariantId = useMemo(() => {
    if (selectedBomVariantId) {
      return Number(selectedBomVariantId);
    }

    const firstAssignedVariant = formMaterials.find((row) => row.bom_variant !== null)?.bom_variant;
    return typeof firstAssignedVariant === "number" ? firstAssignedVariant : null;
  }, [formMaterials, selectedBomVariantId]);

  const bomVariantQuery = useBomComponents(bomVariantId);
  const recipeNo = bomVariantQuery.data?.variant_code?.trim() || productionId.trim() || "—";
  const binlotValue =
    batchAuto.trim() && batchAuto.trim().toLowerCase() !== "generated on save"
      ? batchAuto.trim()
      : "-";

  const [activeIndex, setActiveIndex] = useState(0);
  const [capturedWeights, setCapturedWeights] = useState<Map<string, OutputComponentCapture>>(new Map());
  const [capturedOutputs, setCapturedOutputs] = useState<CapturedOutputRecord[]>([]);
  const [expandedOutputIds, setExpandedOutputIds] = useState<Record<string, boolean>>({});
  const capturedSessionKeysRef = useRef(new Set<string>());
  const { processScan } = useScannerInput();

  useEffect(() => {
    setActiveIndex((current) => {
      if (outputComponents.length === 0) {
        return 0;
      }

      return current >= outputComponents.length ? outputComponents.length - 1 : current;
    });
  }, [outputComponents.length]);

  useEffect(() => {
    setCapturedWeights((current) => {
      const allowedIds = new Set(outputComponents.map((component) => component.id));
      const next = new Map(
        Array.from(current.entries()).filter(([componentId]) => allowedIds.has(componentId)),
      );

      return next.size === current.size ? current : next;
    });
  }, [outputComponents]);

  const activeComponent = outputComponents[activeIndex] ?? null;
  const stdWeight = activeComponent?.plannedWeightKg ?? 0;
  const displayStdWeight = Math.abs(stdWeight);
  const toleranceKg = activeComponent?.toleranceKg ?? 0;
  const minWeight =
    displayStdWeight > 0
      ? toleranceKg > 0
        ? +(displayStdWeight - toleranceKg).toFixed(3)
        : +(displayStdWeight * (1 - TOLERANCE_PERCENT / 100)).toFixed(3)
      : 0;
  const maxWeight =
    displayStdWeight > 0
      ? toleranceKg > 0
        ? +(displayStdWeight + toleranceKg).toFixed(3)
        : +(displayStdWeight * (1 + TOLERANCE_PERCENT / 100)).toFixed(3)
      : 0;

  const { weight, connected, tare } = useWeightStream({
    deviceId: "output-scale-1",
    tolerancePercent: TOLERANCE_PERCENT,
    enabled: true,
  });

  const tolerance =
    displayStdWeight > 0 && weight
      ? {
          withinTolerance: weight.value >= minWeight && weight.value <= maxWeight,
          deviation: +(weight.value - displayStdWeight).toFixed(3),
        }
      : null;

  const canCapture = !!(weight?.stable && tolerance?.withinTolerance === true && activeComponent);
  const totalCaptured = Array.from(capturedWeights.values()).reduce((sum, capture) => sum + capture.weightKg, 0);
  const missingComponents = useMemo(
    () => getMissingRequiredOutputComponents(outputComponents, capturedWeights),
    [capturedWeights, outputComponents],
  );
  const allRequiredCaptured = useMemo(
    () => areAllRequiredOutputComponentsCaptured(outputComponents, capturedWeights),
    [capturedWeights, outputComponents],
  );

  const handleCapture = useCallback(() => {
    if (!canCapture || !weight || !activeComponent) {
      return;
    }

    setCapturedWeights((current) => {
      const next = new Map(current);
      next.set(activeComponent.id, {
        componentId: activeComponent.id,
        weightKg: weight.value,
        capturedAt: weight.timestamp,
      });

      const nextIndex = outputComponents.findIndex(
        (component, index) => index > activeIndex && !next.has(component.id),
      );
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }

      return next;
    });
  }, [activeComponent, activeIndex, canCapture, outputComponents, weight]);

  const handleFinalCapture = useCallback(() => {
    if (requiredComponents.length === 0) {
      toast.error("No recipe components available for final capture.");
      return;
    }

    if (!allRequiredCaptured) {
      const missingLabel = missingComponents
        .slice(0, 3)
        .map((component) => component.itemName)
        .join(", ");
      const remainingCount = missingComponents.length - Math.min(missingComponents.length, 3);
      const suffix = remainingCount > 0 ? ` +${remainingCount} more` : "";

      toast.error(`Capture all recipe components before final capture. Missing: ${missingLabel}${suffix}`);
      return;
    }

    const capturedAt = new Date();
    const nextSequence = capturedOutputs.length + 1;
    const record = buildCapturedOutputRecord({
      components: outputComponents,
      capturedWeights,
      capturedAt,
      productionId,
      batchNo: binlotValue !== "-" ? binlotValue : null,
      recipeNo,
      sequence: nextSequence,
      binlot: binlotValue,
    });

    if (capturedSessionKeysRef.current.has(record.sessionKey)) {
      toast.error("This output session is already captured.");
      return;
    }

    capturedSessionKeysRef.current.add(record.sessionKey);
    processScan(record.scancodeId);
    setCapturedOutputs((current) => [record, ...current]);
    setExpandedOutputIds((current) => ({ ...current, [record.id]: true }));
    setCapturedWeights(new Map());
    setActiveIndex(0);
    toast.success("Captured output recorded.");
  }, [
    allRequiredCaptured,
    binlotValue,
    capturedOutputs.length,
    capturedWeights,
    missingComponents,
    outputComponents,
    processScan,
    productionId,
    recipeNo,
    requiredComponents.length,
  ]);

  const netWeightColor =
    tolerance?.withinTolerance === false
      ? "text-red-400"
      : tolerance?.withinTolerance === true
        ? "text-[#4ade80]"
        : "text-white";

  return (
    <ProductionSectionCard title="Output Weight Capture" tone="emerald" icon={Scale}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1a2e] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex min-h-[88px] items-stretch">
            <div className="w-[168px] shrink-0 space-y-[5px] border-r border-slate-700 bg-[#0d0d1a] px-4 py-3 font-mono text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">STO WT</span>
                <span className="font-semibold text-white">{displayStdWeight.toFixed(3)} KG</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">MIN WT</span>
                <span className="font-semibold text-yellow-400">{minWeight.toFixed(3)} KG</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">MAX WT</span>
                <span className="font-semibold text-yellow-400">{maxWeight.toFixed(3)} KG</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">TARE</span>
                <span className="font-semibold text-slate-300">0.000 KG</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-slate-700 bg-[#111827] px-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white">
                Recipe No:&nbsp;{recipeNo}
              </span>
              {activeComponent ? (
                <div className="text-center">
                  <span className="font-mono text-[11px] tracking-widest text-blue-300">
                    ▶ {activeComponent.itemCode}
                  </span>
                  <div className="mt-1 text-[11px] text-slate-400">{activeComponent.itemName}</div>
                </div>
              ) : null}
            </div>

            <div className="flex w-[220px] shrink-0 flex-col items-end justify-center bg-[#0d0d1a] px-6 py-3">
              <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                NET WEIGHT
              </span>
              <div className="flex items-end gap-2">
                <span className={`text-[46px] font-mono font-bold leading-none tracking-wider ${netWeightColor}`}>
                  {weight ? weight.value.toFixed(3) : "0.000"}
                </span>
                <span className="mb-1 font-mono text-lg text-slate-400">kg</span>
              </div>
              {tolerance ? (
                <div
                  className={`mt-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest ${
                    tolerance.withinTolerance
                      ? "border-emerald-700/50 bg-emerald-900/60 text-emerald-400"
                      : "border-red-700/50 bg-red-900/60 text-red-400"
                  }`}
                >
                  {tolerance.withinTolerance ? <CheckCircle2 className="h-3 w-3" /> : <span>✗</span>}
                  {tolerance.withinTolerance ? "WITHIN RANGE" : "OUT OF RANGE"}
                </div>
              ) : (
                <div className="mt-1 text-[9px] font-mono tracking-widest text-slate-600">AWAITING READING</div>
              )}
            </div>
          </div>

          <div className="flex items-stretch border-t border-slate-700">
            <div className="flex-1 p-3">
              <div className="grid grid-cols-4 gap-2">
                {outputComponents.map((component, index) => {
                  const captured = capturedWeights.get(component.id);
                  const isActive = index === activeIndex;
                  const isCaptured = !!captured;
                  const displayWeight = isCaptured
                    ? captured.weightKg.toFixed(3)
                    : Math.abs(component.plannedWeightKg).toFixed(3);

                  const cardBackground = isActive
                    ? "border border-blue-400/70 bg-[#1e3a8a]"
                    : isCaptured
                      ? "border border-emerald-500/70 bg-[#064e3b]"
                      : "border border-green-800/60 bg-[#14532d]";
                  const weightColor = isActive
                    ? "text-white"
                    : isCaptured
                      ? "text-emerald-300"
                      : "text-[#4ade80]";
                  const codeColor = isActive
                    ? "text-blue-300"
                    : isCaptured
                      ? "text-emerald-400"
                      : "text-slate-400";
                  const dotColor = isActive
                    ? "bg-blue-400 animate-pulse"
                    : isCaptured
                      ? "bg-emerald-400"
                      : "bg-green-800";

                  return (
                    <button
                      key={component.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`rounded-xl px-3 py-2 text-left transition-all hover:brightness-110 ${cardBackground}`}
                    >
                      <div className="mb-0.5 flex items-start justify-between">
                        <span className={`text-[22px] font-mono font-bold leading-none tabular-nums ${weightColor}`}>
                          {displayWeight}
                        </span>
                        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                      </div>
                      <div className="mb-1 font-mono text-[10px] text-slate-500">kg</div>
                      <div className={`truncate font-mono text-[10px] font-semibold ${codeColor}`}>
                        {component.itemCode}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-300">{component.itemName}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex w-[130px] shrink-0 flex-col items-center justify-between gap-3 border-l border-slate-700 px-4 py-4">
              <div className="text-center">
                <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  TOTAL WT.
                </div>
                <div className="text-[32px] font-mono font-bold leading-none tabular-nums text-white">
                  {totalCaptured.toFixed(2)}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">kg</div>
              </div>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!canCapture}
                title={
                  !weight?.stable
                    ? "Waiting for stable reading…"
                    : !tolerance?.withinTolerance
                      ? `Weight out of range (${minWeight.toFixed(3)}–${maxWeight.toFixed(3)} kg)`
                      : "Save weight to the current capture session"
                }
                className={`w-full rounded-xl py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                  canCapture
                    ? "cursor-pointer bg-emerald-600 text-white shadow-[0_0_14px_rgba(52,211,153,0.45)] hover:bg-emerald-500"
                    : "cursor-not-allowed bg-slate-800 text-slate-600"
                }`}
              >
                <span className="flex flex-col items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${canCapture ? "text-emerald-200" : "text-slate-700"}`} />
                  SAVE WT.
                </span>
              </button>

              <div
                className={`h-10 w-10 rounded-full transition-colors ${
                  connected
                    ? "bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.55)]"
                    : "bg-slate-700"
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-[#0d0d1a] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
              <span className="font-mono text-[11px] text-slate-400">
                {connected ? "SCALE CONNECTED" : "SCALE OFFLINE"}
              </span>
              {weight ? (
                <span className={`font-mono text-[11px] ${weight.stable ? "text-emerald-400" : "text-yellow-400"}`}>
                  {weight.stable ? "● STABLE" : "◌ STABILIZING…"}
                </span>
              ) : null}
              {tolerance ? (
                <span className={`font-mono text-[11px] ${tolerance.withinTolerance ? "text-emerald-400" : "text-red-400"}`}>
                  Δ {tolerance.deviation >= 0 ? "+" : ""}
                  {tolerance.deviation.toFixed(3)} kg
                </span>
              ) : null}
              <span className="font-mono text-[11px] text-slate-500">
                {capturedWeights.size}/{requiredComponents.length} captured
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinalCapture}
                disabled={!allRequiredCaptured || requiredComponents.length === 0}
                className={`rounded-lg px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  allRequiredCaptured && requiredComponents.length > 0
                    ? "bg-[#ff6b00] text-white hover:bg-[#ff7e1f]"
                    : "cursor-not-allowed bg-slate-800 text-slate-600"
                }`}
              >
                Final Capture
              </button>
              <button
                type="button"
                onClick={tare}
                className="rounded-lg bg-slate-700 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-200 transition-colors hover:bg-slate-600"
              >
                TARE
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/75 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-slate-500" />
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-900">
                  Captured Output List
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Final-captured recipe outputs stay listed below the weightage panel for this edit session.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {capturedOutputs.length} record{capturedOutputs.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">S. No.</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">{">>"}</th>
                  <th className="px-3 py-3">Scancode ID</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Weight (kg)</th>
                  <th className="px-4 py-3 text-right">Binlot</th>
                </tr>
              </thead>
              <tbody>
                {capturedOutputs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-slate-500">
                      Capture each recipe component, then use Final Capture to create the output list.
                    </td>
                  </tr>
                ) : (
                  capturedOutputs.map((record, index) => {
                    const isExpanded = !!expandedOutputIds[record.id];
                    const detailMap = new Map(record.details.map((detail) => [detail.componentId, detail]));

                    return (
                      <Fragment key={record.id}>
                        <tr className="border-t border-slate-200/70 align-top">
                          <td className="px-4 py-3 font-medium text-slate-900">{index + 1}</td>
                          <td className="px-3 py-3 text-slate-700">{formatOutputDate(record.capturedAt)}</td>
                          <td className="px-3 py-3 text-slate-700">{formatOutputTime(record.capturedAt)}</td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              aria-label={isExpanded ? "Collapse recipe details" : "Expand recipe details"}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                              onClick={() =>
                                setExpandedOutputIds((current) => ({
                                  ...current,
                                  [record.id]: !current[record.id],
                                }))
                              }
                            >
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] font-semibold text-slate-900">{record.scancodeId}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-800">{record.qty}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-800">{record.weightKg}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{record.binlot}</td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-t border-slate-200/60 bg-slate-50/70">
                            <td colSpan={8} className="p-0">
                              <div className="overflow-x-auto px-4 py-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                                <table className="min-w-max border-separate border-spacing-0 text-[11px]">
                                  <thead>
                                    <tr>
                                      <th className="border border-slate-200 bg-slate-200/80 px-3 py-2 text-left font-semibold text-slate-700">
                                        Recipe No.
                                      </th>
                                      {record.componentColumns.map((column) => (
                                        <th
                                          key={column.id}
                                          className="border border-slate-200 bg-slate-200/80 px-3 py-2 text-left font-semibold text-slate-700"
                                        >
                                          {column.label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900">
                                        {record.recipeNo}
                                      </td>
                                      {record.componentColumns.map((column) => {
                                        const detail = detailMap.get(column.id);

                                        return (
                                          <td key={column.id} className="border border-slate-200 bg-white px-3 py-2 align-top text-slate-900">
                                            <div className="font-semibold">{detail ? `${detail.weightKg} kg` : "-"}</div>
                                            <div className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                                              {detail ? `(${formatOutputDetailDateTime(detail.capturedAt)})` : "-"}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProductionSectionCard>
  );
};

export default ProductionOutputTab;
