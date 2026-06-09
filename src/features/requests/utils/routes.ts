import { FileText, type LucideIcon } from "lucide-react";

export const REQUESTS_ROUTE = "/app/requests";
export const REQUESTS_STORE_REQUEST_ROUTE = `${REQUESTS_ROUTE}/store-request`;

export type RequestsWorkspaceModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const requestsWorkspaceModuleDefinitions: RequestsWorkspaceModuleDefinition[] = [
  {
    to: REQUESTS_STORE_REQUEST_ROUTE,
    icon: FileText,
    label: "Store Request",
    description: "Raise and manage blending store requests for material needs.",
  },
];

export const requestsWorkspaceGroupIcon = FileText;
