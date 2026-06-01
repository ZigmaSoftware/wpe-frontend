export const PRODUCTION_STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PLAN_COMPLETED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
  FAILED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PLAN_COMPLETED: "Completed",
  CLOSED: "Closed",
  FAILED: "Failed",
  REJECTED: "Rejected",
  DRAFT: "Draft",
};

export const formatProductionListLabel = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "-";
  }

  if (PRODUCTION_STATUS_LABELS[normalized]) {
    return PRODUCTION_STATUS_LABELS[normalized];
  }

  if (/^[A-Z0-9_]+$/.test(normalized)) {
    return normalized
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  }

  return normalized;
};

export const ProductionStatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      PRODUCTION_STATUS_BADGE_CLASSES[status] ?? "bg-slate-100 text-slate-700"
    }`}
  >
    {formatProductionListLabel(status)}
  </span>
);
