import type { StoreStockRequest } from "@/lib/types";

export const STORE_REQUEST_STATUS_LABELS: Record<StoreStockRequest["status"], string> = {
  PENDING_HEAD_APPROVAL: "Pending Blending Head Approval",
  PENDING_STORE_ISSUE: "Pending Store Issue",
  HEAD_REJECTED: "Rejected by Blending Head",
  APPROVED: "Fully Issued",
  PARTIALLY_APPROVED: "Partially Issued",
  REJECTED: "Rejected by Store",
  CANCELLED: "Cancelled",
};

export const getStoreRequestStatusLabel = (status: StoreStockRequest["status"]) =>
  STORE_REQUEST_STATUS_LABELS[status] ?? status;
