import type { LucideIcon } from "lucide-react";

export type DashboardPeriod = "this-month" | "this-week" | "today";

export type DashboardSparkPoint = {
  label: string;
  value: number;
};

export type DashboardKpiCardData = {
  id: string;
  label: string;
  value: number | null;
  trendLabel: string;
  trendDirection: "up" | "down" | "neutral";
  sparkline: DashboardSparkPoint[];
  icon: LucideIcon;
  href?: string;
  tone: "orange" | "blue" | "green" | "purple" | "amber";
  unavailable?: boolean;
};

export type DashboardDonutDatum = {
  label: string;
  value: number;
  color: string;
  percent: number;
};

export type DashboardBarDatum = {
  label: string;
  shortLabel: string;
  value: number;
};

export type DashboardFooterStat = {
  id: string;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type DashboardActivityItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
  tone: "default" | "success" | "warning" | "danger" | "info" | "purple";
  icon: LucideIcon;
  href?: string;
  sortTime: number;
};

export type DashboardQuickAction = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  tone: "orange" | "blue" | "green" | "purple";
};

export type DashboardOverview = {
  period: DashboardPeriod;
  kpis: DashboardKpiCardData[];
  production: {
    totalBatches: number;
    completionRate: number;
    trendLabel: string;
    trendDirection: "up" | "down" | "neutral";
    breakdown: DashboardDonutDatum[];
    unavailable?: boolean;
  };
  stockSummary: {
    totalStock: string;
    stores: string;
    lowStockAlerts: string;
    bars: DashboardBarDatum[];
    unavailable?: boolean;
  };
  grnOverview: {
    totalGrns: number;
    totalQtyReceived: string;
    suppliers: string;
    onTimeRate: string;
    breakdown: DashboardDonutDatum[];
    unavailable?: boolean;
  };
  recentActivity: DashboardActivityItem[];
  pendingApprovals: Array<{
    id: string;
    label: string;
    count: number | null;
    to: string;
    unavailable?: boolean;
  }>;
  quickActions: DashboardQuickAction[];
};
