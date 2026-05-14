type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-card-foreground">{value}</div>
    {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
  </div>
);

export default StatCard;
