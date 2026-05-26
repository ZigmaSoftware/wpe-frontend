import React, { useState, useCallback } from "react";
import { useWeightStream } from "@/hooks/useWeightStream";
import type { MaterialMovement, ProductionOrderDetail } from "../types";
import { MaterialMovementType } from "../types";

const TOLERANCE_PERCENT = 0.5;

type CapturedWeight = {
  movementId: number;
  weight: number;
  capturedAt: Date;
};

interface RecordOutputTabProps {
  productionOrder: ProductionOrderDetail;
  materialMovements: MaterialMovement[];
}

export const RecordOutputTab: React.FC<RecordOutputTabProps> = ({
  productionOrder,
  materialMovements,
}) => {
  const components = materialMovements.filter(
    (m) => m.movement_type === MaterialMovementType.RAW_MATERIAL_IN,
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [capturedWeights, setCapturedWeights] = useState<Map<number, CapturedWeight>>(new Map());

  const active    = components[activeIndex] ?? null;
  const stdWeight = active?.quantity ?? 0;
  const minWeight = stdWeight > 0 ? +(stdWeight * (1 - TOLERANCE_PERCENT / 100)).toFixed(3) : 0;
  const maxWeight = stdWeight > 0 ? +(stdWeight * (1 + TOLERANCE_PERCENT / 100)).toFixed(3) : 0;

  const { weight, connected, tare, checkTolerance } = useWeightStream({
    deviceId: "output-scale-1",
    tolerancePercent: TOLERANCE_PERCENT,
    enabled: true,
  });

  const tolerance = stdWeight > 0 && weight ? checkTolerance(stdWeight) : null;

  const totalCaptured = Array.from(capturedWeights.values()).reduce(
    (sum, c) => sum + c.weight,
    0,
  );

  const handleCapture = useCallback(() => {
    if (!weight?.stable || !active) return;
    const next = new Map(capturedWeights);
    next.set(active.id, { movementId: active.id, weight: weight.value, capturedAt: new Date() });
    setCapturedWeights(next);
    if (activeIndex < components.length - 1) setActiveIndex((i) => i + 1);
  }, [weight, active, activeIndex, components.length, capturedWeights]);

  const netColor =
    tolerance?.withinTolerance === false ? "text-red-400"
    : tolerance?.withinTolerance === true  ? "text-[#4ade80]"
    : "text-white";

  return (
    <div className="p-6">
      <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.45)] bg-[#1a1a2e]">

        {/* ── Header bar ─────────────────────────────────────── */}
        <div className="flex items-stretch min-h-[84px]">

          {/* Left: weight specs */}
          <div className="bg-[#0d0d1a] px-4 py-3 font-mono text-[11px] space-y-[5px] w-[168px] shrink-0 border-r border-slate-700">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">STO WT</span>
              <span className="text-white font-semibold">{stdWeight.toFixed(3)} KG</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">MIN WT</span>
              <span className="text-yellow-400 font-semibold">{minWeight.toFixed(3)} KG</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">MAX WT</span>
              <span className="text-yellow-400 font-semibold">{maxWeight.toFixed(3)} KG</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">TARE</span>
              <span className="text-slate-300 font-semibold">0.000 KG</span>
            </div>
          </div>

          {/* Center: Recipe No */}
          <div className="flex-1 bg-[#14532d] flex items-center justify-center border-r border-slate-700">
            <span className="text-[13px] font-bold text-white tracking-[0.2em] uppercase">
              Recipe No:&nbsp;{productionOrder.production_id}
            </span>
          </div>

          {/* Right: NET WEIGHT */}
          <div className="bg-[#0d0d1a] px-6 py-3 flex flex-col items-end justify-center w-[220px] shrink-0">
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.22em] uppercase mb-1">
              NET WEIGHT
            </span>
            <div className="flex items-end gap-2">
              <span className={`text-[46px] leading-none font-mono font-bold tracking-wider ${netColor}`}>
                {weight ? weight.value.toFixed(3) : "0.000"}
              </span>
              <span className="text-lg text-slate-400 font-mono mb-1">kg</span>
            </div>
          </div>
        </div>

        {/* ── Component grid + right column ──────────────────── */}
        <div className="flex items-stretch border-t border-slate-700">

          {/* Cards */}
          <div className="flex-1 p-3">
            {components.length === 0 ? (
              <div className="text-center text-slate-500 py-10 text-sm font-mono">
                No raw material movements found for this order.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {components.map((mat, idx) => {
                  const captured    = capturedWeights.get(mat.id);
                  const isActive    = idx === activeIndex;
                  const isCaptured  = !!captured;
                  const displayWt   = isCaptured
                    ? captured!.weight.toFixed(3)
                    : mat.quantity.toFixed(3);

                  const cardBg   = isActive   ? "bg-[#1e3a8a] border border-blue-400/70"
                                 : isCaptured ? "bg-[#064e3b] border border-emerald-500/70"
                                 : "bg-[#14532d] border border-green-800/60";
                  const numColor = isActive   ? "text-white"
                                 : isCaptured ? "text-emerald-300"
                                 : "text-[#4ade80]";
                  const codeColor = isActive   ? "text-blue-300"
                                  : isCaptured ? "text-emerald-400"
                                  : "text-slate-400";
                  const dotColor  = isActive   ? "bg-blue-400 animate-pulse"
                                  : isCaptured ? "bg-emerald-400"
                                  : "bg-green-800";

                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`rounded-xl px-3 py-2 text-left transition-all hover:brightness-110 ${cardBg}`}
                    >
                      <div className="flex items-start justify-between mb-0.5">
                        <span className={`text-[22px] leading-none font-mono font-bold tabular-nums ${numColor}`}>
                          {displayWt}
                        </span>
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mb-1">{mat.unit}</div>
                      <div className={`text-[10px] font-mono font-semibold truncate ${codeColor}`}>
                        {mat.item_code ?? mat.item_name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Total + indicator */}
          <div className="flex flex-col items-center justify-between border-l border-slate-700 px-5 py-4 w-[110px] shrink-0">
            <div className="text-center">
              <div className="text-[9px] font-bold text-slate-400 tracking-[0.18em] uppercase mb-2">
                TOTAL WT.
              </div>
              <div className="text-[32px] leading-none font-mono font-bold text-white tabular-nums">
                {totalCaptured.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">kg</div>
            </div>
            <div
              className={`w-10 h-10 rounded-full transition-colors ${
                connected
                  ? "bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.55)]"
                  : "bg-slate-700"
              }`}
            />
          </div>
        </div>

        {/* ── Controls bar ───────────────────────────────────── */}
        <div className="border-t border-slate-700 bg-[#0d0d1a] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[11px] text-slate-400 font-mono">
              {connected ? "SCALE CONNECTED" : "SCALE OFFLINE"}
            </span>
            {weight && (
              <span className={`text-[11px] font-mono ${weight.stable ? "text-emerald-400" : "text-yellow-400"}`}>
                {weight.stable ? "● STABLE" : "◌ STABILIZING…"}
              </span>
            )}
            {tolerance && (
              <span className={`text-[11px] font-mono ${tolerance.withinTolerance ? "text-emerald-400" : "text-red-400"}`}>
                Δ {tolerance.deviation >= 0 ? "+" : ""}{tolerance.deviation.toFixed(3)} kg
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={tare}
              className="px-4 py-1.5 text-[11px] font-bold font-mono rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors uppercase tracking-widest"
            >
              TARE
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!weight?.stable || !active}
              className="px-5 py-1.5 text-[11px] font-bold font-mono rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 transition-colors uppercase tracking-widest disabled:opacity-35 disabled:cursor-not-allowed"
            >
              CAPTURE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
