import type { ProductionBatch } from "@/lib/types";

export type ProductionUiStage = NonNullable<ProductionBatch["stage"]>;

export type ProductionStageUiMeta = {
  stage: ProductionUiStage;
  createTitle: string;
  createSubtitle: string;
  createButtonLabel: string;
  backToListLabel: string;
  defaultProductionType: string;
  assignmentTitle: string;
  assignmentSubtitle: string;
  manageBatchBackLabel: string;
  manageBatchPageTitle: string;
  manageBatchListTitle: string;
};

export const PRODUCTION_STAGE_UI: Record<ProductionUiStage, ProductionStageUiMeta> = {
  AD: {
    stage: "AD",
    createTitle: "New Additive Creation",
    createSubtitle: "Create and plan a new additive production order.",
    createButtonLabel: "Create Additive",
    backToListLabel: "Back to AD List",
    defaultProductionType: "WPE Additive Production",
    assignmentTitle: "Batch Creation",
    assignmentSubtitle: "Capture and finalize additive output for the selected batch.",
    manageBatchBackLabel: "Back to AD List",
    manageBatchPageTitle: "AD - Manage Batch",
    manageBatchListTitle: "AD - Batch List",
  },
  BL: {
    stage: "BL",
    createTitle: "New Blending Creation",
    createSubtitle: "Create and plan a new blending production order.",
    createButtonLabel: "Create Blending",
    backToListLabel: "Back to BL List",
    defaultProductionType: "WPE Blend Production",
    assignmentTitle: "Bin Assign",
    assignmentSubtitle: "Capture and finalize blending output for the selected bin.",
    manageBatchBackLabel: "Back to BL List",
    manageBatchPageTitle: "BL - Manage Batch",
    manageBatchListTitle: "BL - Batch List",
  },
  GL: {
    stage: "GL",
    createTitle: "New Granulation Creation",
    createSubtitle: "Create and plan a new granulation production order.",
    createButtonLabel: "Create Granulation",
    backToListLabel: "Back to GL List",
    defaultProductionType: "WPE Granulated Blend Production",
    assignmentTitle: "Bag Assign",
    assignmentSubtitle: "Capture and finalize granulation output for the selected bag.",
    manageBatchBackLabel: "Back to GL List",
    manageBatchPageTitle: "GL - Manage Batch",
    manageBatchListTitle: "GL - Batch List",
  },
  PR: {
    stage: "PR",
    createTitle: "New Production Creation",
    createSubtitle: "Create and plan a new production order.",
    createButtonLabel: "Create Production",
    backToListLabel: "Back to Production List",
    defaultProductionType: "WPE Production Line",
    assignmentTitle: "Line Assign",
    assignmentSubtitle: "Capture and finalize production-stage output for the selected line.",
    manageBatchBackLabel: "Back to Production List",
    manageBatchPageTitle: "PR - Manage Batch",
    manageBatchListTitle: "PR - Batch List",
  },
};

export const getProductionStageUi = (stage?: ProductionUiStage | null) =>
  PRODUCTION_STAGE_UI[stage ?? "AD"];
