import { Archive, Blend, Box, type LucideIcon } from "lucide-react";

export const INVENTORY_ROUTE = "/app/items";
export const STORE_INVENTORY_ROUTE = `${INVENTORY_ROUTE}/store-inventory`;
export const BLENDING_INVENTORY_ROUTE = `${INVENTORY_ROUTE}/blending-inventory`;
export const PRODUCTION_INVENTORY_ROUTE = `${INVENTORY_ROUTE}/production-inventory`;

export type InventoryWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const inventoryWorkspaceModuleDefinitions: InventoryWorkspaceModuleDefinition[] = [
  {
    to: STORE_INVENTORY_ROUTE,
    icon: Archive,
    label: "Store Inventory",
    description: "Monitor store stock rows, balances, and movement access.",
  },
  {
    to: PRODUCTION_INVENTORY_ROUTE,
    icon: Blend,
    label: "Production Inventory",
    description: "Track production inventory movement across all stages from blending to line.",
  },
];

export const inventoryWorkspaceGroupIcon = Box;
