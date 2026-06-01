import {
  BriefcaseBusiness,
  Building2,
  Layers,
  Layout,
  Monitor,
  Shield,
  UserRoundCog,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminMenuMain } from "@/features/admin-master/types";

export const ADMIN_MASTERS_ROUTE = "/admin/admin-masters";

export type AdminModuleDefinition = {
  codes: readonly string[];
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  alwaysVisible?: boolean;
};

export const adminModuleDefinitions: AdminModuleDefinition[] = [
  {
    codes: ["main-screen-master"],
    to: "/admin/main-screens",
    icon: Monitor,
    label: "Main Screens",
    description: "Configure primary application modules and main navigation entries.",
  },
  {
    codes: ["screen-section-master"],
    to: "/admin/screen-sections",
    icon: Layers,
    label: "Screen Sections",
    description: "Manage section-level grouping inside each main screen.",
  },
  {
    codes: ["user-screen-master"],
    to: "/admin/user-screens",
    icon: Layout,
    label: "User Screens",
    description: "Configure user-facing screens mapped to application sections.",
  },
  {
    codes: ["user-type-master"],
    to: "/admin/user-types",
    icon: Users,
    label: "User Types",
    description: "Manage user role and type definitions.",
  },
  {
    codes: ["user-account-master", "user-creation-master"],
    to: "/admin/user-creation",
    icon: UserCog,
    label: "User Creation",
    description: "Create and maintain application users.",
  },
  {
    codes: ["user-permission-master", "user-screen-permission-master"],
    to: "/admin/user-screen-permission",
    icon: Shield,
    label: "User Type Permissions",
    description: "Configure screen-level access and action permissions for user types.",
  },
  {
    codes: [],
    to: "/wpe-masters/departments",
    icon: Building2,
    label: "Department",
    description: "Manage department structure, heads, and administrative ownership.",
    alwaysVisible: true,
  },
  {
    codes: [],
    to: "/wpe-masters/designations",
    icon: BriefcaseBusiness,
    label: "Designation",
    description: "Manage designation records mapped to departments.",
    alwaysVisible: true,
  },
  {
    codes: [],
    to: "/wpe-masters/roles",
    icon: UserRoundCog,
    label: "Role",
    description: "Manage roles mapped to designations and user setup.",
    alwaysVisible: true,
  },
];

export const adminModuleIconMap: Record<string, LucideIcon> = Object.fromEntries(
  adminModuleDefinitions.flatMap((module) => module.codes.map((code) => [code, module.icon])),
);

export const adminRouteRegistry: Record<string, { path: string; title: string }> = Object.fromEntries(
  adminModuleDefinitions.flatMap((module) =>
    module.codes.map((code) => [code, { path: module.to, title: module.label }]),
  ),
);

const normalizeAdminKey = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "-");

export const isAdminMastersSection = (code?: string | null, fallbackName?: string | null) => {
  const codeKey = normalizeAdminKey(code);
  const nameKey = normalizeAdminKey(fallbackName);

  return (
    codeKey === "admin-master" ||
    codeKey === "admin-masters" ||
    nameKey === "admin-master" ||
    nameKey === "admin-masters"
  );
};

export const getAdminSectionTitle = (code?: string | null, fallbackName?: string | null) =>
  isAdminMastersSection(code, fallbackName) ? "Admin Masters" : fallbackName?.trim() || "Admin Section";

export const getAdminMastersModulesFromMenu = (menu: AdminMenuMain[]) => {
  const availableCodes = new Set(
    menu.flatMap((main) =>
      main.sections
        .filter((section) => isAdminMastersSection(section.code, section.name))
        .flatMap((section) => section.screens.map((screen) => screen.code)),
    ),
  );

  return adminModuleDefinitions.filter(
    (module) => module.alwaysVisible || module.codes.some((code) => availableCodes.has(code)),
  );
};

export const resolveAdminRoutePath = (screenCode: string, backendRoutePath?: string | null) => {
  if (backendRoutePath && backendRoutePath.trim().startsWith("/")) {
    return backendRoutePath.trim();
  }
  return adminRouteRegistry[screenCode]?.path ?? "/dashboard";
};

export const getAdminRouteTitle = (screenCode: string, fallback: string) =>
  adminRouteRegistry[screenCode]?.title ?? fallback;
