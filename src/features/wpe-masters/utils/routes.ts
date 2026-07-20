import {
  Building2,
  Factory,
  Layers,
  MapPin,
  PackageSearch,
  Recycle,
  Ruler,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";

export type InventoryStoreModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
  activeMatchPaths?: string[];
};

export const inventoryStoreModuleDefinitions: InventoryStoreModuleDefinition[] = [
  {
    to: WPE_PRODUCT_TYPES_ROUTE,
    icon: Layers,
    label: "Item Category",
    description: "Manage item categories, related sub categories, and their item variants.",
    activeMatchPaths: [WPE_PRODUCT_TYPES_ROUTE, WPE_PRODUCT_SUBTYPES_ROUTE, WPE_ITEM_VARIANTS_ROUTE],
  },
  {
    to: "/wpe-masters/units",
    icon: Ruler,
    label: "Unit",
    description: "Manage unit of measurement records.",
  },
  {
    to: "/wpe-masters/stores",
    icon: Store,
    label: "Store",
    description: "Manage store master records.",
  },
  {
    to: "/wpe-masters/warehouses",
    icon: Warehouse,
    label: "Warehouse",
    description: "Manage warehouses by type.",
  },
  {
    to: "/wpe-masters/locations",
    icon: MapPin,
    label: "Location",
    description: "Manage locations grouped by GRN, blending, and warehouse stock centers.",
  },
  {
    to: "/wpe-masters/production-types",
    icon: Factory,
    label: "Production Type",
    description: "Manage existing production type records.",
  },
  {
    to: "/wpe-masters/sale-types",
    icon: Truck,
    label: "Sale Type",
    description: "Manage existing sale type records.",
  },
  {
    to: "/wpe-masters/purchase-types",
    icon: ShoppingCart,
    label: "Purchase Type",
    description: "Manage existing purchase type records.",
  },
  {
    to: "/wpe-masters/scrap-types",
    icon: Recycle,
    label: "Scrap Type",
    description: "Manage PR scrap type records by startup, setup, process, and downtime.",
  },
];

export const inventoryStoreAdminModuleDefinitions: InventoryStoreModuleDefinition[] = [
  {
    to: "/wpe-masters/departments",
    icon: Building2,
    label: "Department",
    description: "Manage department structure, heads, and administrative ownership.",
  },
  {
    to: "/wpe-masters/designations",
    icon: Tag,
    label: "Designation",
    description: "Manage designations grouped under departments.",
  },
  {
    to: "/wpe-masters/roles",
    icon: PackageSearch,
    label: "Role",
    description: "Manage roles mapped to designations and user setup.",
  },
];

export const isInventoryStoreMastersPath = (path: string) =>
  path === INVENTORY_STORE_MASTERS_ROUTE || inventoryStoreModuleDefinitions.some((module) => {
    if (module.exact) {
      return path === module.to;
    }
    if (module.activeMatchPaths?.length) {
      return module.activeMatchPaths.some((matchPath) => path === matchPath || path.startsWith(matchPath));
    }
    return path === module.to || path.startsWith(`${module.to}/`);
  });
