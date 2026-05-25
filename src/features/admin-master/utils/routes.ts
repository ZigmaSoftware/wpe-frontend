export const adminRouteRegistry: Record<string, { path: string; title: string }> = {
  "main-screen-master": { path: "/admin/main-screens", title: "Main Screens" },
  "screen-section-master": { path: "/admin/screen-sections", title: "Screen Sections" },
  "user-screen-master": { path: "/admin/user-screens", title: "User Screens" },
  "user-type-master": { path: "/admin/user-types", title: "User Types" },
  "user-account-master": { path: "/admin/user-creation", title: "User Creation" },
  "user-creation-master": { path: "/admin/user-creation", title: "User Creation" },
  "user-permission-master": { path: "/admin/user-screen-permission", title: "User Screen Permission" },
  "user-screen-permission-master": { path: "/admin/user-screen-permission", title: "User Screen Permission" },
};

export const resolveAdminRoutePath = (screenCode: string, backendRoutePath?: string | null) => {
  if (backendRoutePath && backendRoutePath.trim().startsWith("/")) {
    return backendRoutePath.trim();
  }
  return adminRouteRegistry[screenCode]?.path ?? "/dashboard";
};

export const getAdminRouteTitle = (screenCode: string, fallback: string) =>
  adminRouteRegistry[screenCode]?.title ?? fallback;
