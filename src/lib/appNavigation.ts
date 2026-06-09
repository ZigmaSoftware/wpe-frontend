import {
  Archive,
  Boxes,
  Database,
  Factory,
  FileText,
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
import { REQUESTS_ROUTE, requestsWorkspaceModuleDefinitions } from "@/features/requests/utils/routes";
import { storeWorkspaceModuleDefinitions, STORE_ROUTE } from "@/features/store/utils/routes";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";
import { inventoryStoreModuleDefinitions } from "@/features/wpe-masters/utils/routes";
import { hasAnyScreenAccess } from "@/features/admin-master/utils/permissions";
import { getRouteScreenCodes } from "@/lib/routePermissions";

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
  dashboard: AppNavItem | null;
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

export const DASHBOARD_SECTION_LABEL: AppSearchLink["section"] = "Dashboard";
export const WORKSPACE_SECTION_LABEL: AppSearchLink["section"] = "WPE Workspace";
export const MASTERS_SECTION_LABEL: AppSearchLink["section"] = "Masters";

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

type BuildAppNavigationOptions = {
  hasFullAccess?: boolean;
};

const filterAccessibleItems = (
  items: AppNavItem[],
  adminMenu: AdminMenuMain[],
  hasFullAccess: boolean,
) => items.filter((item) => hasFullAccess || hasAnyScreenAccess(adminMenu, getRouteScreenCodes(item.to)));

export const buildAppNavigation = (
  adminMenu: AdminMenuMain[] = [],
  options: BuildAppNavigationOptions = {},
): AppNavigation => {
  const hasFullAccess = Boolean(options.hasFullAccess);
  const adminModules = getAdminMastersModulesFromMenu(adminMenu);
  const dashboard = hasFullAccess || hasAnyScreenAccess(adminMenu, getRouteScreenCodes(dashboardItem.to))
    ? dashboardItem
    : null;

  const workspace: AppNavGroup[] = [
    {
      key: "inventory",
      label: "Inventory",
      icon: Boxes,
      items: filterAccessibleItems(inventoryWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "blending",
      label: "Blending",
      icon: Factory,
      to: BLENDING_ROUTE,
      items: filterAccessibleItems(blendingWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "production",
      label: "Production",
      icon: Factory,
      tag: "MES",
      to: PRODUCTION_ROUTE,
      items: filterAccessibleItems(productionWorkspaceModuleDefinitions.map(({ to, icon, label, description, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        activeMatchPaths,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "store",
      label: "Store",
      icon: Archive,
      to: STORE_ROUTE,
      items: filterAccessibleItems(storeWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "grn",
      label: "GRN",
      icon: Archive,
      to: GRN_ROUTE,
      items: filterAccessibleItems(grnWorkspaceModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "contacts",
      label: "Contacts",
      icon: Users,
      items: filterAccessibleItems([
        {
          to: "/app/contacts",
          icon: Users,
          label: "Contacts",
          description: "Browse and maintain contact records and forms.",
        },
      ], adminMenu, hasFullAccess),
    },
    {
      key: "regrind",
      label: "Regrind",
      icon: Recycle,
      items: filterAccessibleItems([
        {
          to: "/app/regrind",
          icon: Recycle,
          label: "Regrind",
          description: "Track regrind flow, usage, and related records.",
        },
      ], adminMenu, hasFullAccess),
    },
    {
      key: "requests",
      label: "Requests",
      icon: FileText,
      to: REQUESTS_ROUTE,
      items: filterAccessibleItems(requestsWorkspaceModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
  ].filter((group) => group.items.length > 0);

  const masters: AppNavGroup[] = [];

  if (adminModules.length > 0 || (hasFullAccess && adminMenu.length === 0)) {
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
      items: filterAccessibleItems(commonModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "inventory-store-masters",
      label: "Inventory & Store Masters",
      icon: inventoryStoreModuleDefinitions[0]?.icon ?? Database,
      to: INVENTORY_STORE_MASTERS_ROUTE,
      items: filterAccessibleItems(inventoryStoreModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "production-masters",
      label: "Production Masters",
      icon: productionMasterModuleDefinitions[0]?.icon ?? Database,
      to: PRODUCTION_MASTERS_ROUTE,
      items: filterAccessibleItems(productionMasterModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "recipe-bom-masters",
      label: "Recipe / BOM Masters",
      icon: recipeBomMasterModuleDefinitions[0]?.icon ?? Database,
      to: RECIPE_BOM_MASTERS_ROUTE,
      items: filterAccessibleItems(recipeBomMasterModuleDefinitions.map(({ to, icon, label, description, exact, activeMatchPaths }) => ({
        to,
        icon,
        label,
        description,
        exact,
        activeMatchPaths,
      })), adminMenu, hasFullAccess),
    },
    {
      key: "device-label-masters",
      label: "Device & Label Masters",
      icon: deviceLabelMasterModuleDefinitions[0]?.icon ?? Database,
      to: DEVICE_LABEL_MASTERS_ROUTE,
      items: filterAccessibleItems(deviceLabelMasterModuleDefinitions.map(({ to, icon, label, description }) => ({
        to,
        icon,
        label,
        description,
      })), adminMenu, hasFullAccess),
    },
  );

  return {
    dashboard,
    workspace,
    masters: masters.filter((group) => group.items.length > 0),
  };
};

export const flattenNavigationLinks = (navigation: AppNavigation): AppSearchLink[] => {
  const dashboardLinks: AppSearchLink[] = navigation.dashboard
    ? [{
      to: navigation.dashboard.to,
      label: navigation.dashboard.label,
      description: navigation.dashboard.description,
      section: DASHBOARD_SECTION_LABEL,
      icon: navigation.dashboard.icon,
    }]
    : [];

  const workspaceLinks: AppSearchLink[] = navigation.workspace.flatMap((group) =>
    group.items.map((item) => ({
      to: item.to,
      label: item.label,
      description: item.description,
      section: WORKSPACE_SECTION_LABEL,
      group: group.label,
      icon: item.icon,
    })),
  );

  const masterLinks: AppSearchLink[] = navigation.masters.flatMap((group) =>
    group.items.map((item) => ({
      to: item.to,
      label: item.label,
      description: item.description,
      section: MASTERS_SECTION_LABEL,
      group: group.label,
      icon: item.icon,
    })),
  );

  return [...dashboardLinks, ...workspaceLinks, ...masterLinks];
};

export const getTopLevelNavKey = (pathname: string, navigation: AppNavigation) => {
  if (navigation.dashboard && isNavItemActive(pathname, navigation.dashboard)) {
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
  if (navigation.dashboard && isNavItemActive(pathname, navigation.dashboard)) {
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
      { label: "Related Item Sub Categories" },
    ];
  }

  if (/^\/wpe-masters\/product-types\/\d+\/subtypes\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Category", to: WPE_PRODUCT_TYPES_ROUTE },
      { label: "Related Item Variants" },
    ];
  }

  if (/^\/wpe-masters\/product-subtypes\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Sub Category", to: WPE_PRODUCT_SUBTYPES_ROUTE },
      { label: "Selected Item Category" },
    ];
  }

  if (/^\/wpe-masters\/product-subtypes\/\d+\/subtypes\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Sub Category", to: WPE_PRODUCT_SUBTYPES_ROUTE },
      { label: "Selected Item Sub Category" },
    ];
  }

  if (/^\/wpe-masters\/item-variants\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Variants", to: WPE_ITEM_VARIANTS_ROUTE },
      { label: "Selected Item Category" },
    ];
  }

  if (/^\/wpe-masters\/item-variants\/\d+\/subtypes\/\d+\/?$/.test(pathname)) {
    return [
      { label: MASTERS_SECTION_LABEL },
      { label: "Inventory & Store Masters", to: INVENTORY_STORE_MASTERS_ROUTE },
      { label: "Item Variants", to: WPE_ITEM_VARIANTS_ROUTE },
      { label: "Selected Item Sub Category" },
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
