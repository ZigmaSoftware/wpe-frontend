import { Badge } from "@/components/ui/badge";

const toneClassMap: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  RELEASED: "border-sky-200 bg-sky-50 text-sky-700",
  IN_PRODUCTION: "border-sky-200 bg-sky-50 text-sky-700",
  PACKING_IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  QC_PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",

  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",

  CREATED: "border-slate-200 bg-slate-100 text-slate-700",
  AWAITING_WEIGHT: "border-amber-200 bg-amber-50 text-amber-700",
  WEIGHT_ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  WEIGHT_REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  STICKER_GENERATED: "border-sky-200 bg-sky-50 text-sky-700",
  STICKER_SCANNED: "border-sky-200 bg-sky-50 text-sky-700",
  QC_APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MOVED_TO_WAREHOUSE: "border-emerald-300 bg-emerald-100 text-emerald-800",
  SCRAPPED: "border-rose-200 bg-rose-50 text-rose-700",

  UNDERWEIGHT: "border-rose-200 bg-rose-50 text-rose-700",
  OVERWEIGHT: "border-rose-200 bg-rose-50 text-rose-700",

  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  SUPERSEDED: "border-slate-200 bg-slate-100 text-slate-700",

  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REVERSED: "border-rose-200 bg-rose-50 text-rose-700",
};

const defaultLabel = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ExtrusionStatusBadge = ({ value, label }: { value?: string | null; label?: string }) => {
  if (!value) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className={toneClassMap[value] ?? "border-slate-200 bg-slate-100 text-slate-700"}>
      {label ?? defaultLabel(value)}
    </Badge>
  );
};

export default ExtrusionStatusBadge;
