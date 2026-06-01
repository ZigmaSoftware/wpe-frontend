import {
  Archive,
  Boxes,
  Database,
  Factory,
  LayoutDashboard,
  Recycle,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminMenuMain } from "@/features/admin-master/types";
import {
  ADMIN_MASTERS_ROUTE,
  adminModuleDefinitions,
  getAdminMastersModulesFromMenu,
} from "@/features/admin-master/utils/routes";
import { blendingWorkspaceModuleDefinitions, BLENDING_ROUTE } from "@/features/blending/utils/routes";
import { commonModuleDefinitions, COMMON_MASTERS_ROUTE } from "@/features/common-master/utils/routes";
import {
  deviceLabelMasterModuleDefinitions,
  DEVICE_LABEL_MASTERS_ROUTE,
} from "@/features/device-label-masters/utils/routes";
import { GRN_PROCESS_ROUTE, grnWorkspaceModuleDefinitions, GRN_ROUTE } from "@/features/grn/utils/routes";
import { inventoryWorkspaceModuleDefinitions } from "@/features/items/utils/routes";
import {
  PRODUCTION_MANAGE_BATCH_ROUTE_PREFIX,
  PRODUCTION_NEW_ORDER_ROUTE,
  PRODUCTION_ROUTE,
  productionWorkspaceModuleDefinitions,
} from "@/features/production/utils/routes";
import {
  productionMasterModuleDefinitions,
  PRODUCTION_MASTERS_ROUTE,
} from "@/features/production-masters/utils/routes";
import {
  recipeBomMasterModuleDefinitions,
  RECIPE_BOM_MASTERS_ROUTE,
} from "@/features/recipe-bom-masters/utils/routes";
import { storeWorkspaceModuleDefinitions, STORE_ROUTE } from "@/features/store/utils/routes";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";
import { inventoryStoreModuleDefinitions } from "@/features/wpe-masters/utils/routes";

export type AppNavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
  activeMatchPaths?: string[];
  activeExactPaths?: string[];
};

export type AppNavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  tag?: string;
  items: AppNavItem[];
};

export type AppNavigation = {
  dashboard: AppNavItem;
  workspace: AppNavGroup[];
  masters: AppNavGroup[];
};

export type AppBreadcrumb = {
  label: string;
  to?: string;
};

export type AppSearchLink = {
  to: string;
  label: string;
  description: string;
  section: "Dashboard" | "WPE Workspace" | "Masters";
  group?: string;
  icon: LucideIcon;
};

export const DASHBOARD_SECTION_LABEL = "Dashboard";
export const WORKSPACE_SECTION_LABEL = "WPE Workspace";
export const MASTERS_SECTION_LABEL = "Masters";

const dashboardItem: AppNavItem = {
  to: "/app/dashboard",
  icon: LayoutDashboard,
  label: DASHBOARD_SECTION_LABEL,
  description: "Plant-wide dashboard and shared operational overview.",
  exact: true,
  activeExactPaths: ["/app", "/dashboard", "/app/dashboard"],
};

export const isNavItemActive = (pathname: string, item: AppNavItem) => {
  if (item.activeExactPaths?.some((candidate) => pathname === candidate)) {
    return true;
  }

  if (item.activeMatchPaths?.some((candidate) => pathname === candidate || pathname.startsWith(candidate))) {
    return true;
  }

  if (item.exact) {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

export const isNavGroupActive = (pathname: string, group: AppNavGroup) =>
  Boolean(group.to && (pathname === group.to || pathname.startsWith(`${group.to}/`))) ||
  group.items.some((item) => isNavItemActive(pathname, item));

export const buildAppNavigation = (adminMenu: AdminMenuMain[] = []): AppNavigation => {
  const adminModules = getAdminMastersModulesFromMenu(adminMenu);

  const workspace: AppNavGroup[] = [
    {
      key: "inventory",
      label: "Inventory",
      icon: Boxes,
      items: inventoryWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
    {
      key: "blending",
      label: "Blending",
      icon: Factory,
      to: BLENDING_ROUTE,
      items: blendingWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
    {
      key: "production",
      label: "Production",
      icon: Factory,
      tag: "MES",
      to: PRODUCTION_ROUTE,
      items: productionWorkspaceModuleDefinitions.map(({ to, icon, label, description, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        activeMatchPaths,
      })),
    },
    {
      key: "store",
      label: "Store",
      icon: Archive,
      to: STORE_ROUTE,
      items: storeWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
    {
      key: "grn",
      label: "GRN",
      icon: Archive,
      to: GRN_ROUTE,
      items: grnWorkspaceModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })),
    },
    {
      key: "contacts",
      label: "Contacts",
      icon: Users,
      items: [
        {
          to: "/app/contacts",
          icon: Users,
          label: "Contacts",
          description: "Browse and maintain contact records and forms.",
        },
      ],
    },
    {
      key: "regrind",
      label: "Regrind",
      icon: Recycle,
      items: [
        {
          to: "/app/regrind",
          icon: Recycle,
          label: "Regrind",
          description: "Track regrind flow, usage, and related records.",
        },
      ],
    },
  ];

  const masters: AppNavGroup[] = [];

  if (adminModules.length > 0 || adminMenu.length === 0) {
    masters.push({
      key: "admin-masters",
      label: "Admin Masters",
      icon: Shield,
      to: ADMIN_MASTERS_ROUTE,
      items: (adminModules.length > 0 ? adminModules : adminModuleDefinitions).map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    });
  }

  masters.push(
    {
      key: "common-masters",
      label: "Common Masters",
      icon: Database,
      to: COMMON_MASTERS_ROUTE,
      items: commonModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
    {
      key: "inventory-store-masters",
      label: "Inventory & Store Masters",
      icon: inventoryStoreModuleDefinitions[0]?.icon ?? Database,
      to: INVENTORY_STORE_MASTERS_ROUTE,
      items: inventoryStoreModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })),
    },
    {
      key: "production-masters",
      label: "Production Masters",
      icon: productionMasterModuleDefinitions[0]?.icon ?? Database,
      to: PRODUCTION_MASTERS_ROUTE,
      items: productionMasterModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
    {
      key: "recipe-bom-masters",
      label: "Recipe / BOM Masters",
      icon: recipeBomMasterModuleDefinitions[0]?.icon ?? Database,
      to: RECIPE_BOM_MASTERS_ROUTE,
      items: recipeBomMasterModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })),
    },
    {
      key: "device-label-masters",
      label: "Device & Label Masters",
      icon: deviceLabelMasterModuleDefinitions[0]?.icon ?? Database,
      to: DEVICE_LABEL_MASTERS_ROUTE,
      items: deviceLabelMasterModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })),
    },
  );

  return {
    dashboard: dashboardItem,
    workspace,
    masters,
  };
};

export const flattenNavigationLinks = (navigation: AppNavigation): AppSearchLink[] => [
  {
    to: navigation.dashboard.to,
    label: navigation.dashboard.label,
    description: navigation.dashboard.description,
    section: DASHBOARD_SECTION_LABEL,
    icon: navigation.dashboard.icon,
  },
  ...navigation.workspace.flatMap((group) =>
    group.items.map((item) => ({
      to: item.to,
      label: item.label,
      description: item.description,
      section: WORKSPACE_SECTION_LABEL,
      group: group.label,
      icon: item.icon,
    })),
  ),
  ...navigation.masters.flatMap((group) =>
    group.items.map((item) => ({
      to: item.to,
      label: item.label,
      description: item.description,
      section: MASTERS_SECTION_LABEL,
      group: group.label,
      icon: item.icon,
    })),
  ),
];

export const getTopLevelNavKey = (pathname: string, navigation: AppNavigation) => {
  if (isNavItemActive(pathname, navigation.dashboard)) {
    return "dashboard" as const;
  }

  if (navigation.workspace.some((group) => isNavGroupActive(pathname, group))) {
    return "workspace" as const;
  }

  if (navigation.masters.some((group) => isNavGroupActive(pathname, group))) {
    return "masters" as const;
  }

  return null;
};

export const buildBreadcrumbs = (pathname: string, navigation: AppNavigation): AppBreadcrumb[] => {
  if (isNavItemActive(pathname, navigation.dashboard)) {
    return [{ label: DASHBOARD_SECTION_LABEL }];
  }

  if (pathname.startsWith(`${PRODUCTION_MANAGE_BATCH_ROUTE_PREFIX}/`)) {
    return [
      { label: WORKSPACE_SECTION_LABEL },
      { label: "Production", to: PRODUCTION_ROUTE },
      { label: "Manage Batch" },
    ];
  }

  if (pathname === PRODUCTION_NEW_ORDER_ROUTE) {
    return [
      { label: WORKSPACE_SECTION_LABEL },
      { label: "Production", to: PRODUCTION_ROUTE },
      { label: "New Order" },
    ];
  }

  if (/^\/app\/production\/[^/]+\/edit\/?$/.test(pathname)) {
    return [
      { label: WORKSPACE_SECTION_LABEL },
      { label: "Production", to: PRODUCTION_ROUTE },
      { label: "Edit Order" },
    ];
  }

  if (/^\/wpe-masters\/product-types\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Category", to: WPE_PRODUCT_TYPES_ROUTE },
      { label: "Item Sub Category" },
    ];
  }

  for (const group of navigation.workspace) {
    const match = group.items.find((item) => isNavItemActive(pathname, item));
    if (match) {
      return [
        { label: WORKSPACE_SECTION_LABEL },
        { label: group.label, to: group.to ?? match.to },
        { label: match.label },
      ];
    }

    if (group.to && pathname === group.to) {
      return [{ label: WORKSPACE_SECTION_LABEL }, { label: group.label }];
    }
  }

  for (const group of navigation.masters) {
    const match = group.items.find((item) => isNavItemActive(pathname, item));
    if (match) {
      return [
        { label: MASTERS_SECTION_LABEL },
        { label: group.label, to: group.to ?? match.to },
        { label: match.label },
      ];
    }

    if (group.to && pathname === group.to) {
      return [{ label: MASTERS_SECTION_LABEL }, { label: group.label }];
    }
  }

  return [];
};
