import { describe, expect, it } from "vitest";
import { getProductionBatchCountLabel } from "@/features/production/components/productionListShared";

describe("getProductionBatchCountLabel", () => {
  it("returns the stage batch count as text for production list rows", () => {
    expect(getProductionBatchCountLabel({ batch_count: 4 })).toBe("4");
  });

  it("keeps zero counts visible instead of falling back to batch ids", () => {
    expect(getProductionBatchCountLabel({ batch_count: 0 })).toBe("0");
  });
});
