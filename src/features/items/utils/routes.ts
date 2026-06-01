import { Archive, Blend, Box, type LucideIcon } from "lucide-react";

export const INVENTORY_ROUTE = "/app/items";
export const STORE_INVENTORY_ROUTE = `${INVENTORY_ROUTE}/store-inventory`;
export const BLENDING_INVENTORY_ROUTE = `${INVENTORY_ROUTE}/blending-inventory`;

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
    to: BLENDING_INVENTORY_ROUTE,
    icon: Blend,
    label: "Blending Inventory",
    description: "Monitor blending stock rows and item movement activity.",
  },
];

export const inventoryWorkspaceGroupIcon = Box;
