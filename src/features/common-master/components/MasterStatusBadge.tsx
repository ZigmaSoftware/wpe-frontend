import { Badge } from "@/components/ui/badge";

const MasterStatusBadge = ({ active }: { active: boolean }) => (
  <Badge
    variant="outline"
    className={
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-100 text-slate-600"
    }
  >
    {active ? "Active" : "Inactive"}
  </Badge>
);

export default MasterStatusBadge;
