import { Blend, Box, ClipboardCheck, Route, type LucideIcon } from "lucide-react";

export const BLENDING_ROUTE = "/app/blending";
export const BLENDING_STOCK_ROUTE = `${BLENDING_ROUTE}/stock`;
export const BLENDING_STORE_REQUEST_ROUTE = `${BLENDING_ROUTE}/store-request`;
export const BLENDING_TRANSACTIONS_ROUTE = `${BLENDING_ROUTE}/transactions`;
export const BLENDING_HEAD_APPROVAL_ROUTE = `${BLENDING_ROUTE}/head-approval`;

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
    to: BLENDING_TRANSACTIONS_ROUTE,
    icon: Route,
    label: "Blending Transactions",
    description: "Review approved, pending, and rejected blending transfers.",
  },
  {
    to: BLENDING_HEAD_APPROVAL_ROUTE,
    icon: ClipboardCheck,
    label: "Blending Head Approval",
    description: "Review pending Blending Store Requests before Store issue.",
  },
];

export const blendingWorkspaceGroupIcon = Blend;
