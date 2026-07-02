import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardChartCard from "@/components/dashboard/DashboardChartCard";
import DashboardKpiCard from "@/components/dashboard/DashboardKpiCard";
import PendingApprovalsCard from "@/components/dashboard/PendingApprovalsCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import {
  buildDashboardOverview,
  fetchDashboardRequestActivity,
  fetchDashboardRequestCounts,
  fetchDashboardStoreSnapshot,
  fetchGrnActiveRecords,
  fetchGrnPendingRecords,
  fetchProductionDashboard,
  fetchQcrActiveRecords,
  fetchQcrCompletedRecords,
  getDashboardPeriodLabel,
} from "@/components/dashboard/dashboardData";
import type { DashboardDonutDatum, DashboardFooterStat, DashboardPeriod } from "@/components/dashboard/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { hasAnyScreenAccess } from "@/features/admin-master/utils/permissions";
import { GRN_PROCESS_ROUTE } from "@/features/grn/utils/routes";
import { REQUESTS_STORE_REQUEST_ROUTE } from "@/features/requests/utils/routes";
import { WORKSPACE_SCREEN_CODES, getRouteScreenCodes } from "@/lib/routePermissions";
import { useAuth } from "@/providers/AuthProvider";

const PERIOD_OPTIONS: DashboardPeriod[] = ["this-month", "this-week", "today"];

const normalizeRouteForAccess = (to: string) => to.split("?")[0] || to;

const formatYAxis = (value: number) => {
  if (value >= 1000) {
    const rounded = value >= 10000 ? Math.round(value / 1000) : Number((value / 1000).toFixed(1));
    return `${rounded}K`;
  }

  return value;
};

const renderDonutLegend = (items: DashboardDonutDatum[]) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="truncate text-sm text-[#334155]">{item.label}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold text-[#111827]">
          {item.value} ({item.percent}%)
        </span>
      </div>
    ))}
  </div>
);

const DashboardPage = () => {
  const { adminMenu = [], user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("this-month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const hasRouteAccess = useMemo(() => {
    return (to: string) => {
      if (user?.is_staff) {
        return true;
      }

      const path = normalizeRouteForAccess(to);
      const directScreenCodes = getRouteScreenCodes(path);

      if (directScreenCodes.length > 0) {
        return hasAnyScreenAccess(adminMenu, directScreenCodes);
      }

      if (path === "/app/production/neworder") {
        return hasAnyScreenAccess(adminMenu, WORKSPACE_SCREEN_CODES.productionAdWeightage);
      }

      if (path === "/app/grn/process/new") {
        return hasAnyScreenAccess(adminMenu, WORKSPACE_SCREEN_CODES.grnProcess);
      }

      if (path.startsWith("/app/contacts/")) {
        return hasAnyScreenAccess(adminMenu, WORKSPACE_SCREEN_CODES.contacts);
      }

      return false;
    };
  }, [adminMenu, user?.is_staff]);

  const storeSnapshotQuery = useQuery({
    queryKey: ["dashboard", "store-snapshot"],
    queryFn: fetchDashboardStoreSnapshot,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const grnActiveQuery = useQuery({
    queryKey: ["grn-active"],
    queryFn: fetchGrnActiveRecords,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const grnPendingQuery = useQuery({
    queryKey: ["grn-pending"],
    queryFn: fetchGrnPendingRecords,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const qcrActiveQuery = useQuery({
    queryKey: ["qcr", "active"],
    queryFn: fetchQcrActiveRecords,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const qcrCompletedQuery = useQuery({
    queryKey: ["qcr", "completed"],
    queryFn: fetchQcrCompletedRecords,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const productionQuery = useQuery({
    queryKey: ["production-dashboard"],
    queryFn: fetchProductionDashboard,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const requestCountsQuery = useQuery({
    queryKey: ["dashboard-request-counts"],
    queryFn: fetchDashboardRequestCounts,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const requestActivityQuery = useQuery({
    queryKey: ["dashboard-request-activity"],
    queryFn: fetchDashboardRequestActivity,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const degradedWidgets = useMemo(() => {
    const labels: string[] = [];
    if (storeSnapshotQuery.isError) labels.push("Store / Inventory");
    if (grnActiveQuery.isError || grnPendingQuery.isError) labels.push("GRN");
    if (qcrActiveQuery.isError || qcrCompletedQuery.isError) labels.push("QCR");
    if (productionQuery.isError) labels.push("Production");
    if (requestCountsQuery.isError || requestActivityQuery.isError) labels.push("Requests");
    return labels;
  }, [
    grnActiveQuery.isError,
    grnPendingQuery.isError,
    productionQuery.isError,
    qcrActiveQuery.isError,
    qcrCompletedQuery.isError,
    requestActivityQuery.isError,
    requestCountsQuery.isError,
    storeSnapshotQuery.isError,
  ]);

  const overview = useMemo(
    () =>
      buildDashboardOverview({
        period,
        storeDashboard: storeSnapshotQuery.data?.storeDashboard ?? null,
        storeInventory: storeSnapshotQuery.data?.storeInventory ?? null,
        blendingInventory: storeSnapshotQuery.data?.blendingInventory ?? null,
        grnActive: grnActiveQuery.data ?? null,
        grnPending: grnPendingQuery.data ?? null,
        qcrActive: qcrActiveQuery.data ?? null,
        qcrCompleted: qcrCompletedQuery.data ?? null,
        production: productionQuery.data ?? null,
        requestCounts: requestCountsQuery.data ?? null,
        requestActivity: requestActivityQuery.data ?? null,
        hasRouteAccess,
      }),
    [
      grnActiveQuery.data,
      grnPendingQuery.data,
      hasRouteAccess,
      period,
      productionQuery.data,
      qcrActiveQuery.data,
      qcrCompletedQuery.data,
      requestActivityQuery.data,
      requestCountsQuery.data,
      storeSnapshotQuery.data,
    ],
  );

  const dateLabel = format(selectedDate, "d MMMM yyyy, EEEE");
  const stockFooterStats: DashboardFooterStat[] = [
    { id: "total-stock", label: "Total Stock", value: overview.stockSummary.totalStock },
    { id: "stores", label: "Stores", value: overview.stockSummary.stores },
    { id: "low-stock", label: "Low Stock Alerts", value: overview.stockSummary.lowStockAlerts, tone: "danger" },
  ];
  const grnFooterStats: DashboardFooterStat[] = [
    { id: "total-qty", label: "Total Qty Received", value: overview.grnOverview.totalQtyReceived },
    { id: "suppliers", label: "Suppliers", value: overview.grnOverview.suppliers },
    { id: "on-time", label: "On-time Rate", value: overview.grnOverview.onTimeRate, tone: "success" },
  ];
  const activityViewAllTo = hasRouteAccess(GRN_PROCESS_ROUTE) ? GRN_PROCESS_ROUTE : REQUESTS_STORE_REQUEST_ROUTE;

  return (
    <div className="space-y-6 pb-2 pt-4 md:pt-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-[#121926]">Dashboard</h1>
          <p className="mt-2 text-sm text-[#64748b]">Real-time overview of operations and key performance indicators.</p>
        </div>

        <div className="flex w-full flex-col gap-3 pt-1 sm:mt-2 sm:w-auto sm:flex-row sm:pt-0">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-[230px] items-center gap-3 rounded-2xl border border-[#e5eaf1] bg-white px-4 py-3 text-left shadow-[0_12px_32px_-24px_rgba(15,23,42,0.16)] transition-colors hover:bg-[#f8fafc]"
                aria-label="Choose dashboard date"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8fafc] text-[#64748b]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[#1e293b]">{dateLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto rounded-2xl border border-[#e5eaf1] p-0 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) {
                    return;
                  }
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                initialFocus
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
            <SelectTrigger className="h-[58px] min-w-[148px] rounded-2xl border-[#e5eaf1] bg-white px-4 text-sm font-medium text-[#1e293b] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.16)]">
              <SelectValue>{getDashboardPeriodLabel(period)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {getDashboardPeriodLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {degradedWidgets.length ? (
        <div className="rounded-2xl border border-[#f5d8c7] bg-[#fff8f3] px-4 py-3 text-sm text-[#9a3412]">
          Some live widgets are currently using fallback or unavailable data: {degradedWidgets.join(", ")}.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {overview.kpis.map((item) => (
          <DashboardKpiCard key={item.id} item={item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_1.15fr_1fr]">
        <DashboardChartCard
          title="Production Stage Overview"
          period={period}
          onPeriodChange={setPeriod}
          unavailable={overview.production.unavailable}
          className="xl:min-h-[420px]"
        >
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.production.breakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={92}
                    strokeWidth={0}
                    paddingAngle={2}
                  >
                    {overview.production.breakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, payload: { payload: DashboardDonutDatum }) => [`${value}`, payload.payload.label]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-[#111827]">{overview.production.totalBatches}</div>
                <div className="text-sm text-[#6b7280]">Total Batches</div>
              </div>
            </div>

            <div className="space-y-4">
              {renderDonutLegend(overview.production.breakdown)}
            </div>
          </div>

          <div className="mt-6 border-t border-[#edf1f6] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-[#64748b]">Completion Rate</div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-[1.35rem] font-semibold text-[#16a34a]">{overview.production.completionRate}%</span>
                  <div className="w-[260px] max-w-full">
                    <Progress value={overview.production.completionRate} className="h-2.5 bg-[#edf1f6]" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#64748b]">vs last month</div>
                <div className="font-display text-[1.35rem] font-semibold text-[#16a34a]">+8%</div>
              </div>
            </div>
          </div>
        </DashboardChartCard>

        <DashboardChartCard
          title="Stock Summary (By Store)"
          period={period}
          onPeriodChange={setPeriod}
          unavailable={overview.stockSummary.unavailable}
          footerStats={stockFooterStats}
          className="xl:min-h-[420px]"
        >
          <div className="h-[285px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.stockSummary.bars} margin={{ top: 18, right: 10, left: 0, bottom: 24 }}>
                <CartesianGrid vertical={false} stroke="#e9eef4" />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  height={52}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={formatYAxis} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString("en-IN")} Kgs`} />
                <Bar dataKey="value" radius={[10, 10, 2, 2]} fill="#f97316" maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>

        <DashboardChartCard
          title="GRN Overview"
          period={period}
          onPeriodChange={setPeriod}
          unavailable={overview.grnOverview.unavailable}
          footerStats={grnFooterStats}
          className="xl:min-h-[420px]"
        >
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.grnOverview.breakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={92}
                    strokeWidth={0}
                    paddingAngle={2}
                  >
                    {overview.grnOverview.breakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, payload: { payload: DashboardDonutDatum }) => [`${value}`, payload.payload.label]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-[#111827]">{overview.grnOverview.totalGrns}</div>
                <div className="text-sm text-[#6b7280]">Total GRNs</div>
              </div>
            </div>

            <div className="space-y-4">{renderDonutLegend(overview.grnOverview.breakdown)}</div>
          </div>
        </DashboardChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_1fr_1fr]">
        <RecentActivityCard items={overview.recentActivity} viewAllTo={activityViewAllTo} />
        <PendingApprovalsCard items={overview.pendingApprovals.filter((item) => hasRouteAccess(item.to))} />
        <QuickActionsCard actions={overview.quickActions} />
      </section>
    </div>
  );
};

export default DashboardPage;
