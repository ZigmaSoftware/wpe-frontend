import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, ChevronDown, ChevronRight, PackageCheck, QrCode, Scale } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useScannerInput } from "@/hooks/useScannerInput";
import { useWeightStream } from "@/hooks/useWeightStream";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ProductionBatch, ProductionOutputCapture } from "@/lib/types";
import { BATCH_STATUS_CLASSES, StatusBadge } from "@/pages/productionShared";
import ProductionSectionCard from "./ProductionSectionCard";
import {
  areAllRequiredOutputComponentsCaptured,
  buildCapturedOutputRecord,
  formatOutputDate,
  formatOutputDetailDateTime,
  formatOutputTime,
  getMissingRequiredOutputComponents,
  getRequiredOutputComponents,
  mapPersistedOutputCaptureRecord,
  resolveOutputCaptureComponents,
  type CapturedOutputRecord,
  type OutputCaptureComponent,
  type OutputCaptureMaterialSeed,
  type OutputComponentCapture,
} from "./productionOutputCapture";
import type { ProductionOrderFormValues } from "./productionOrderForm";
import { useBomComponents } from "./useBomComponents";
import QRLabelPreviewModal, { type QRLabelContext } from "./QRLabelPreviewModal";

const TOLERANCE_PERCENT = 0.5;
const DEFAULT_BATCH_AUTO_VALUE = "Generated on save";
const NEXT_PRODUCTION_TYPE_AFTER_AD = "WPE Blend Production";
const NEXT_PRODUCTION_TYPE_AFTER_BL = "WPE Granulated Blend Production";

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
  context?: {
    stage?: ProductionBatch["stage"] | null;
    batchId?: number | null;
    requireFinalCaptureConfirmation?: boolean;
  };
};

const parseNumericValue = (value?: string | null) => {
  const numeric = Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeComparableToken = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const findMatchingBatchEntry = (batch: ProductionBatch, component: OutputCaptureComponent) => {
  if (component.bomComponentId) {
    const matchedByComponentId = batch.weight_entries.find((entry) => entry.bom_component === component.bomComponentId);
    if (matchedByComponentId) {
      return matchedByComponentId;
    }
  }

  const componentCode = normalizeComparableToken(component.itemCode);
  const componentName = normalizeComparableToken(component.itemName);

  return (
    batch.weight_entries.find((entry) => {
      const entryCode = normalizeComparableToken(entry.item_code);
      const entryName = normalizeComparableToken(entry.item_name);
      return entryCode === componentCode || entryName === componentName;
    }) ?? null
  );
};

const ProductionOutputTab = ({ form, context }: ProductionOutputTabProps) => {
  const queryClient = useQueryClient();
  const { id: orderIdParam } = useParams<{ id?: string }>();
  const formMaterials = form.watch("materials.rows");
  const selectedBomVariantId = form.watch("materials.selected_bom_variant_id");
  const productionId = form.watch("production_id");
  const productionFor = form.watch("production_for");
  const finishedGoods = form.watch("finished_goods");
  const batchAuto = form.watch("details.batch_auto");
  const outputStage = context?.stage ?? "AD";
  const isAdMode = outputStage === "AD";
  const isBlMode = outputStage === "BL";
  const isGlMode = outputStage === "GL";
  const isSingleCaptureMode = isBlMode || isGlMode;
  const requireFinalCaptureConfirmation = context?.requireFinalCaptureConfirmation === true;
  const selectedContextBatchId = context?.batchId ?? null;

  const materials: OutputMaterialRow[] = formMaterials.length > 0 ? formMaterials : DEMO_MATERIALS;
  const bomVariantId = useMemo(() => {
    if (selectedBomVariantId) {
      return Number(selectedBomVariantId);
    }

    const firstAssignedVariant = formMaterials.find((row) => row.bom_variant !== null)?.bom_variant;
    return typeof firstAssignedVariant === "number" ? firstAssignedVariant : null;
  }, [formMaterials, selectedBomVariantId]);

  const bomVariantQuery = useBomComponents(bomVariantId);
  const binlotValue =
    batchAuto.trim() && batchAuto.trim().toLowerCase() !== "generated on save"
      ? batchAuto.trim()
      : "-";
  const persistedOrderId = Number.isInteger(Number(orderIdParam)) && Number(orderIdParam) > 0 ? Number(orderIdParam) : null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [capturedWeights, setCapturedWeights] = useState<Map<string, OutputComponentCapture>>(new Map());
  const [capturedOutputs, setCapturedOutputs] = useState<CapturedOutputRecord[]>([]);
  const [expandedOutputIds, setExpandedOutputIds] = useState<Record<string, boolean>>({});
  const [qrLabelRecord, setQrLabelRecord] = useState<CapturedOutputRecord | null>(null);
  const [adOutputBatchId, setAdOutputBatchId] = useState<number | null>(null);
  const [isSyncingCapture, setIsSyncingCapture] = useState(false);
  const [isFinalizingCapture, setIsFinalizingCapture] = useState(false);
  const [outwardingRecordId, setOutwardingRecordId] = useState<string | null>(null);
  const capturedSessionKeysRef = useRef(new Set<string>());
  const activeBatchIdRef = useRef<number | null>(null);
  const { processScan } = useScannerInput();

  const stageBatchesQuery = useQuery({
    queryKey: ["production-output-batches", persistedOrderId, outputStage],
    enabled: persistedOrderId !== null,
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/orders/${persistedOrderId}/batches/`, {
        params: { stage: outputStage },
      });
      return normalizeListResponse<ProductionBatch>(response.data);
    },
  });

  const stageBatches = useMemo(
    () => [...(stageBatchesQuery.data ?? [])].sort((left, right) => right.id - left.id),
    [stageBatchesQuery.data],
  );
  const activeBatch = useMemo(() => {
    if (selectedContextBatchId !== null) {
      return stageBatches.find((batch) => batch.id === selectedContextBatchId) ?? null;
    }

    if (isSingleCaptureMode) {
      return stageBatches.find((batch) => batch.status !== "COMPLETED") ?? stageBatches[0] ?? null;
    }

    return stageBatches.find((batch) => batch.status !== "COMPLETED") ?? null;
  }, [isSingleCaptureMode, selectedContextBatchId, stageBatches]);
  const outputCaptureSourceBatchId = isSingleCaptureMode
    ? activeBatch?.id ?? selectedContextBatchId
    : adOutputBatchId;
  const stageBatchIds = useMemo(() => new Set(stageBatches.map((batch) => batch.id)), [stageBatches]);
  const outputCapturesQuery = useQuery({
    queryKey: [
      "production-output-captures",
      persistedOrderId,
      isSingleCaptureMode ? outputCaptureSourceBatchId ?? "all" : "stage-batches",
    ],
    enabled:
      persistedOrderId !== null &&
      (isSingleCaptureMode ? outputCaptureSourceBatchId !== null : true),
    queryFn: async () => {
      const response = await coreApi.get<unknown>(`/api/production/orders/${persistedOrderId}/output-captures/`, {
        params:
          isSingleCaptureMode && outputCaptureSourceBatchId
            ? { source_batch: outputCaptureSourceBatchId }
            : undefined,
      });
      return normalizeListResponse<ProductionOutputCapture>(response.data).map(mapPersistedOutputCaptureRecord);
    },
  });

  const recipeNo = useMemo(() => {
    if (isSingleCaptureMode) {
      return activeBatch?.display_batch_no?.trim() || activeBatch?.batch_no?.trim() || productionId.trim() || "—";
    }

    return bomVariantQuery.data?.variant_code?.trim() || productionId.trim() || "—";
  }, [activeBatch?.batch_no, activeBatch?.display_batch_no, bomVariantQuery.data?.variant_code, isSingleCaptureMode, productionId]);
  const singleCaptureOutputComponents = useMemo<OutputCaptureComponent[]>(
    () => {
      if (!isSingleCaptureMode || !activeBatch) {
        return [];
      }

      if (isGlMode) {
        const stageComponents = resolveOutputCaptureComponents({
          batchEntries: activeBatch.weight_entries,
          bomComponents: null,
          materials: [],
        });
        const primaryComponent =
          getRequiredOutputComponents(stageComponents)[0] ?? stageComponents[0] ?? null;

        return [
          {
            id: `gl-batch-${outputCaptureSourceBatchId ?? activeBatch.id}`,
            itemCode:
              primaryComponent?.itemCode ||
              activeBatch.display_batch_no?.trim() ||
              activeBatch.batch_no?.trim() ||
              productionId.trim() ||
              "GL-BAG",
            itemName: primaryComponent?.itemName || "Bag Weight",
            plannedWeightKg: primaryComponent?.plannedWeightKg ?? 0,
            minWeightKg: primaryComponent?.minWeightKg,
            maxWeightKg: primaryComponent?.maxWeightKg,
            toleranceKg: primaryComponent?.toleranceKg,
            sequence: 1,
          },
        ];
      }

      return [
        {
          id: `bl-batch-${outputCaptureSourceBatchId ?? "current"}`,
          itemCode:
            activeBatch.display_batch_no?.trim() ||
            activeBatch.batch_no?.trim() ||
            productionId.trim() ||
            "BL-BIN",
          itemName: "Bin Weight",
          plannedWeightKg: 0,
          sequence: 1,
        },
      ];
    },
    [
      activeBatch,
      isGlMode,
      isSingleCaptureMode,
      outputCaptureSourceBatchId,
      productionId,
    ],
  );
  const outputComponents = useMemo<OutputCaptureComponent[]>(
    () =>
      isSingleCaptureMode
        ? singleCaptureOutputComponents
        : resolveOutputCaptureComponents({
            batchEntries: activeBatch?.weight_entries,
            bomComponents: bomVariantQuery.data?.components,
            materials: materials.filter((m): m is OutputCaptureMaterialSeed =>
              typeof (m as OutputCaptureMaterialSeed).client_id === "string"
            ) as OutputCaptureMaterialSeed[],
          }),
    [activeBatch?.weight_entries, bomVariantQuery.data?.components, isSingleCaptureMode, materials, singleCaptureOutputComponents],
  );
  const requiredComponents = useMemo(
    () => getRequiredOutputComponents(outputComponents),
    [outputComponents],
  );
  const activeComponent = outputComponents[activeIndex] ?? null;
  const persistedCapturedOutputs = useMemo(() => {
    const records = outputCapturesQuery.data ?? [];
    if (isSingleCaptureMode) {
      return records;
    }

    return records.filter((record) => record.sourceBatchId != null && stageBatchIds.has(record.sourceBatchId));
  }, [isSingleCaptureMode, outputCapturesQuery.data, stageBatchIds]);
  const existingSingleCapture = isSingleCaptureMode ? persistedCapturedOutputs[0] ?? null : null;
  const visibleCapturedOutputs =
    persistedOrderId !== null
      ? persistedCapturedOutputs.length > 0
        ? persistedCapturedOutputs
        : capturedOutputs
      : capturedOutputs;

  useEffect(() => {
    if (activeBatch?.id) {
      activeBatchIdRef.current = activeBatch.id;
    }
  }, [activeBatch?.id]);

  useEffect(() => {
    if (isSingleCaptureMode) {
      return;
    }

    if (activeBatch?.id) {
      setAdOutputBatchId((current) => (current === activeBatch.id ? current : activeBatch.id));
      return;
    }

    if (adOutputBatchId === null && stageBatches[0]?.id) {
      setAdOutputBatchId(stageBatches[0].id);
    }
  }, [activeBatch?.id, adOutputBatchId, isSingleCaptureMode, stageBatches]);

  useEffect(() => {
    capturedSessionKeysRef.current = new Set(visibleCapturedOutputs.map((record) => record.sessionKey));
  }, [visibleCapturedOutputs]);

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

  useEffect(() => {
    if (isSingleCaptureMode || !activeBatch) {
      return;
    }

    setCapturedWeights(() => {
      const next = new Map<string, OutputComponentCapture>();

      outputComponents.forEach((component) => {
        const matchedEntry = findMatchingBatchEntry(activeBatch, component);
        if (!matchedEntry?.entered_weight_grams) {
          return;
        }

        next.set(component.id, {
          componentId: component.id,
          weightKg: parseNumericValue(matchedEntry.entered_weight_grams),
          capturedAt: new Date(matchedEntry.entered_at),
        });
      });

      return next;
    });
  }, [activeBatch, isSingleCaptureMode, outputComponents]);

  useEffect(() => {
    if (!isSingleCaptureMode || !activeComponent || !existingSingleCapture) {
      return;
    }

    const detail = existingSingleCapture.details[0];
    const persistedWeight = parseNumericValue(detail?.weightKg ?? existingSingleCapture.weightKg);
    if (persistedWeight <= 0) {
      return;
    }

    setCapturedWeights(
      new Map([
        [
          activeComponent.id,
          {
            componentId: activeComponent.id,
            weightKg: persistedWeight,
            capturedAt: new Date(detail?.capturedAt ?? existingSingleCapture.capturedAt),
          },
        ],
      ]),
    );
  }, [activeComponent, existingSingleCapture, isSingleCaptureMode]);

  useEffect(() => {
    if (!outputComponents.length) {
      return;
    }

    const firstPendingIndex = outputComponents.findIndex((component) => !capturedWeights.has(component.id));
    if (firstPendingIndex >= 0) {
      setActiveIndex(firstPendingIndex);
    }
  }, [capturedWeights, outputComponents]);

  useEffect(() => {
    if (!activeBatch?.batch_no) {
      return;
    }

    form.setValue("details.batch_auto", activeBatch.batch_no, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [activeBatch?.batch_no, form]);
  const stdWeight = activeComponent?.plannedWeightKg ?? 0;
  const displayStdWeight = Math.abs(stdWeight);
  const fallbackToleranceKg = activeComponent?.toleranceKg ?? 0;
  const fallbackMinWeight =
    displayStdWeight > 0
      ? fallbackToleranceKg > 0
        ? +(displayStdWeight - fallbackToleranceKg).toFixed(3)
        : +(displayStdWeight * (1 - TOLERANCE_PERCENT / 100)).toFixed(3)
      : 0;
  const fallbackMaxWeight =
    displayStdWeight > 0
      ? fallbackToleranceKg > 0
        ? +(displayStdWeight + fallbackToleranceKg).toFixed(3)
        : +(displayStdWeight * (1 + TOLERANCE_PERCENT / 100)).toFixed(3)
      : 0;
  const minWeight =
    activeComponent?.minWeightKg !== undefined && activeComponent.minWeightKg !== null
      ? activeComponent.minWeightKg
      : fallbackMinWeight;
  const maxWeight =
    activeComponent?.maxWeightKg !== undefined && activeComponent.maxWeightKg !== null
      ? activeComponent.maxWeightKg
      : fallbackMaxWeight;

  const { weight, connected, tare } = useWeightStream({
    deviceId: "output-scale-1",
    tolerancePercent: TOLERANCE_PERCENT,
    enabled: true,
  });

  const tolerance =
    !isSingleCaptureMode && displayStdWeight > 0 && weight
      ? {
          withinTolerance: weight.value >= minWeight && weight.value <= maxWeight,
          deviation: +(weight.value - displayStdWeight).toFixed(3),
        }
      : null;

  const canCapture = isSingleCaptureMode
    ? !!(weight?.stable && weight.value > 0 && activeComponent)
    : !!(weight?.stable && tolerance?.withinTolerance === true && activeComponent);
  const totalCaptured = Array.from(capturedWeights.values()).reduce((sum, capture) => sum + capture.weightKg, 0);
  const missingComponents = useMemo(
    () => getMissingRequiredOutputComponents(outputComponents, capturedWeights),
    [capturedWeights, outputComponents],
  );
  const allRequiredCaptured = useMemo(
    () => areAllRequiredOutputComponentsCaptured(outputComponents, capturedWeights),
    [capturedWeights, outputComponents],
  );

  const invalidateBatchQueries = useCallback(() => {
    if (persistedOrderId === null) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["production-output-batches", persistedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["production-batches", persistedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["production-order-detail", String(persistedOrderId)] });
    queryClient.invalidateQueries({ queryKey: ["production-order", persistedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["production-output-captures", persistedOrderId] });
    queryClient.invalidateQueries({ queryKey: ["production-stage-records"] });
  }, [persistedOrderId, queryClient]);

  const ensureAdBatchForFinalCapture = useCallback(async () => {
    if (persistedOrderId === null) {
      return null;
    }

    let batch =
      activeBatch ??
      (activeBatchIdRef.current !== null
        ? stageBatches.find((candidate) => candidate.id === activeBatchIdRef.current) ?? null
        : null);

    if (batch?.status === "FAILED") {
      throw new Error("The current AD batch is marked failed. Create a fresh batch before capturing weights.");
    }

    if (!batch) {
      if (!bomVariantId) {
        throw new Error("Select a BOM variant and save the order before final capture.");
      }

      const createResponse = await coreApi.post<unknown>(`/api/production/orders/${persistedOrderId}/batches/`, {
        stage: "AD",
        bom_variant: bomVariantId,
      });
      batch = unwrapSuccessEnvelope(createResponse.data as ProductionBatch | unknown) as ProductionBatch;
      activeBatchIdRef.current = batch.id;
    }

    return batch;
  }, [activeBatch, bomVariantId, persistedOrderId, stageBatches]);

  const startBatchIfPending = useCallback(
    async (batch: ProductionBatch) => {
      if (persistedOrderId === null || batch.status !== "PENDING") {
        return batch;
      }

      const startResponse = await coreApi.post<unknown>(
        `/api/production/orders/${persistedOrderId}/batches/${batch.id}/start/`,
      );
      const startedBatch = unwrapSuccessEnvelope(startResponse.data as ProductionBatch | unknown) as ProductionBatch;
      activeBatchIdRef.current = startedBatch.id;
      return startedBatch;
    },
    [persistedOrderId],
  );

  const syncCapturedWeightsToBatch = useCallback(
    async (batch: ProductionBatch) => {
      if (persistedOrderId === null) {
        return;
      }

      const capturedComponents = outputComponents.filter((component) => capturedWeights.has(component.id));
      for (const component of capturedComponents) {
        const capture = capturedWeights.get(component.id);
        if (!capture) {
          continue;
        }

        const matchedEntry = findMatchingBatchEntry(batch, component);
        if (!matchedEntry) {
          throw new Error(`No AD batch component matches ${component.itemName}.`);
        }

        await coreApi.post<unknown>(
          `/api/production/orders/${persistedOrderId}/batches/${batch.id}/weights/${matchedEntry.id}/`,
          {
            entered_weight_grams: capture.weightKg.toFixed(3),
          },
        );
      }
    },
    [capturedWeights, outputComponents, persistedOrderId],
  );

  const handleCapture = useCallback(() => {
    if (!canCapture || !weight || !activeComponent || isSyncingCapture || isFinalizingCapture || outwardingRecordId !== null) {
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
  }, [
    activeComponent,
    activeIndex,
    canCapture,
    isFinalizingCapture,
    isSyncingCapture,
    outwardingRecordId,
    outputComponents,
    weight,
  ]);

  const handleFinalCapture = useCallback(() => {
    if (requiredComponents.length === 0) {
      toast.error(isSingleCaptureMode ? "No batch capture target is available for final capture." : "No recipe components available for final capture.");
      return;
    }

    if (!allRequiredCaptured) {
      const missingLabel = missingComponents
        .slice(0, 3)
        .map((component) => component.itemName)
        .join(", ");
      const remainingCount = missingComponents.length - Math.min(missingComponents.length, 3);
      const suffix = remainingCount > 0 ? ` +${remainingCount} more` : "";

      toast.error(
        isSingleCaptureMode
          ? `Capture the current batch weight before final capture. Missing: ${missingLabel}${suffix}`
          : `Capture all recipe components before final capture. Missing: ${missingLabel}${suffix}`,
      );
      return;
    }

    if (isFinalizingCapture || isSyncingCapture || outwardingRecordId !== null) {
      return;
    }

    if (requireFinalCaptureConfirmation) {
      const shouldCreateBatch = window.confirm(
        isGlMode
          ? "Do you need to create Bag?\n\nYes = create Bag\nNo = cancel"
          : "Do I need to create a batch?\n\nYes = create Batch\nNo = cancel",
      );
      if (!shouldCreateBatch) {
        return;
      }
    }

    const finalizeCapture = async () => {
      let capturedAt = new Date();
      let resolvedBatchNo = binlotValue;
      let nextBatchAutoValue = DEFAULT_BATCH_AUTO_VALUE;
      let persistedRecord: CapturedOutputRecord | null = null;

      if (persistedOrderId !== null) {
        setIsFinalizingCapture(true);
        setIsSyncingCapture(true);
        try {
          if (isSingleCaptureMode) {
            if (!activeBatch) {
              throw new Error(isBlMode ? "Select a BL batch before final capture." : "Select a GL batch before final capture.");
            }
            if (activeBatch.status === "COMPLETED") {
              throw new Error(isBlMode ? "This BL batch is already moved to GL." : "This GL batch is already completed.");
            }

            const existingCaptureRecord = existingSingleCapture;
            const weightCapture = activeComponent ? capturedWeights.get(activeComponent.id) : null;
            if (!existingCaptureRecord && !weightCapture) {
              throw new Error(isBlMode ? "Capture a stable batch weight before final capture." : "Capture a stable bag weight before final capture.");
            }
            if (existingCaptureRecord) {
              throw new Error(
                isBlMode
                  ? "This BL batch already has a captured output row. Use OutWard to move it to GL."
                  : "This GL batch already has a captured output row.",
              );
            }

            const startedBatch = await startBatchIfPending(activeBatch);
            const captureResponse = await coreApi.post<unknown>(
              `/api/production/orders/${persistedOrderId}/output-captures/`,
              {
                source_batch: startedBatch.id,
                weight_kg: weightCapture!.weightKg.toFixed(3),
              },
            );
            persistedRecord = mapPersistedOutputCaptureRecord(
              unwrapSuccessEnvelope(captureResponse.data as ProductionOutputCapture | unknown) as ProductionOutputCapture,
            );
            capturedAt = new Date(persistedRecord.capturedAt);
            resolvedBatchNo = startedBatch.batch_no?.trim() || persistedRecord.binlot;

            invalidateBatchQueries();
            const refreshedOutputCaptures = await outputCapturesQuery.refetch();
            persistedRecord =
              refreshedOutputCaptures.data?.find((record) => record.sourceBatchId === startedBatch.id) ??
              persistedRecord;
          } else {
            const batchToConfirm = await ensureAdBatchForFinalCapture();
            if (!batchToConfirm) {
              throw new Error("Save the order first to complete the AD batch.");
            }

            const startedBatch = await startBatchIfPending(batchToConfirm);
            await syncCapturedWeightsToBatch(startedBatch);
            const activeBatchId = startedBatch.id;
            const confirmResponse = await coreApi.post<unknown>(
              `/api/production/orders/${persistedOrderId}/batches/${activeBatchId}/confirm/`,
            );
            const confirmedBatch = unwrapSuccessEnvelope(confirmResponse.data as ProductionBatch | unknown) as ProductionBatch;

            if (confirmedBatch.completed_at) {
              capturedAt = new Date(confirmedBatch.completed_at);
            }
            if (confirmedBatch.batch_no?.trim()) {
              resolvedBatchNo = confirmedBatch.batch_no.trim();
            }

            setAdOutputBatchId(activeBatchId);
            const nextBatchResponse = await coreApi.get<unknown>(`/api/production/orders/${persistedOrderId}/batches/`, {
              params: { stage: "BL" },
            });
            const nextBlBatch = normalizeListResponse<ProductionBatch>(nextBatchResponse.data)
              .sort((left, right) => right.id - left.id)
              .find((batch) => batch.status !== "COMPLETED");
            const nextBatchDisplayNo = nextBlBatch?.display_batch_no?.trim() || nextBlBatch?.batch_no?.trim();
            if (nextBatchDisplayNo) {
              nextBatchAutoValue = nextBatchDisplayNo;
            }

            invalidateBatchQueries();
            const refreshedOutputCaptures = await outputCapturesQuery.refetch();
            persistedRecord =
              refreshedOutputCaptures.data?.find((record) => record.sourceBatchId === activeBatchId) ??
              refreshedOutputCaptures.data?.[0] ??
              null;
            form.setValue("production_type", NEXT_PRODUCTION_TYPE_AFTER_AD, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
            form.setValue("details.batch_auto", nextBatchAutoValue, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          }
        } catch (error) {
          toast.error(
            getApiErrorMessage(
              error,
              isBlMode
                ? "Failed to create the BL captured output list."
                : isGlMode
                  ? "Failed to create the GL captured output list."
                  : "Failed to complete the AD batch.",
            ),
          );
          return;
        } finally {
          setIsSyncingCapture(false);
          setIsFinalizingCapture(false);
        }
      }

      const nextSequence = visibleCapturedOutputs.length + 1;
      const record =
        persistedRecord ??
        buildCapturedOutputRecord({
          components: outputComponents,
          capturedWeights,
          capturedAt,
          productionId,
          batchNo: resolvedBatchNo !== "-" ? resolvedBatchNo : null,
          recipeNo,
          sequence: nextSequence,
          binlot: resolvedBatchNo !== "-" ? resolvedBatchNo : binlotValue,
        });

      if (!persistedRecord && capturedSessionKeysRef.current.has(record.sessionKey)) {
        toast.error("This output session is already captured.");
        return;
      }

      capturedSessionKeysRef.current.add(record.sessionKey);
      processScan(record.scancodeId);
      if (persistedOrderId === null || !persistedRecord) {
        setCapturedOutputs((current) => [record, ...current]);
      }
      setExpandedOutputIds((current) => ({ ...current, [record.id]: true }));
      setCapturedWeights(new Map());
      setActiveIndex(0);
      toast.success(
        persistedOrderId !== null
          ? isBlMode
            ? "BL captured output recorded. Use OutWard to move it to GL."
            : isGlMode
              ? "GL captured output recorded."
              : "Captured output recorded and AD batch completed."
          : "Captured output recorded.",
      );
    };

    void finalizeCapture();
  }, [
    activeBatch,
    activeComponent,
    allRequiredCaptured,
    binlotValue,
    capturedWeights,
    ensureAdBatchForFinalCapture,
    existingSingleCapture,
    form,
    invalidateBatchQueries,
    isBlMode,
    isGlMode,
    isSingleCaptureMode,
    isFinalizingCapture,
    isSyncingCapture,
    missingComponents,
    outwardingRecordId,
    outputComponents,
    persistedOrderId,
    processScan,
    productionId,
    recipeNo,
    requireFinalCaptureConfirmation,
    requiredComponents.length,
    startBatchIfPending,
    syncCapturedWeightsToBatch,
    outputCapturesQuery,
    visibleCapturedOutputs.length,
  ]);

  const handleOutward = useCallback(
    async (record: CapturedOutputRecord) => {
      if (
        (!isBlMode && !isGlMode) ||
        persistedOrderId === null ||
        !record.sourceBatchId ||
        record.isOutwarded ||
        outwardingRecordId !== null
      ) {
        return;
      }

      setOutwardingRecordId(record.id);
      try {
        await coreApi.post<unknown>(
          `/api/production/orders/${persistedOrderId}/batches/${record.sourceBatchId}/confirm/`,
        );

        let nextBatchDisplayNo: string | undefined;
        if (isBlMode) {
          const nextBatchResponse = await coreApi.get<unknown>(`/api/production/orders/${persistedOrderId}/batches/`, {
            params: { stage: "GL" },
          });
          const nextGlBatch = normalizeListResponse<ProductionBatch>(nextBatchResponse.data)
            .sort((left, right) => right.id - left.id)
            .find((batch) => batch.status !== "COMPLETED");
          nextBatchDisplayNo = nextGlBatch?.display_batch_no?.trim() || nextGlBatch?.batch_no?.trim();
        }

        invalidateBatchQueries();
        await outputCapturesQuery.refetch();

        if (isBlMode) {
          form.setValue("production_type", NEXT_PRODUCTION_TYPE_AFTER_BL, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
          if (nextBatchDisplayNo) {
            form.setValue("details.batch_auto", nextBatchDisplayNo, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          }
        }
        toast.success(
          isBlMode
            ? "BL batch moved to GL and the assigned bin was released."
            : "GL batch moved to PR and the assigned bag was released.",
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, isBlMode ? "Failed to outward the BL batch." : "Failed to outward the GL batch."));
      } finally {
        setOutwardingRecordId(null);
      }
    },
    [form, invalidateBatchQueries, isBlMode, isGlMode, outputCapturesQuery, outwardingRecordId, persistedOrderId],
  );

  const netWeightColor = isSingleCaptureMode
    ? weight?.stable
      ? "text-[#4ade80]"
      : "text-white"
    : tolerance?.withinTolerance === false
      ? "text-red-400"
      : tolerance?.withinTolerance === true
        ? "text-[#4ade80]"
        : "text-white";
  const isSingleCaptureLocked =
    isSingleCaptureMode && (activeBatch?.status === "COMPLETED" || existingSingleCapture !== null);
  const saveWeightDisabled =
    !canCapture || isSyncingCapture || isFinalizingCapture || outwardingRecordId !== null || isSingleCaptureLocked;
  const finalCaptureDisabled = isSingleCaptureMode
    ? !activeBatch ||
      activeBatch.status === "COMPLETED" ||
      existingSingleCapture !== null ||
      requiredComponents.length === 0 ||
      isFinalizingCapture ||
      isSyncingCapture ||
      outwardingRecordId !== null ||
      (!allRequiredCaptured && existingSingleCapture === null)
    : !allRequiredCaptured || requiredComponents.length === 0 || isFinalizingCapture || isSyncingCapture || outwardingRecordId !== null;
  const currentBatchLabel =
    activeBatch?.display_batch_no?.trim() || activeBatch?.batch_no?.trim() || (binlotValue !== "-" ? binlotValue : "Not assigned");
  const activeCapture = activeComponent ? capturedWeights.get(activeComponent.id) ?? null : null;

  return (
    <>
    <ProductionSectionCard title="Output Weight Capture" tone="emerald" icon={Scale}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1a2e] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex min-h-[88px] items-stretch">
            <div className="w-[168px] shrink-0 space-y-[5px] border-r border-slate-700 bg-[#0d0d1a] px-4 py-3 font-mono text-[11px]">
              {isSingleCaptureMode ? (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">STAGE</span>
                    <span className="font-semibold text-white">{outputStage}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">BATCH</span>
                    <span className="truncate text-right font-semibold text-yellow-400">{currentBatchLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">CAPTURED</span>
                    <span className="font-semibold text-yellow-400">{activeCapture?.weightKg.toFixed(3) ?? "0.000"} KG</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">TARE</span>
                <span className="font-semibold text-slate-300">0.000 KG</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-slate-700 bg-[#111827] px-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white">
                {isBlMode ? "Bin Assign" : isGlMode ? "Bag Assign" : "Recipe No:"}&nbsp;{recipeNo}
              </span>
              {activeComponent ? (
                <div className="text-center">
                  <span className="font-mono text-[11px] tracking-widest text-blue-300">
                    ▶ {isSingleCaptureMode ? currentBatchLabel : activeComponent.itemCode}
                  </span>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {isBlMode
                      ? "Single bin weight capture for the selected BL batch."
                      : isGlMode
                        ? "Single bag weight capture for the selected GL batch."
                        : activeComponent.itemName}
                  </div>
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
              {isSingleCaptureMode ? (
                <button
                  type="button"
                  onClick={() => setActiveIndex(0)}
                  className={`w-full rounded-2xl px-4 py-4 text-left transition-all ${
                    activeCapture
                      ? "border border-emerald-500/70 bg-[#064e3b]"
                      : "border border-blue-400/70 bg-[#1e3a8a]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Current Batch Weight</div>
                      <div className="mt-2 text-[30px] font-mono font-bold leading-none text-white">
                        {activeCapture ? activeCapture.weightKg.toFixed(3) : weight?.value.toFixed(3) ?? "0.000"}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-300">kg</div>
                    </div>
                    <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${activeCapture ? "bg-emerald-400" : "bg-blue-400 animate-pulse"}`} />
                  </div>
                  <div className="mt-4 font-mono text-[10px] font-semibold text-blue-200">{currentBatchLabel}</div>
                  <div className="mt-1 text-[11px] text-slate-300">Saved weight is used to create the batch-specific captured output list below.</div>
                </button>
              ) : (
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
              )}
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
                disabled={saveWeightDisabled}
                title={
                  isSyncingCapture
                    ? "Saving weight..."
                    : !weight?.stable
                    ? "Waiting for stable reading…"
                    : !isSingleCaptureMode && !tolerance?.withinTolerance
                      ? `Weight out of range (${minWeight.toFixed(3)}–${maxWeight.toFixed(3)} kg)`
                      : isBlMode
                        ? "Save the current BL batch weight"
                        : isGlMode
                          ? "Save the current GL batch weight"
                        : "Save weight to the current capture session"
                }
                className={`w-full rounded-xl py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                  !saveWeightDisabled
                    ? "cursor-pointer bg-emerald-600 text-white shadow-[0_0_14px_rgba(52,211,153,0.45)] hover:bg-emerald-500"
                    : "cursor-not-allowed bg-slate-800 text-slate-600"
                }`}
              >
                <span className="flex flex-col items-center gap-1">
                  <CheckCircle2 className={`h-4 w-4 ${!saveWeightDisabled ? "text-emerald-200" : "text-slate-700"}`} />
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
                disabled={finalCaptureDisabled}
                className={`rounded-lg px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  !finalCaptureDisabled
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
                {persistedOrderId !== null
                  ? isBlMode
                    ? "Captured BL outputs are saved for the selected batch. Use OutWard to move the batch to GL and release the assigned bin."
                    : isGlMode
                      ? "Captured GL outputs are saved for the selected batch. Use OutWard to move the batch to PR and release the assigned bag."
                      : "Final-captured recipe outputs are saved for this production order and reload when you reopen it."
                  : "Final-captured recipe outputs stay listed below the weightage panel until this order is saved."}
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {visibleCapturedOutputs.length} record{visibleCapturedOutputs.length === 1 ? "" : "s"}
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
                  <th className="px-3 py-3">QR</th>
                  <th className="px-3 py-3">Scancode ID</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Weight (kg)</th>
                  <th className="px-4 py-3 text-right">{isAdMode ? "Batch ID" : isGlMode ? "Baglot" : "Binlot"}</th>
                  {isAdMode ? <th className="px-4 py-3 text-right">Production Status</th> : null}
                  {isBlMode || isGlMode ? <th className="px-4 py-3 text-right">OutWard</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleCapturedOutputs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[12px] text-slate-500">
                      {isBlMode
                        ? "Save the stable BL batch weight, use Final Capture to create the output list, then click OutWard to move the batch to GL."
                        : isGlMode
                          ? "Save the stable GL batch weight, use Final Capture to create the output list, then click OutWard to move the batch to PR."
                          : "Capture each recipe component, then use Final Capture to create the output list."}
                    </td>
                  </tr>
                ) : (
                  visibleCapturedOutputs.map((record, index) => {
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
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              aria-label="Preview QR Label"
                              title="Preview QR Label"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                              onClick={() => setQrLabelRecord(record)}
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </button>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] font-semibold text-slate-900">{record.scancodeId}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-800">{record.qty}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-800">{record.weightKg}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                            {isAdMode ? record.batchId : record.binlot}
                          </td>
                          {isAdMode ? (
                            <td className="px-4 py-3 text-right">
                              <StatusBadge status={record.productionStatus} classes={BATCH_STATUS_CLASSES} />
                            </td>
                          ) : null}
                          {isBlMode || isGlMode ? (
                            <td className="px-4 py-3 text-right">
                              {record.isOutwarded ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                  Moved
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleOutward(record)}
                                  disabled={outwardingRecordId !== null}
                                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                                    outwardingRecordId === record.id
                                      ? "cursor-wait bg-red-200 text-red-700"
                                      : outwardingRecordId !== null
                                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                  }`}
                                >
                                  {outwardingRecordId === record.id ? "Moving..." : "Out"}
                                </button>
                              )}
                            </td>
                          ) : null}
                        </tr>
                        {isExpanded ? (
                          <tr className="border-t border-slate-200/60 bg-slate-50/70">
                            <td colSpan={9} className="p-0">
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

    {qrLabelRecord ? (
      <QRLabelPreviewModal
        record={qrLabelRecord}
        context={{
          productionId,
          productionFor: productionFor ?? "",
          itemName: finishedGoods?.item_name ?? "",
          itemCode: finishedGoods?.item_code ?? "",
        } satisfies QRLabelContext}
        onClose={() => setQrLabelRecord(null)}
      />
    ) : null}
    </>
  );
};

export default ProductionOutputTab;
