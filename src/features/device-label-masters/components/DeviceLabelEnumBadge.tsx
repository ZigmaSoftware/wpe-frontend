import { Badge } from "@/components/ui/badge";

const toneClassMap: Record<string, string> = {
  SERIAL: "border-sky-200 bg-sky-50 text-sky-700",
  USB: "border-emerald-200 bg-emerald-50 text-emerald-700",
  API: "border-amber-200 bg-amber-50 text-amber-700",
  NETWORK: "border-violet-200 bg-violet-50 text-violet-700",
  BARCODE: "border-sky-200 bg-sky-50 text-sky-700",
  QR: "border-emerald-200 bg-emerald-50 text-emerald-700",
  STICKER: "border-amber-200 bg-amber-50 text-amber-700",
  BIN: "border-slate-200 bg-slate-100 text-slate-700",
  BAG: "border-cyan-200 bg-cyan-50 text-cyan-700",
  PRODUCT: "border-indigo-200 bg-indigo-50 text-indigo-700",
  REGRIND: "border-stone-200 bg-stone-100 text-stone-700",
  JSON: "border-cyan-200 bg-cyan-50 text-cyan-700",
  TEXT: "border-slate-200 bg-slate-100 text-slate-700",
  ASCII: "border-cyan-200 bg-cyan-50 text-cyan-700",
  HEX: "border-amber-200 bg-amber-50 text-amber-700",
  YES: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NO: "border-slate-200 bg-slate-100 text-slate-700",
};

const defaultLabel = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DeviceLabelEnumBadge = ({
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

export default DeviceLabelEnumBadge;
