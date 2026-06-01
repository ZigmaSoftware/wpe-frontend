import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { coreApi, grnApi } from "@/lib/api";
import { buildAppNavigation } from "@/lib/appNavigation";
import { normalizeGrnResponse, normalizeListResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type {
  ApiPaginatedResult,
  ApiSuccessEnvelope,
  Contact,
  GrnListResponse,
  QcrRecord,
  StoreStockRecord,
} from "@/lib/types";
import { PRODUCTION_AD_WEIGHTAGE_ROUTE } from "@/features/production/utils/routes";
import { GRN_PROCESS_ROUTE } from "@/features/grn/utils/routes";
import { useAuth } from "@/providers/AuthProvider";

const getListFromResponse = <T,>(payload: Contact[] | { data: Contact[] } | unknown) => {
  try {
    return normalizeListResponse<T>(payload);
  } catch {
    return [];
  }
};

const getStoreCount = (payload: ApiSuccessEnvelope<ApiPaginatedResult<StoreStockRecord>>) => {
  try {
    return unwrapSuccessEnvelope(payload).count ?? 0;
  } catch {
    return 0;
  }
};

const getGrnRecords = (payload: GrnListResponse) => {
  try {
    return normalizeGrnResponse(payload).data;
  } catch {
    return [];
  }
};

const DashboardPage = () => {
  const { adminMenu = [] } = useAuth();
  const navigation = useMemo(() => buildAppNavigation(adminMenu), [adminMenu]);

  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [
        contactsResult,
        storeStockResult,
        blendingStockResult,
        grnActiveResult,
        qcrActiveResult,
      ] = await Promise.allSettled([
        coreApi.get<Contact[] | { data: Contact[] }>("/api/contacts/contacts/"),
        coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<StoreStockRecord>>>("/api/store/stock/", {
          params: { page_size: 1 },
        }),
        coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<StoreStockRecord>>>("/api/store/stock/", {
          params: { warehouse_code: "BLENDING", page_size: 1 },
        }),
        grnApi.get<GrnListResponse>("/api/grn/"),
        grnApi.get<QcrRecord[]>("/api/qcr/"),
      ]);

      const failedSources: string[] = [];

      if (contactsResult.status === "rejected") failedSources.push("Contacts");
      if (storeStockResult.status === "rejected") failedSources.push("Store Stock");
      if (blendingStockResult.status === "rejected") failedSources.push("Blending Stock");
      if (grnActiveResult.status === "rejected") failedSources.push("GRN");
      if (qcrActiveResult.status === "rejected") failedSources.push("QCR");

      return {
        contacts:
          contactsResult.status === "fulfilled" ? getListFromResponse<Contact>(contactsResult.value.data) : [],
        storeStockCount:
          storeStockResult.status === "fulfilled" ? getStoreCount(storeStockResult.value.data) : 0,
        blendingStockCount:
          blendingStockResult.status === "fulfilled" ? getStoreCount(blendingStockResult.value.data) : 0,
        grn: grnActiveResult.status === "fulfilled" ? getGrnRecords(grnActiveResult.value.data) : [],
        qcr: qcrActiveResult.status === "fulfilled" ? qcrActiveResult.value.data : [],
        failedSources,
      };
    },
  });

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  const {
    contacts = [],
    storeStockCount = 0,
    blendingStockCount = 0,
    grn = [],
    qcr = [],
    failedSources = [],
  } = overviewQuery.data ?? {};
  const hasConnectionIssues = failedSources.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Zigma · WPE ERP"
        title="Operations Dashboard"
        description="Current backend counts, active workspace routes, and receiving visibility from the live WPE application."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to={GRN_PROCESS_ROUTE}>Open GRN</Link>
            </Button>
            <Button asChild>
              <Link to={PRODUCTION_AD_WEIGHTAGE_ROUTE}>Open Production</Link>
            </Button>
          </>
        }
      />

      {hasConnectionIssues ? (
        <div className="rounded-[10px] border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          Some dashboard sources are currently unavailable: {failedSources.join(", ")}. The shell stays available, and
          any reachable sections will continue to render.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Contacts" value={contacts.length} hint={`${contacts.filter((contact) => contact.is_active).length} active`} />
        <StatCard label="Store Stock Rows" value={storeStockCount} hint="Persisted warehouse balances" />
        <StatCard label="Blending Stock Rows" value={blendingStockCount} hint="Blending inventory rows" />
        <StatCard label="GRN Process" value={grn.length} hint="Active goods receipt records" />
        <StatCard label="QCR Queue" value={qcr.length} hint="Current quality review records" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="wpe-surface">
          <div className="wpe-surface-head">
            <div>
              <div className="wpe-surface-title">Workspace Modules</div>
              <div className="wpe-surface-subtitle">
                Mega-menu navigation generated from the current active route definitions.
              </div>
            </div>
            <div className="ml-auto">
              <Badge variant="outline">{navigation.workspace.length} groups</Badge>
            </div>
          </div>
          <div className="wpe-surface-body">
            <div className="wpe-module-grid">
              {navigation.workspace.map((group) => (
                <Link key={group.key} to={group.items[0]?.to ?? "#"} className="wpe-module-card">
                  <span className="wpe-module-icon">
                    <group.icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="wpe-module-card-title">{group.label}</div>
                    <div className="wpe-module-card-text">
                      {group.items.map((item) => item.label).join(" · ")}
                    </div>
                    <div className="wpe-module-card-meta">{group.items.length} active route entries</div>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 text-[var(--wpe-faint)]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="wpe-surface">
          <div className="wpe-surface-head">
            <div>
              <div className="wpe-surface-title">GRN / QCR Snapshot</div>
              <div className="wpe-surface-subtitle">Live items from the receiving pipeline and quality queue.</div>
            </div>
          </div>
          <div className="wpe-surface-body">
            {grn.length === 0 && qcr.length === 0 ? (
              <div className="rounded-[7px] border border-dashed border-border bg-secondary/50 px-4 py-5 text-sm text-muted-foreground">
                No GRN or QCR records are available to display right now.
              </div>
            ) : (
              <div className="wpe-list-stack">
                {grn.slice(0, 3).map((record) => (
                  <div key={`grn-${record.id}`} className="wpe-list-row">
                    <div className="wpe-list-row-copy">
                      <div className="wpe-list-row-title">{record.grn_no}</div>
                      <div className="wpe-list-row-meta">
                        {record.supplier_details.trade_name || record.trade_name || "Unknown supplier"}
                      </div>
                    </div>
                    <div className="wpe-list-row-code">{record.process_status}</div>
                  </div>
                ))}
                {qcr.slice(0, 2).map((record) => (
                  <div key={`qcr-${record.id}`} className="wpe-list-row">
                    <div className="wpe-list-row-copy">
                      <div className="wpe-list-row-title">{record.grn_reference_no}</div>
                      <div className="wpe-list-row-meta">QCR unique id: {record.unique_id}</div>
                    </div>
                    <div className="wpe-list-row-code">{record.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="wpe-surface">
          <div className="wpe-surface-head">
            <div>
              <div className="wpe-surface-title">Recent Contacts</div>
              <div className="wpe-surface-subtitle">Directly from the Core contacts endpoint.</div>
            </div>
          </div>
          <div className="wpe-surface-body">
            {contacts.length === 0 ? (
              <div className="rounded-[7px] border border-dashed border-border bg-secondary/50 px-4 py-5 text-sm text-muted-foreground">
                No recent contacts are available right now.
              </div>
            ) : (
              <div className="wpe-list-stack">
                {contacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="wpe-list-row">
                    <div className="wpe-list-row-copy">
                      <div className="wpe-list-row-title">{contact.name}</div>
                      <div className="wpe-list-row-meta">
                        {contact.category} · {contact.company_name || "No company"}
                      </div>
                    </div>
                    <div className="wpe-list-row-code">{contact.ref_code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="wpe-surface">
          <div className="wpe-surface-head">
            <div>
              <div className="wpe-surface-title">Master Domains</div>
              <div className="wpe-surface-subtitle">Current master groups exposed through active routes and permissions.</div>
            </div>
            <div className="ml-auto">
              <Badge variant="outline">{navigation.masters.length} groups</Badge>
            </div>
          </div>
          <div className="wpe-surface-body">
            <div className="wpe-module-grid">
              {navigation.masters.map((group) => (
                <Link key={group.key} to={group.to ?? group.items[0]?.to ?? "#"} className="wpe-module-card">
                  <span className="wpe-module-icon">
                    <group.icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="wpe-module-card-title">{group.label}</div>
                    <div className="wpe-module-card-text">{group.items.slice(0, 3).map((item) => item.label).join(" · ")}</div>
                    <div className="wpe-module-card-meta">{group.items.length} screens linked</div>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 text-[var(--wpe-faint)]" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
