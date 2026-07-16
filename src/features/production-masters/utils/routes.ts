import {
  Archive,
  Box,
  Cog,
  Droplet,
  Factory,
  GitBranch,
  Palette,
  Package,
  PackageSearch,
  Recycle,
  Ruler,
  Scale,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export const PRODUCTION_MASTERS_ROUTE = "/masters/production-masters";

export type ProductionMasterModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const productionMasterModuleDefinitions: ProductionMasterModuleDefinition[] = [
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/profile-creations`,
    icon: PackageSearch,
    label: "Profile Creations",
    description: "Create and maintain finished profile/product specifications.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/profile-sizes`,
    icon: Ruler,
    label: "Profile Size",
    description: "Manage profile dimensions such as width, thickness, length, and UOM.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/color-creations`,
    icon: Palette,
    label: "Color Creations",
    description: "Manage production colors and color groups.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/machine-creations`,
    icon: Cog,
    label: "Machine Creations",
    description: "Maintain production machines, machine types, capacities, and status.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/work-centre-creations`,
    icon: Factory,
    label: "Work Centre Creations",
    description: "Manage production work centres by department and capacity.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/production-lines`,
    icon: GitBranch,
    label: "Production Line",
    description: "Configure production lines, machines, capacities, and running status.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/bin-creations`,
    icon: Archive,
    label: "Bin Creation",
    description: "Manage bins used for production material handling.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/bag-creations`,
    icon: Package,
    label: "Bag Creation",
    description: "Manage production bags and standard weight configurations.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/packing-types`,
    icon: Box,
    label: "Packing Type",
    description: "Define packing types, standard pieces, and standard weight.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/packing-materials`,
    icon: Droplet,
    label: "Packing Material",
    description: "Configure packing materials and standard consumption.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/tare-masters`,
    icon: Scale,
    label: "Tare Master",
    description: "Set the container tare weight used on each production stage's output capture screen.",
  },
];

export const extrusionMasterModuleDefinitions: ProductionMasterModuleDefinition[] = [
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/extrusion-profile-configs`,
    icon: SlidersHorizontal,
    label: "Extrusion Profile Config",
    description: "Configure section weight, tolerance and default tare/packet size per profile for extrusion weight validation.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/scrap-categories`,
    icon: Recycle,
    label: "Scrap Category",
    description: "Maintain the extrusion scrap category master.",
  },
  {
    to: `${PRODUCTION_MASTERS_ROUTE}/scrap-reasons`,
    icon: Recycle,
    label: "Scrap Reason",
    description: "Maintain the extrusion scrap reason master grouped by category.",
  },
];
