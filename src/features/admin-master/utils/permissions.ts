import type { AdminAction, AdminActionPermissions, AdminMenuMain } from "@/features/admin-master/types";

export const canAccessAction = (permissions: AdminActionPermissions | undefined, action: AdminAction) => {
  if (!permissions) {
    return false;
  }
  if (permissions.all) {
    return true;
  }
  return Boolean(permissions[action]);
};

export const findScreenPermissions = (menu: AdminMenuMain[], screenCode: string): AdminActionPermissions | null => {
  for (const main of menu) {
    for (const section of main.sections) {
      const screen = section.screens.find((entry) => entry.code === screenCode);
      if (screen) {
        return screen.action_permissions;
      }
    }
  }
  return null;
};

export const hasAnyScreenAccess = (menu: AdminMenuMain[], screenCodes: readonly string[]) =>
  screenCodes.some((screenCode) => Boolean(findScreenPermissions(menu, screenCode)));
