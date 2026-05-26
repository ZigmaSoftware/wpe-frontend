import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, Scale } from "lucide-react";
import { useWeightStream } from "@/hooks/useWeightStream";
import ProductionSectionCard from "./ProductionSectionCard";
import type { ProductionOrderFormValues } from "./productionOrderForm";

const TOLERANCE_PERCENT = 0.5;

// Demo materials shown when the order has no materials added yet (matches reference display).
// tolerance_kg: optional absolute ± tolerance in kg; falls back to TOLERANCE_PERCENT when absent.
const DEMO_MATERIALS = [
  { client_id: "demo-1", item_code: "WGO:2001", per_unit_quantity: "-0.40", tolerance_kg: "0.40" },
  { client_id: "demo-2", item_code: "HOP:2020", per_unit_quantity: "22.900" },
  { client_id: "demo-3", item_code: "CAL:2001", per_unit_quantity: "4.600" },
  { client_id: "demo-4", item_code: "COU:2003", per_unit_quantity: "3.500" },
  { client_id: "demo-5", item_code: "LUB:2007", per_unit_quantity: "1.100" },
  { client_id: "demo-6", item_code: "REG:2019", per_unit_quantity: "22.900" },
  { client_id: "demo-7", item_code: "ANT:2005", per_unit_quantity: "0.140" },
  { client_id: "demo-8", item_code: "REG:2025", per_unit_quantity: "9.200" },
];

type CapturedWeight = {
  componentId: string;
  weight: number;
  capturedAt: Date;
};

type ProductionOutputTabProps = {
  form: UseFormReturn<ProductionOrderFormValues>;
};

const ProductionOutputTab = ({ form }: ProductionOutputTabProps) => {
  const formMaterials = form.watch("materials.rows");
  const productionId  = form.watch("production_id");

  // Use real recipe materials when available, fall back to demo set
  const materials = formMaterials.length > 0 ? formMaterials : DEMO_MATERIALS;

  const [activeIndex, setActiveIndex]         = useState(0);
  const [capturedWeights, setCapturedWeights] = useState<Map<string, CapturedWeight>>(new Map());

  const activeComponent = materials[activeIndex] ?? null;
  const stdWeight       = parseFloat(activeComponent?.per_unit_quantity ?? "0") || 0;

  // Use absolute ±tolerance_kg when defined on the material; else fall back to percentage
  const tolKg    = parseFloat((activeComponent as { tolerance_kg?: string } | null)?.tolerance_kg ?? "") || null;
  const minWeight = stdWeight > 0
    ? tolKg !== null ? +(stdWeight - tolKg).toFixed(3) : +(stdWeight * (1 - TOLERANCE_PERCENT / 100)).toFixed(3)
    : 0;
  const maxWeight = stdWeight > 0
    ? tolKg !== null ? +(stdWeight + tolKg).toFixed(3) : +(stdWeight * (1 + TOLERANCE_PERCENT / 100)).toFixed(3)
    : 0;

  const { weight, connected, tare } = useWeightStream({
    deviceId: "output-scale-1",
    tolerancePercent: TOLERANCE_PERCENT,
    enabled: true,
  });

  // Derive tolerance directly from the computed min/max bounds
  const tolerance = stdWeight > 0 && weight
    ? {
        withinTolerance: weight.value >= minWeight && weight.value <= maxWeight,
        deviation:       +(weight.value - stdWeight).toFixed(3),
      }
    : null;

  // Capture is allowed only when the scale is stable AND weight is within tolerance
  const canCapture = !!(weight?.stable && tolerance?.withinTolerance === true && activeComponent);

  const totalCaptured = Array.from(capturedWeights.values()).reduce(
    (sum, c) => sum + c.weight,
    0,
  );

  const handleCapture = useCallback(() => {
    if (!canCapture || !weight || !activeComponent) return;
    const next = new Map(capturedWeights);
    next.set(activeComponent.client_id, {
      componentId: activeComponent.client_id,
      weight: weight.value,
      capturedAt: new Date(),
    });
    setCapturedWeights(next);
    if (activeIndex < materials.length - 1) setActiveIndex(activeIndex + 1);
  }, [canCapture, weight, activeComponent, activeIndex, materials.length, capturedWeights]);

  const netWeightColor =
    tolerance?.withinTolerance === false
      ? "text-red-400"
      : tolerance?.withinTolerance === true
        ? "text-[#4ade80]"
        : "text-white";

  return (
    <ProductionSectionCard title="Output Weight Capture" tone="emerald" icon={Scale}>
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1a2e] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

        {/* ── Header bar ─────────────────────────────────────── */}
        <div className="flex min-h-[88px] items-stretch">

          {/* Left: STD / MIN / MAX / TARE */}
          <div className="w-[168px] shrink-0 space-y-[5px] border-r border-slate-700 bg-[#0d0d1a] px-4 py-3 font-mono text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">STO WT</span>
              <span className="font-semibold text-white">{stdWeight.toFixed(3)} KG</span>
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

          {/* Center: Recipe No + material name */}
          <div className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-slate-700 bg-[#111827] px-4">
            <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white">
              Recipe No:&nbsp;{productionId || "—"}
            </span>
            {activeComponent && (
              <span className="font-mono text-[11px] tracking-widest text-blue-300">
                ▶ {activeComponent.item_code}
              </span>
            )}
          </div>

          {/* Right: NET WEIGHT + verification badge */}
          <div className="flex w-[220px] shrink-0 flex-col items-end justify-center px-6 py-3 bg-[#0d0d1a]">
            <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              NET WEIGHT
            </span>
            <div className="flex items-end gap-2">
              <span className={`text-[46px] leading-none font-mono font-bold tracking-wider ${netWeightColor}`}>
                {weight ? weight.value.toFixed(3) : "0.000"}
              </span>
              <span className="mb-1 font-mono text-lg text-slate-400">kg</span>
            </div>
            {/* Tolerance verification badge */}
            {tolerance ? (
              <div
                className={`mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono tracking-widest ${
                  tolerance.withinTolerance
                    ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50"
                    : "bg-red-900/60 text-red-400 border border-red-700/50"
                }`}
              >
                {tolerance.withinTolerance ? <CheckCircle2 className="h-3 w-3" /> : <span>✗</span>}
                {tolerance.withinTolerance ? "WITHIN RANGE" : "OUT OF RANGE"}
              </div>
            ) : (
              <div className="mt-1 text-[9px] font-mono text-slate-600 tracking-widest">AWAITING READING</div>
            )}
          </div>
        </div>

        {/* ── Component grid + right column ──────────────────── */}
        <div className="flex items-stretch border-t border-slate-700">

          {/* Material cards */}
          <div className="flex-1 p-3">
            <div className="grid grid-cols-4 gap-2">
              {materials.map((mat: { client_id: string; item_code: string; per_unit_quantity: string }, idx: number) => {
                const captured      = capturedWeights.get(mat.client_id);
                const isActive      = idx === activeIndex;
                const isCaptured    = !!captured;
                const displayWeight = isCaptured
                  ? captured!.weight.toFixed(3)
                  : parseFloat(mat.per_unit_quantity || "0").toFixed(3);

                const cardBg   = isActive   ? "bg-[#1e3a8a] border border-blue-400/70"
                               : isCaptured ? "bg-[#064e3b] border border-emerald-500/70"
                               : "bg-[#14532d] border border-green-800/60";
                const numColor = isActive   ? "text-white"
                               : isCaptured ? "text-emerald-300"
                               : "text-[#4ade80]";
                const codColor = isActive   ? "text-blue-300"
                               : isCaptured ? "text-emerald-400"
                               : "text-slate-400";
                const dotColor = isActive   ? "bg-blue-400 animate-pulse"
                               : isCaptured ? "bg-emerald-400"
                               : "bg-green-800";

                return (
                  <button
                    key={mat.client_id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`rounded-xl px-3 py-2 text-left transition-all hover:brightness-110 ${cardBg}`}
                  >
                    <div className="mb-0.5 flex items-start justify-between">
                      <span className={`text-[22px] leading-none font-mono font-bold tabular-nums ${numColor}`}>
                        {displayWeight}
                      </span>
                      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                    </div>
                    <div className="mb-1 font-mono text-[10px] text-slate-500">kg</div>
                    <div className={`truncate font-mono text-[10px] font-semibold ${codColor}`}>
                      {mat.item_code}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column: TOTAL WT → SAVE WT button → status light */}
          <div className="flex w-[130px] shrink-0 flex-col items-center justify-between border-l border-slate-700 px-4 py-4 gap-3">

            {/* Total weight */}
            <div className="text-center">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                TOTAL WT.
              </div>
              <div className="text-[32px] leading-none font-mono font-bold tabular-nums text-white">
                {totalCaptured.toFixed(2)}
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">kg</div>
            </div>

            {/* SAVE WEIGHT button — only active when weight matches standard */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={!canCapture}
              title={
                !weight?.stable
                  ? "Waiting for stable reading…"
                  : !tolerance?.withinTolerance
                    ? `Weight out of range (${minWeight.toFixed(3)}–${maxWeight.toFixed(3)} kg)`
                    : "Save weight to total"
              }
              className={`w-full rounded-xl py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                canCapture
                  ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_14px_rgba(52,211,153,0.45)] cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className="flex flex-col items-center gap-1">
                <CheckCircle2 className={`h-4 w-4 ${canCapture ? "text-emerald-200" : "text-slate-700"}`} />
                SAVE WT.
              </span>
            </button>

            {/* Scale connection indicator */}
            <div
              className={`h-10 w-10 rounded-full transition-colors ${
                connected
                  ? "bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.55)]"
                  : "bg-slate-700"
              }`}
            />
          </div>
        </div>

        {/* ── Controls bar ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-[#0d0d1a] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            <span className="font-mono text-[11px] text-slate-400">
              {connected ? "SCALE CONNECTED" : "SCALE OFFLINE"}
            </span>
            {weight && (
              <span className={`font-mono text-[11px] ${weight.stable ? "text-emerald-400" : "text-yellow-400"}`}>
                {weight.stable ? "● STABLE" : "◌ STABILIZING…"}
              </span>
            )}
            {tolerance && (
              <span className={`font-mono text-[11px] ${tolerance.withinTolerance ? "text-emerald-400" : "text-red-400"}`}>
                Δ {tolerance.deviation >= 0 ? "+" : ""}{tolerance.deviation.toFixed(3)} kg
              </span>
            )}
            {!canCapture && weight?.stable && tolerance?.withinTolerance === false && (
              <span className="font-mono text-[11px] text-red-400">
                EXPECTED {stdWeight.toFixed(3)} kg
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={tare}
            className="rounded-lg bg-slate-700 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-200 transition-colors hover:bg-slate-600"
          >
            TARE
          </button>
        </div>

      </div>
    </ProductionSectionCard>
  );
};

export default ProductionOutputTab;
