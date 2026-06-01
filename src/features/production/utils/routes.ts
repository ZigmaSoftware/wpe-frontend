import { Blend, Box, Layers, Scale, type LucideIcon } from "lucide-react";

export const PRODUCTION_ROUTE = "/app/production";
export const PRODUCTION_AD_WEIGHTAGE_ROUTE = `${PRODUCTION_ROUTE}/ad-weightage`;
export const PRODUCTION_BL_BLENDING_ROUTE = `${PRODUCTION_ROUTE}/bl-blending`;
export const PRODUCTION_GL_GRANULATION_ROUTE = `${PRODUCTION_ROUTE}/gl-granulation`;
export const PRODUCTION_PR_PRODUCTION_ROUTE = `${PRODUCTION_ROUTE}/pr-production`;
export const PRODUCTION_NEW_ORDER_ROUTE = `${PRODUCTION_ROUTE}/neworder`;
export const PRODUCTION_MANAGE_BATCH_ROUTE_PREFIX = `${PRODUCTION_ROUTE}/manage-batch`;

export const getProductionManageBatchRoute = (orderId: number | string) =>
  `${PRODUCTION_MANAGE_BATCH_ROUTE_PREFIX}/${orderId}`;
export const getProductionEditRoute = (orderId: number | string) => `${PRODUCTION_ROUTE}/${orderId}/edit`;

export type ProductionWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  activeMatchPaths?: string[];
};

export const productionWorkspaceModuleDefinitions: ProductionWorkspaceModuleDefinition[] = [
  {
    to: PRODUCTION_AD_WEIGHTAGE_ROUTE,
    icon: Scale,
    label: "AD - Weightage",
    description: "Manage production orders and move into raw-material weightage batches.",
    activeMatchPaths: [
      PRODUCTION_AD_WEIGHTAGE_ROUTE,
      PRODUCTION_NEW_ORDER_ROUTE,
      PRODUCTION_MANAGE_BATCH_ROUTE_PREFIX,
    ],
  },
  {
    to: PRODUCTION_BL_BLENDING_ROUTE,
    icon: Blend,
    label: "BL - Blending",
    description: "Review blending-stage production batches and their live statuses.",
  },
  {
    to: PRODUCTION_GL_GRANULATION_ROUTE,
    icon: Box,
    label: "GL - Granulation",
    description: "Review granulation-stage production batches and their live statuses.",
  },
  {
    to: PRODUCTION_PR_PRODUCTION_ROUTE,
    icon: Layers,
    label: "PR - Production",
    description: "Review final production-stage orders with running and closed records.",
  },
];

export const productionWorkspaceGroupIcon = Layers;
