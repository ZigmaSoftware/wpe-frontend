import { useQuery } from "@tanstack/react-query";
import { coreApi, grnApi } from "@/lib/api";
import { normalizeGrnResponse, normalizeListResponse, unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type {
  ApiSuccessEnvelope,
  Contact,
  GrnListResponse,
  Presale,
  QcrRecord,
  StoreStockRecord,
  ApiPaginatedResult,
} from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LoadingState } from "@/components/QueryState";

const DashboardPage = () => {
  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [contacts, storeStock, blendingStock, presales, grnActive, qcrActive] = await Promise.all([
        coreApi.get<Contact[] | { data: Contact[] }>("/api/contacts/contacts/"),
        coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<StoreStockRecord>>>("/api/store/stock/", {
          params: { page_size: 1 },
        }),
        coreApi.get<ApiSuccessEnvelope<ApiPaginatedResult<StoreStockRecord>>>("/api/store/stock/", {
          params: { warehouse_code: "BLENDING", page_size: 1 },
        }),
        coreApi.get<Presale[]>("/api/presales/presales/"),
        grnApi.get<GrnListResponse>("/api/grn/"),
        grnApi.get<QcrRecord[]>("/api/qcr/"),
      ]);

      const storeStockPayload = unwrapSuccessEnvelope(storeStock.data);
      const blendingStockPayload = unwrapSuccessEnvelope(blendingStock.data);

      return {
        contacts: normalizeListResponse<Contact>(contacts.data),
        storeStockCount: storeStockPayload.count ?? 0,
        blendingStockCount: blendingStockPayload.count ?? 0,
        presales: normalizeListResponse<Presale>(presales.data),
        grn: normalizeGrnResponse(grnActive.data).data,
        qcr: qcrActive.data,
      };
    },
  });

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  const isOffline = overviewQuery.isError;
  const { contacts = [], storeStockCount = 0, blendingStockCount = 0, presales = [], grn = [], qcr = [] } =
    overviewQuery.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Live counts from the Core and GRN backends."
      />

      {isOffline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Backend is currently unreachable — showing last known or placeholder values.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Contacts" value={contacts.length} hint={`${contacts.filter((contact) => contact.is_active).length} active`} />
        <StatCard label="Store Stock Rows" value={storeStockCount} hint="Persisted warehouse balances" />
        <StatCard label="Blending Stock Rows" value={blendingStockCount} hint="Warehouse-scoped inventory rows" />
        <StatCard label="Presales" value={presales.length} hint="All presales records" />
        <StatCard label="GRN" value={grn.length} hint="Active GRN Process records" />
        <StatCard label="QCR" value={qcr.length} hint="Active QCR queue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">Recent Contacts</h2>
          <div className="mt-4 space-y-3">
            {contacts.slice(0, 5).map((contact) => (
              <div key={contact.id} className="flex items-center justify-between rounded-xl border border-border/80 px-4 py-3">
                <div>
                  <div className="font-medium text-card-foreground">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {contact.category} · {contact.company_name || "No company"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{contact.ref_code}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">GRN and QCR Snapshot</h2>
          <div className="mt-4 space-y-3">
            {grn.slice(0, 3).map((record) => (
              <div key={`grn-${record.id}`} className="rounded-xl border border-border/80 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-card-foreground">{record.grn_no}</div>
                  <div className="text-xs text-muted-foreground">{record.process_status}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {record.supplier_details.trade_name || record.trade_name || "Unknown supplier"}
                </div>
              </div>
            ))}

            {qcr.slice(0, 2).map((record) => (
              <div key={`qcr-${record.id}`} className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900">{record.grn_reference_no}</div>
                  <div className="text-xs font-medium text-amber-700">{record.status}</div>
                </div>
                <div className="text-sm text-slate-600">QCR unique id: {record.unique_id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
