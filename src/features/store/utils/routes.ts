import { Archive, Box, FileText, Route, type LucideIcon } from "lucide-react";

export const STORE_ROUTE = "/app/store";
export const STORE_STOCK_ROUTE = `${STORE_ROUTE}/stock`;
export const STORE_REQUEST_PROCESS_ROUTE = `${STORE_ROUTE}/request-process`;
export const STORE_RELEASE_STOCK_ROUTE = `${STORE_ROUTE}/release-stock`;
export const STORE_CLOSED_WON_ROUTE = `${STORE_ROUTE}/closed-won`;
export const STORE_REQUEST_ROUTE = `${STORE_ROUTE}/request`;
export const STORE_TRANSACTIONS_ROUTE = `${STORE_ROUTE}/transactions`;

export const getStoreStockDetailRoute = (itemId: number | string) => `${STORE_STOCK_ROUTE}/${itemId}`;

export type StoreWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
  activeMatchPaths?: string[];
};

export const storeWorkspaceModuleDefinitions: StoreWorkspaceModuleDefinition[] = [
  {
    to: STORE_STOCK_ROUTE,
    icon: Box,
    label: "Store Stock",
    description: "Monitor current store stock balances and movement access by item.",
  },
  {
    to: STORE_REQUEST_ROUTE,
    icon: FileText,
    label: "Request Approval's",
    description: "Process requests, release stock, and review completed handovers in one workspace.",
    activeMatchPaths: [
      STORE_REQUEST_ROUTE,
      STORE_REQUEST_PROCESS_ROUTE,
      STORE_RELEASE_STOCK_ROUTE,
      STORE_CLOSED_WON_ROUTE,
    ],
  },
  {
    to: STORE_TRANSACTIONS_ROUTE,
    icon: Route,
    label: "Store Transactions",
    description: "Audit stock inwards and outwards with reference and department history.",
  },
];

export const storeWorkspaceGroupIcon = Archive;
