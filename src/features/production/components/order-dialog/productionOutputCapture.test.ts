import { describe, expect, it } from "vitest";
import {
  areAllRequiredOutputComponentsCaptured,
  buildCapturedOutputRecord,
  formatOutputDate,
  formatOutputDetailDateTime,
  formatOutputTime,
  getMissingRequiredOutputComponents,
  mapBatchWeightEntryToOutputComponent,
  mapBomVariantComponentToOutputComponent,
  mapPersistedOutputCaptureRecord,
  resolveOutputCaptureComponents,
  type OutputCaptureComponent,
  type OutputComponentCapture,
} from "./productionOutputCapture";

const componentsFixture: OutputCaptureComponent[] = [
  {
    id: "cmp-1",
    itemCode: "WGO:2001",
    itemName: "Wood Powder",
    plannedWeightKg: 55,
    sequence: 1,
  },
  {
    id: "cmp-2",
    itemCode: "HDP:2020",
    itemName: "HDPE Chips (White)",
    plannedWeightKg: 22.9,
    sequence: 2,
  },
];

const buildCaptureMap = () =>
  new Map<string, OutputComponentCapture>([
    [
      "cmp-1",
      {
        componentId: "cmp-1",
        weightKg: 55,
        capturedAt: new Date("2026-05-21T18:57:00+05:30"),
      },
    ],
    [
      "cmp-2",
      {
        componentId: "cmp-2",
        weightKg: 22.9,
        capturedAt: new Date("2026-05-21T19:04:00+05:30"),
      },
    ],
  ]);

describe("productionOutputCapture helpers", () => {
  it("prefers active batch entries over BOM and material rows", () => {
    const components = resolveOutputCaptureComponents({
      batchEntries: [
        {
          id: 5,
          batch: 3,
          bom_component: 12,
          item: 8,
          source_type: "ITEM",
          item_code: "GI000007",
          item_name: "Blend Resin 12a1b6ce",
          category: "Raw Material",
          target_weight_grams: "4.500",
          min_weight_grams: "4.400",
          max_weight_grams: "4.600",
          entered_weight_grams: null,
          is_valid: null,
          validation_notes: "",
          source: "MANUAL",
          entered_by: null,
          entered_by_username: null,
          entered_at: "2026-06-02T04:19:16.812391Z",
        },
      ],
      bomComponents: [
        {
          id: 99,
          item: 8,
          product_subtype: null,
          source_type: "ITEM",
          item_code: "GI000006",
          item_name: "Wrong BOM Component",
          category: "Raw Material",
          is_active: true,
          target_weight_grams: "1.000",
          min_weight_grams: "0.900",
          max_weight_grams: "1.100",
          sequence: 1,
          is_regrind: false,
          unit: "kgs",
        },
      ],
      materials: [
        {
          client_id: "edit-1",
          bom_component: 44,
          item_code: "GI000005",
          item_name: "Wrong Material Row",
          per_unit_quantity: "3.000",
          sequence: 1,
        },
      ],
    });

    expect(components).toEqual([
      expect.objectContaining({
        id: "12",
        bomComponentId: 12,
        itemCode: "GI000007",
        itemName: "Blend Resin 12a1b6ce",
        plannedWeightKg: 4.5,
        minWeightKg: 4.4,
        maxWeightKg: 4.6,
      }),
    ]);
  });

  it("uses BOM component bounds when no active batch exists", () => {
    const component = mapBomVariantComponentToOutputComponent({
      id: 12,
      item: 8,
      product_subtype: null,
      source_type: "ITEM",
      item_code: "GI000007",
      item_name: "Blend Resin 12a1b6ce",
      category: "Raw Material",
      is_active: true,
      target_weight_grams: "4.500",
      min_weight_grams: "4.400",
      max_weight_grams: "4.600",
      sequence: 2,
      is_regrind: false,
      unit: "kgs",
    });

    expect(component).toEqual(
      expect.objectContaining({
        id: "12",
        bomComponentId: 12,
        plannedWeightKg: 4.5,
        minWeightKg: 4.4,
        maxWeightKg: 4.6,
        sequence: 2,
      }),
    );
  });

  it("maps batch entries into stable capture components", () => {
    const component = mapBatchWeightEntryToOutputComponent(
      {
        bom_component: 12,
        item_code: "GI000007",
        item_name: "Blend Resin 12a1b6ce",
        target_weight_grams: "4.500",
        min_weight_grams: "4.400",
        max_weight_grams: "4.600",
      },
      0,
    );

    expect(component).toEqual(
      expect.objectContaining({
        id: "12",
        bomComponentId: 12,
        plannedWeightKg: 4.5,
        minWeightKg: 4.4,
        maxWeightKg: 4.6,
        sequence: 1,
      }),
    );
  });

  it("reports missing required recipe components before final capture", () => {
    const partialCaptureMap = new Map<string, OutputComponentCapture>([
      [
        "cmp-1",
        {
          componentId: "cmp-1",
          weightKg: 55,
          capturedAt: new Date("2026-05-21T18:57:00+05:30"),
        },
      ],
    ]);

    expect(areAllRequiredOutputComponentsCaptured(componentsFixture, partialCaptureMap)).toBe(false);
    expect(getMissingRequiredOutputComponents(componentsFixture, partialCaptureMap)).toEqual([
      expect.objectContaining({ id: "cmp-2", itemName: "HDPE Chips (White)" }),
    ]);
  });

  it("builds a captured output record from dynamic recipe components", () => {
    const capturedAt = new Date("2026-05-21T19:10:00+05:30");
    const record = buildCapturedOutputRecord({
      components: componentsFixture,
      capturedWeights: buildCaptureMap(),
      capturedAt,
      productionId: "02",
      batchNo: "BATCH-00000001",
      recipeNo: "WPE0129.5 RG",
      sequence: 1,
      binlot: "BATCH-00000001",
    });

    expect(record.scancodeId).toContain("BIN-BATCH00000001");
    expect(record.recipeNo).toBe("WPE0129.5 RG");
    expect(record.qty).toBe("77.900");
    expect(record.weightKg).toBe("77.900");
    expect(record.componentColumns).toEqual([
      { id: "cmp-1", label: "Wood Powder" },
      { id: "cmp-2", label: "HDPE Chips (White)" },
    ]);
    expect(record.details).toEqual([
      expect.objectContaining({
        componentId: "cmp-1",
        weightKg: "55.000",
      }),
      expect.objectContaining({
        componentId: "cmp-2",
        weightKg: "22.900",
      }),
    ]);
    expect(formatOutputDate(record.capturedAt)).toBe("21/05/2026");
    expect(formatOutputTime(record.capturedAt)).toBe("07:10 pm");
    expect(formatOutputDetailDateTime(record.details[0].capturedAt)).toBe("21/05/2026 06:57 pm");
  });

  it("maps persisted output captures into the UI record shape", () => {
    const record = mapPersistedOutputCaptureRecord({
      id: 7,
      production_order: 2,
      source_batch: 11,
      source_batch_no: "BATCH-00000011",
      sequence: 3,
      scancode_id: "BIN-BATCH00000011/ITEM-OUT003/REF-20260601123000",
      recipe_no: "BOM-AD-001",
      quantity_kg: "77.900",
      weight_kg: "77.900",
      binlot: "BATCH-00000011",
      is_outwarded: false,
      session_key: "cmp-1",
      captured_at: "2026-06-01T12:30:00Z",
      component_columns: [
        { id: 101, label: "Wood Powder" },
        { id: 102, label: "HDPE Chips (White)" },
      ],
      details: [
        {
          component_id: 101,
          item_code: "WGO:2001",
          item_name: "Wood Powder",
          weight_kg: "55.000",
          captured_at: "2026-06-01T12:20:00Z",
        },
        {
          component_id: 102,
          item_code: "HDP:2020",
          item_name: "HDPE Chips (White)",
          weight_kg: "22.900",
          captured_at: "2026-06-01T12:22:00Z",
        },
      ],
      created_at: "2026-06-01T12:30:00Z",
      updated_at: "2026-06-01T12:30:00Z",
    });

    expect(record.id).toBe("persisted-output-7");
    expect(record.sourceBatchId).toBe(11);
    expect(record.componentColumns).toEqual([
      { id: "101", label: "Wood Powder" },
      { id: "102", label: "HDPE Chips (White)" },
    ]);
    expect(record.isOutwarded).toBe(false);
    expect(record.details[0]).toEqual(
      expect.objectContaining({
        componentId: "101",
        itemCode: "WGO:2001",
        weightKg: "55.000",
      }),
    );
  });

  it("shows '-' when persisted binlot is still just the source batch number", () => {
    const record = mapPersistedOutputCaptureRecord({
      id: 8,
      production_order: 2,
      source_batch: 14,
      source_batch_no: "BATCH-00000014",
      sequence: 4,
      scancode_id: "02BL03062026161014",
      recipe_no: "BOM-BL-001",
      quantity_kg: "40.000",
      weight_kg: "40.000",
      binlot: "BATCH-00000014",
      is_outwarded: false,
      session_key: "bl-batch-14",
      captured_at: "2026-06-03T16:10:00Z",
      component_columns: [{ id: 14, label: "Bin Weight" }],
      details: [
        {
          component_id: 14,
          item_code: "BATCH-00000014",
          item_name: "Bin Weight",
          weight_kg: "40.000",
          captured_at: "2026-06-03T16:10:00Z",
        },
      ],
      created_at: "2026-06-03T16:10:00Z",
      updated_at: "2026-06-03T16:10:00Z",
    });

    expect(record.binlot).toBe("-");
  });

  it("maps outwarded BL output captures as outwarded rows", () => {
    const record = mapPersistedOutputCaptureRecord({
      id: 9,
      production_order: 2,
      source_batch: 17,
      source_batch_no: "BATCH-00000017",
      sequence: 5,
      scancode_id: "02BL03062026170017",
      recipe_no: "BOM-BL-002",
      quantity_kg: "4.000",
      weight_kg: "4.000",
      binlot: "BIN-B",
      is_outwarded: true,
      session_key: "bl-batch-17",
      captured_at: "2026-06-03T17:00:00Z",
      component_columns: [{ id: 17, label: "Bin Weight" }],
      details: [
        {
          component_id: 17,
          item_code: "BATCH-00000017",
          item_name: "Bin Weight",
          weight_kg: "4.000",
          captured_at: "2026-06-03T17:00:00Z",
        },
      ],
      created_at: "2026-06-03T17:00:00Z",
      updated_at: "2026-06-03T17:00:00Z",
    });

    expect(record.binlot).toBe("BIN-B");
    expect(record.isOutwarded).toBe(true);
  });
});
