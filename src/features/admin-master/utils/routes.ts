import type { RouteMeta } from "@/components/erp/types";

export const adminRouteRegistry: Record<string, RouteMeta> = {
  "main-screen-master": {
    path: "/admin/main-screens",
    title: "Main Screens",
    navLabel: "Main Screen",
    section: "Admin Master",
    screenCode: "main-screen-master",
    guardAction: "list",
  },
  "screen-section-master": {
    path: "/admin/screen-sections",
    title: "Screen Sections",
    navLabel: "Screen Sections",
    section: "Admin Master",
    screenCode: "screen-section-master",
    guardAction: "list",
  },
  "user-screen-master": {
    path: "/admin/user-screens",
    title: "User Screens",
    navLabel: "User Screens",
    section: "Admin Master",
    screenCode: "user-screen-master",
    guardAction: "list",
  },
  "staff-master": {
    path: "/admin/staff",
    title: "Staff",
    navLabel: "Staff",
    section: "Admin Master",
    screenCode: "staff-master",
    guardAction: "list",
  },
  "user-type-master": {
    path: "/admin/user-types",
    title: "User Types",
    navLabel: "User Types",
    section: "Admin Master",
    screenCode: "user-type-master",
    guardAction: "list",
  },
  "user-account-master": {
    path: "/admin/user-accounts",
    title: "User Accounts",
    navLabel: "User Accounts",
    section: "Admin Master",
    screenCode: "user-account-master",
    guardAction: "list",
  },
  "user-permission-master": {
    path: "/admin/user-permissions",
    title: "User Permissions",
    navLabel: "User Permissions",
    section: "Admin Master",
    screenCode: "user-permission-master",
    guardAction: "list",
  },
};

export const adminRouteMetas = Object.values(adminRouteRegistry);

export const resolveAdminRoutePath = (screenCode: string, backendRoutePath?: string | null) => {
  if (backendRoutePath && backendRoutePath.trim().startsWith("/")) {
    return backendRoutePath.trim();
  }
  return adminRouteRegistry[screenCode]?.path ?? "/dashboard";
};

export const getAdminRouteTitle = (screenCode: string, fallback: string) =>
  adminRouteRegistry[screenCode]?.title ?? fallback;

export const buildAdminRouteElement = <T,>(meta: RouteMeta, element: T) => ({
  meta,
  element,
});
