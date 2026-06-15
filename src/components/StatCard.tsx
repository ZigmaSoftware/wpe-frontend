type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div className="wpe-kpi-card">
    <div className="wpe-kpi-label">{label}</div>
    <div className="wpe-kpi-value">{value}</div>
    {hint ? <div className="wpe-kpi-hint">{hint}</div> : null}
  </div>
);

export default StatCard;
