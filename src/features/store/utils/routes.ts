import { Archive, Box, FileText, Route, type LucideIcon } from "lucide-react";

export const STORE_ROUTE = "/app/store";
export const STORE_STOCK_ROUTE = `${STORE_ROUTE}/stock`;
export const STORE_REQUEST_ROUTE = `${STORE_ROUTE}/request`;
export const STORE_TRANSACTIONS_ROUTE = `${STORE_ROUTE}/transactions`;

export const getStoreStockDetailRoute = (itemId: number | string) => `${STORE_STOCK_ROUTE}/${itemId}`;

export type StoreWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
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
    description: "Review and action department store requests with approval workflow context.",
  },
  {
    to: STORE_TRANSACTIONS_ROUTE,
    icon: Route,
    label: "Store Transactions",
    description: "Audit stock inwards and outwards with reference and department history.",
  },
];

export const storeWorkspaceGroupIcon = Archive;
