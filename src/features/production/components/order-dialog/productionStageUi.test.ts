import { describe, expect, it } from "vitest";
import { getProductionStageUi } from "./productionStageUi";

describe("productionStageUi", () => {
  it("returns exact create labels for all supported stages", () => {
    expect(getProductionStageUi("AD")).toMatchObject({
      createTitle: "New Additive Creation",
      createButtonLabel: "Create Additive",
      backToListLabel: "Back to AD List",
      defaultProductionType: "WPE Additive Production",
    });

    expect(getProductionStageUi("BL")).toMatchObject({
      createTitle: "New Blending Creation",
      createButtonLabel: "Create Blending",
      backToListLabel: "Back to BL List",
      defaultProductionType: "WPE Blend Production",
    });

    expect(getProductionStageUi("GL")).toMatchObject({
      createTitle: "New Granulation Creation",
      createButtonLabel: "Create Granulation",
      backToListLabel: "Back to GL List",
      defaultProductionType: "WPE Granulated Blend Production",
    });

    expect(getProductionStageUi("PR")).toMatchObject({
      createTitle: "New Production Creation",
      createButtonLabel: "Create Production",
      backToListLabel: "Back to Production List",
      defaultProductionType: "WPE Production Line",
    });
  });
});
