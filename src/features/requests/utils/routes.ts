import { ClipboardCheck, FileText, type LucideIcon } from "lucide-react";

export const REQUESTS_ROUTE = "/app/requests";
export const REQUESTS_STORE_REQUEST_ROUTE = `${REQUESTS_ROUTE}/store-request`;
export const REQUESTS_HEAD_APPROVAL_ROUTE = `${REQUESTS_ROUTE}/head-approval`;

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
  {
    to: REQUESTS_HEAD_APPROVAL_ROUTE,
    icon: ClipboardCheck,
    label: "Head Approval's",
    description: "Approve or reject store requests before they enter request processing.",
  },
];

export const requestsWorkspaceGroupIcon = FileText;
