import type { StoreStockRequest } from "@/lib/types";

export const STORE_REQUEST_STATUS_LABELS: Record<StoreStockRequest["status"], string> = {
  PENDING_HEAD_APPROVAL: "Pending Head Approval",
  PENDING_REQUEST_PROCESS: "Pending Request Process",
  PENDING_STOCK_RELEASE: "Pending Stock Release",
  HEAD_REJECTED: "Rejected by Head",
  REQUEST_REJECTED: "Rejected During Request Process",
  RELEASE_REJECTED: "Rejected During Stock Release",
  CLOSED_WON: "Closed Won",
  CANCELLED: "Cancelled",
};

export const getStoreRequestStatusLabel = (status: StoreStockRequest["status"]) =>
  STORE_REQUEST_STATUS_LABELS[status] ?? status;
