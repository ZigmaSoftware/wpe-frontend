import { Badge } from "@/components/ui/badge";

const toneClassMap: Record<string, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FREE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RUNNING: "border-sky-200 bg-sky-50 text-sky-700",
  OCCUPIED: "border-amber-200 bg-amber-50 text-amber-700",
  HOLD: "border-rose-200 bg-rose-50 text-rose-700",
  USED: "border-slate-200 bg-slate-100 text-slate-700",
  MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700",
  BREAKDOWN: "border-rose-200 bg-rose-50 text-rose-700",
  DARK: "border-slate-300 bg-slate-100 text-slate-700",
  LIGHT: "border-sky-200 bg-sky-50 text-sky-700",
};

const defaultLabel = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ProductionEnumBadge = ({
  value,
  label,
}: {
  value?: string | null;
  label?: string;
}) => {
  if (!value) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className={toneClassMap[value] ?? "border-slate-200 bg-slate-100 text-slate-700"}>
      {label ?? defaultLabel(value)}
    </Badge>
  );
};

export default ProductionEnumBadge;
