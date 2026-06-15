import { FileSpreadsheet, Truck, type LucideIcon } from "lucide-react";

export const GRN_ROUTE = "/app/grn";
export const GRN_PROCESS_ROUTE = `${GRN_ROUTE}/process`;
export const GRN_STATUS_ROUTE = `${GRN_ROUTE}/status`;
export const GRN_PROCESS_CREATE_ROUTE = `${GRN_PROCESS_ROUTE}/new`;

export const getGrnProcessDetailRoute = (id: number | string) => `${GRN_PROCESS_ROUTE}/${id}`;
export const getGrnProcessEditRoute = (id: number | string) => `${GRN_PROCESS_ROUTE}/${id}/edit`;
export const getGrnProcessViewRoute = (id: number | string) => `${GRN_PROCESS_ROUTE}/${id}/view`;

export type GrnWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
  activeMatchPaths?: string[];
};

export const grnWorkspaceModuleDefinitions: GrnWorkspaceModuleDefinition[] = [
  {
    to: GRN_PROCESS_ROUTE,
    icon: FileSpreadsheet,
    label: "GRN Process",
    description: "Manage gate entry records, GRN pending movement, QCR handoff, and completed GRN review in one workspace.",
    activeMatchPaths: [GRN_PROCESS_ROUTE],
  },
];

export const grnWorkspaceGroupIcon = Truck;
