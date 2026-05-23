import type { ProductionBatch } from "@/lib/types";

export type ProductionBatchExt = ProductionBatch & {
  bom_variant_code?: string | null;
  total_weight_grams?: number;
  all_weights_valid?: boolean;
};

export const ORDER_STATUS_CLASSES: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PLAN_COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export const BATCH_STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export const StatusBadge = ({
  status,
  classes,
}: {
  status: string;
  classes: Record<string, string>;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      classes[status] ?? "bg-gray-100 text-gray-700"
    }`}
  >
    {status.replace(/_/g, " ")}
  </span>
);
