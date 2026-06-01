import { describe, expect, it } from "vitest";
import {
  areAllRequiredOutputComponentsCaptured,
  buildCapturedOutputRecord,
  formatOutputDate,
  formatOutputDetailDateTime,
  formatOutputTime,
  getMissingRequiredOutputComponents,
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
});
