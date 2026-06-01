import { Blend, Box, FileText, Route, type LucideIcon } from "lucide-react";

export const BLENDING_ROUTE = "/app/blending";
export const BLENDING_STOCK_ROUTE = `${BLENDING_ROUTE}/stock`;
export const BLENDING_STORE_REQUEST_ROUTE = `${BLENDING_ROUTE}/store-request`;
export const BLENDING_TRANSACTIONS_ROUTE = `${BLENDING_ROUTE}/transactions`;

export type BlendingWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const blendingWorkspaceModuleDefinitions: BlendingWorkspaceModuleDefinition[] = [
  {
    to: BLENDING_STOCK_ROUTE,
    icon: Box,
    label: "Blending Stock",
    description: "Monitor current blending stock balances and stock movement.",
  },
  {
    to: BLENDING_STORE_REQUEST_ROUTE,
    icon: FileText,
    label: "Store Request",
    description: "Raise and manage blending store requests for material needs.",
  },
  {
    to: BLENDING_TRANSACTIONS_ROUTE,
    icon: Route,
    label: "Blending Transactions",
    description: "Review approved, pending, and rejected blending transfers.",
  },
];

export const blendingWorkspaceGroupIcon = Blend;
