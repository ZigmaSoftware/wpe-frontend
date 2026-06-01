import {
  Box,
  Boxes,
  FileText,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";

export const RECIPE_BOM_MASTERS_ROUTE = "/masters/recipe-bom-masters";

export type RecipeBomMasterModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
  activeMatchPaths?: string[];
};

export const recipeBomMasterModuleDefinitions: RecipeBomMasterModuleDefinition[] = [
  {
    to: `${RECIPE_BOM_MASTERS_ROUTE}/recipe-creations`,
    icon: FileText,
    label: "Recipe Creation",
    description: "Create and maintain production recipes, batch sizes, versions, and approval status.",
  },
  {
    to: `${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`,
    icon: PackageSearch,
    label: "Recipe Item Creation",
    description: "Define recipe input items with standard, minimum, and maximum weight limits.",
    activeMatchPaths: [`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`, "/oims/bom-variants"],
  },
  {
    to: `${RECIPE_BOM_MASTERS_ROUTE}/bom-creations`,
    icon: Box,
    label: "BOM Creation",
    description: "Create and maintain bill of materials records for production outputs.",
  },
  {
    to: `${RECIPE_BOM_MASTERS_ROUTE}/bom-item-creations`,
    icon: Boxes,
    label: "BOM Item Creation",
    description: "Define BOM item requirements by item type, quantity, and UOM.",
  },
];
