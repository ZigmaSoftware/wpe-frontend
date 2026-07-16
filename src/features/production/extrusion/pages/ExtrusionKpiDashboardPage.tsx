import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { useWorkOrders, useExtrusionKpiDashboard } from "@/features/production/extrusion/hooks/useExtrusion";
import { formatDecimal } from "@/lib/api-helpers";
import type { ExtrusionKpiGroupRow } from "@/features/production/extrusion/types";

const CHART_HUE = "#3b82f6";

const GroupBarChart = ({ title, rows }: { title: string; rows: ExtrusionKpiGroupRow[] }) => {
  const data = rows.map((row) => ({ label: row.label || "—", weight: Number(row.weight) }));

  return (
    <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-[1.05rem] font-semibold tracking-[-0.02em]">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No scrap recorded for this filter.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="#eef1f6" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#8a95a5" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12, fill: "#243041" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [`${formatDecimal(value)} kg`, "Scrap weight"]} />
            <Bar dataKey="weight" fill={CHART_HUE} radius={[0, 4, 4, 0]} maxBarSize={22}>
              <LabelList dataKey="weight" position="right" formatter={(value: number) => formatDecimal(value)} style={{ fontSize: 11, fill: "#243041" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const ExtrusionKpiDashboardPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [shift, setShift] = useState("");
  const [workOrder, setWorkOrder] = useState<string>("");
  const [costPerKg, setCostPerKg] = useState<string>("");

  const workOrdersQuery = useWorkOrders({ page: 1, pageSize: 200 });

  const filters = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      shift: shift || undefined,
      work_order: workOrder ? Number(workOrder) : undefined,
      cost_per_kg: costPerKg ? Number(costPerKg) : undefined,
    }),
    [dateFrom, dateTo, shift, workOrder, costPerKg],
  );

  const kpiQuery = useExtrusionKpiDashboard(filters);
  const data = kpiQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Scrap KPI Dashboard"
        description="Production, accepted weight, scrap weight, scrap percentage, recovery and reason/profile/shift/line-wise KPIs."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Shift</Label>
            <Input value={shift} onChange={(e) => setShift(e.target.value)} placeholder="e.g. Shift 1" className="w-40" />
          </div>
          <div className="space-y-1">
            <Label>Work Order</Label>
            <select
              className="h-10 w-56 rounded-md border border-input bg-background px-3 text-sm"
              value={workOrder}
              onChange={(e) => setWorkOrder(e.target.value)}
            >
              <option value="">All work orders</option>
              {(workOrdersQuery.data?.items ?? []).map((wo) => (
                <option key={wo.id} value={wo.id}>{wo.work_order_no}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Material Cost / kg</Label>
            <Input type="number" step="0.01" value={costPerKg} onChange={(e) => setCostPerKg(e.target.value)} placeholder="Optional" className="w-40" />
          </div>
        </div>
      </div>

      {kpiQuery.isLoading ? (
        <LoadingState label="Loading KPIs..." />
      ) : kpiQuery.isError ? (
        <ErrorState description="KPI data could not be loaded." />
      ) : !data ? (
        <EmptyState title="No data" description="No production or scrap data matches this filter." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Accepted Production Weight" value={`${formatDecimal(data.accepted_production_weight)} kg`} />
            <StatCard label="Total Scrap Weight" value={`${formatDecimal(data.total_scrap_weight)} kg`} />
            <StatCard label="Total Production Weight" value={`${formatDecimal(data.total_production_weight)} kg`} />
            <StatCard label="Scrap Percentage" value={`${formatDecimal(data.scrap_percentage, 2)}%`} />
            <StatCard label="Material Recovery" value={`${formatDecimal(data.material_recovery_percentage, 2)}%`} />
            <StatCard label="First-Pass Weight Acceptance" value={`${formatDecimal(data.first_pass_weight_acceptance_percentage, 2)}%`} />
            <StatCard label="Reweighing Rate" value={`${formatDecimal(data.reweighing_rate_percentage, 2)}%`} />
            <StatCard label="Scrap Cost" value={data.scrap_cost ? `₹${formatDecimal(data.scrap_cost, 2)}` : "—"} hint={data.scrap_cost ? undefined : "Enter material cost/kg to compute"} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Underweight Attempts" value={data.underweight_count} />
            <StatCard label="Overweight Attempts" value={data.overweight_count} />
            <StatCard label="Average Deviation" value={`${formatDecimal(data.average_deviation)} kg`} />
            <StatCard label="Maximum Deviation" value={`${formatDecimal(data.maximum_deviation)} kg`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GroupBarChart title="Scrap by Category" rows={data.category_wise} />
            <GroupBarChart title="Scrap by Reason" rows={data.reason_wise} />
            <GroupBarChart title="Scrap by Profile" rows={data.profile_wise} />
            <GroupBarChart title="Scrap by Work Order" rows={data.work_order_wise} />
            <GroupBarChart title="Scrap by Shift" rows={data.shift_wise} />
            <GroupBarChart title="Scrap by Line" rows={data.line_wise} />
            <GroupBarChart title="Scrap by Stage" rows={data.stage_wise} />
          </div>
        </>
      )}
    </div>
  );
};

export default ExtrusionKpiDashboardPage;
