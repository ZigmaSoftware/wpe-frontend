import { AlertTriangle, CalendarDays, Circle, Clock3, Link2, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import type { ProductionLineRecord } from "@/features/production-masters/types";
import type { LineConnectionRecord } from "@/features/production/api/lineConnectApi";
import { cn } from "@/lib/utils";

type LineConnectDashboardProps = {
  lines: ProductionLineRecord[];
  activeConnections: LineConnectionRecord[];
  isLoading?: boolean;
};

type DashboardState = "connected" | "not_connected" | "maintenance";

type DashboardLineItem = {
  line: ProductionLineRecord;
  connection: LineConnectionRecord | null;
  state: DashboardState;
};

const formatWeight = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "0.000";
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return "0.000";
  }

  return numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const formatConnectedDate = (value?: string | null) => {
  if (!value) {
    return { date: "-", time: "-" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "-" };
  }

  return {
    date: parsed.toLocaleDateString("en-GB"),
    time: parsed
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase(),
  };
};

const formatBagLabel = (value?: string | null) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "Bag -";
  }
  if (/^bag\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Bag ${trimmed}`;
};

const formatLineLabel = (line: ProductionLineRecord) => {
  const candidates = [line.name, line.code];

  for (const candidate of candidates) {
    const trimmed = String(candidate || "").trim();
    if (!trimmed) continue;

    const digitsMatch = trimmed.match(/(\d+)(?!.*\d)/);
    if (digitsMatch) {
      return digitsMatch[1].padStart(2, "0");
    }

    return trimmed;
  }

  return String(line.id).padStart(2, "0");
};

const stateMeta: Record<
  DashboardState,
  {
    badgeLabel: string;
    icon: LucideIcon;
    iconClassName: string;
    borderClassName: string;
    badgeClassName: string;
    emptyPanelClassName: string;
    emptyPrimaryText: string;
    emptySecondaryText: string;
    contentMutedClassName: string;
  }
> = {
  connected: {
    badgeLabel: "CONNECTED",
    icon: Link2,
    iconClassName: "bg-emerald-500 text-white shadow-[0_8px_16px_rgba(34,197,94,0.20)]",
    borderClassName: "border-emerald-300/90",
    badgeClassName: "bg-emerald-100 text-emerald-700",
    emptyPanelClassName: "bg-emerald-50/60",
    emptyPrimaryText: "",
    emptySecondaryText: "",
    contentMutedClassName: "text-slate-700",
  },
  not_connected: {
    badgeLabel: "NOT CONNECTED",
    icon: AlertTriangle,
    iconClassName: "bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.18)]",
    borderClassName: "border-slate-200",
    badgeClassName: "bg-red-100 text-red-600",
    emptyPanelClassName: "bg-slate-50",
    emptyPrimaryText: "No bag connected",
    emptySecondaryText: "Line is available",
    contentMutedClassName: "text-slate-600",
  },
  maintenance: {
    badgeLabel: "NOT CONNECTED",
    icon: AlertTriangle,
    iconClassName: "bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.18)]",
    borderClassName: "border-slate-200",
    badgeClassName: "bg-amber-100 text-amber-700",
    emptyPanelClassName: "bg-amber-50/70",
    emptyPrimaryText: "No bag connected",
    emptySecondaryText: "Line is unavailable",
    contentMutedClassName: "text-slate-600",
  },
};

const legendItems: Array<{
  label: string;
  icon: LucideIcon;
  iconClassName: string;
}> = [
  {
    label: "Connected",
    icon: Link2,
    iconClassName: "text-emerald-500",
  },
  {
    label: "Available",
    icon: Circle,
    iconClassName: "text-orange-500",
  },
  {
    label: "Not Connected",
    icon: AlertTriangle,
    iconClassName: "text-red-500",
  },
];

const CARD_WIDTH_PX = 248;
const CARD_HEIGHT_PX = 206;
const CARD_GAP_PX = 20;

const LineConnectDashboard = ({ lines, activeConnections, isLoading = false }: LineConnectDashboardProps) => {
  const dashboardItems = useMemo<DashboardLineItem[]>(() => {
    const activeConnectionByLine = new Map<number, LineConnectionRecord>();

    activeConnections.forEach((connection) => {
      if (connection.status === "ON" && !activeConnectionByLine.has(connection.production_line)) {
        activeConnectionByLine.set(connection.production_line, connection);
      }
    });

    return lines.map((line) => {
      const connection = activeConnectionByLine.get(line.id) ?? null;

      if (connection) {
        return { line, connection, state: "connected" };
      }

      if (line.status === "MAINTENANCE") {
        return { line, connection: null, state: "maintenance" };
      }

      return { line, connection: null, state: "not_connected" };
    });
  }, [activeConnections, lines]);

  const dashboardRowWidth = Math.max(
    dashboardItems.length * CARD_WIDTH_PX + Math.max(dashboardItems.length - 1, 0) * CARD_GAP_PX + 8,
    CARD_WIDTH_PX,
  );

  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[15px] font-bold uppercase tracking-[0.08em] text-slate-950">Line Connection Status</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Live overview of production lines and their current bag connections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
          {legendItems.map(({ label, icon: Icon, iconClassName }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading && lines.length === 0 ? (
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex w-full justify-center">
            <div className="flex min-w-max pt-1" style={{ gap: `${CARD_GAP_PX}px` }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex-none animate-pulse rounded-[18px] border border-slate-200 bg-slate-50"
                  style={{ width: `${CARD_WIDTH_PX}px`, height: `${CARD_HEIGHT_PX}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : dashboardItems.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
          No active production lines are available in the Production Line master.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto pb-1">
          <div
            className="relative px-1 py-2"
            style={{ width: `max(100%, ${dashboardRowWidth}px)` }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 border-t-2 border-dotted border-slate-200" />

            <div className="flex justify-center" style={{ gap: `${CARD_GAP_PX}px` }}>
              {dashboardItems.map(({ line, connection, state }) => {
                const meta = stateMeta[state];
                const Icon = meta.icon;
                const connectedAt = formatConnectedDate(connection?.connected_at);

                return (
                  <div
                    key={line.id}
                    className="relative z-10 flex flex-none flex-col"
                    style={{ width: `${CARD_WIDTH_PX}px`, minWidth: `${CARD_WIDTH_PX}px` }}
                  >
                    <article
                      className={cn(
                        "relative flex h-full flex-1 flex-col rounded-[18px] border bg-white px-3.5 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,0.04)]",
                        meta.borderClassName,
                      )}
                      style={{ width: `${CARD_WIDTH_PX}px`, minWidth: `${CARD_WIDTH_PX}px`, height: `${CARD_HEIGHT_PX}px` }}
                    >
                      <div className="flex items-start justify-center">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white",
                            meta.iconClassName,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="mt-1.5 text-[28px] font-bold leading-none tracking-tight text-slate-950">
                          {formatLineLabel(line)}
                        </div>
                        <div
                          className={cn(
                            "mx-auto mt-2.5 inline-flex rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
                            meta.badgeClassName,
                          )}
                        >
                          {meta.badgeLabel}
                        </div>
                      </div>

                      {connection ? (
                        <div className="mt-3 flex flex-1 flex-col items-center text-center">
                          <div className="text-[15px] font-semibold text-slate-950">{formatBagLabel(connection.serial_no)}</div>
                          <div className="mt-1.5 inline-flex rounded-md bg-[#2c315e] px-2.5 py-1 text-[11px] font-semibold text-white">
                            {formatWeight(connection.weight_kg)} kgs
                          </div>

                          <div className={cn("mt-3 inline-flex flex-col items-start gap-1.5 text-left text-[12px]", meta.contentMutedClassName)}>
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3 w-3 text-slate-500" />
                              <span>{connectedAt.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock3 className="h-3 w-3 text-slate-500" />
                              <span>{connectedAt.time}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-1 items-center">
                          <div
                            className={cn(
                              "w-full rounded-[14px] px-3 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                              meta.emptyPanelClassName,
                            )}
                          >
                            <div className="text-[14px] font-semibold text-slate-800">{meta.emptyPrimaryText}</div>
                            <div className={cn("mt-1 text-[12px]", meta.contentMutedClassName)}>{meta.emptySecondaryText}</div>
                          </div>
                        </div>
                      )}
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LineConnectDashboard;
