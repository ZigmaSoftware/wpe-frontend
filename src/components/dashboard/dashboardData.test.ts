import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProductionDashboard, buildDashboardOverview } from "@/components/dashboard/dashboardData";
import { productionWorkspaceApi } from "@/features/production/api/productionWorkspaceApi";
import type { GrnListResponse, GrnRecord, ProductionStageRecord, QcrRecord, StoreStockRequest } from "@/lib/types";

vi.mock("@/features/production/api/productionWorkspaceApi", () => ({
  productionWorkspaceApi: {
    listStageRecords: vi.fn(),
  },
}));

const makeProductionRecord = (overrides: Partial<ProductionStageRecord> = {}) =>
  ({
    id: overrides.id ?? Math.floor(Math.random() * 1000),
    production_id: overrides.production_id ?? "PR-001",
    display_batch_no: overrides.display_batch_no ?? "BATCH-001",
    status: overrides.status ?? "IN_PROGRESS",
    workflow_status: overrides.workflow_status ?? "OPEN",
    production_date: overrides.production_date ?? "2026-07-01T09:00:00Z",
    start_date_time: overrides.start_date_time ?? "2026-07-01T09:00:00Z",
    end_date_time: overrides.end_date_time ?? null,
    ...overrides,
  }) as ProductionStageRecord;

const makeQcrRecord = (overrides: Partial<QcrRecord> = {}) =>
  ({
    id: overrides.id ?? Math.floor(Math.random() * 1000),
    grn_reference_no: overrides.grn_reference_no ?? "GRN-001",
    generated_grn_no: overrides.generated_grn_no ?? "WPE-GRN-001",
    status: overrides.status ?? "Approved",
    updated_at: overrides.updated_at ?? "2026-07-02T10:00:00Z",
    moved_to_qcr_at: overrides.moved_to_qcr_at ?? "2026-07-02T09:00:00Z",
    moved_to_qcr_by: overrides.moved_to_qcr_by ?? "Imran",
    qcr_completed_at: overrides.qcr_completed_at ?? null,
    qcr_completed_by: overrides.qcr_completed_by ?? null,
    qcr_items:
      overrides.qcr_items ??
      [
        {
          accepted_qty: "10",
          received_qty: "10",
          sent_qty: "10",
          rejected_qty: "0",
        },
      ],
    source_grn_data: overrides.source_grn_data ?? {
      process_status: "Approved",
      grn_date: "2026-07-01",
      supplier_details: { trade_name: "Supplier A" },
      document_requirement_details: { req_date: "2026-07-02" },
    },
    snapshot: overrides.snapshot ?? {
      grn_date: "2026-07-01",
      document_requirement_details: { req_date: "2026-07-02" },
    },
    ...overrides,
  }) as QcrRecord;

const makeGrnRecord = (overrides: Partial<GrnRecord> = {}) =>
  ({
    id: overrides.id ?? Math.floor(Math.random() * 1000),
    grn_no: overrides.grn_no ?? "GE-001",
    grn_date: overrides.grn_date ?? "2026-07-01",
    updated_at: overrides.updated_at ?? "2026-07-01T11:00:00Z",
    moved_to_qcr_by: overrides.moved_to_qcr_by ?? "Imran",
    trade_name: overrides.trade_name ?? "Supplier A",
    supplier_details: overrides.supplier_details ?? {
      trade_name: "Supplier A",
      person_name: "Imran",
    },
    document_requirement_details: overrides.document_requirement_details ?? {
      req_date: "2026-07-03",
    },
    items: overrides.items ?? [],
    ...overrides,
  }) as GrnRecord;

const makeGrnResponse = (data: GrnRecord[]) =>
  ({
    data,
    total: data.length,
  }) as GrnListResponse;

const makeStoreRequest = (overrides: Partial<StoreStockRequest> = {}) =>
  ({
    id: overrides.id ?? Math.floor(Math.random() * 1000),
    request_no: overrides.request_no ?? "SR-001",
    status: overrides.status ?? "PENDING_REQUEST_PROCESS",
    requested_at: overrides.requested_at ?? "2026-07-02T10:30:00Z",
    approved_at: overrides.approved_at ?? null,
    processed_at: overrides.processed_at ?? null,
    released_at: overrides.released_at ?? null,
    requested_by_username: overrides.requested_by_username ?? "Ajay",
    approved_by_username: overrides.approved_by_username ?? "Vijay",
    head_action_by_username: overrides.head_action_by_username ?? "Vijay",
    released_by_username: overrides.released_by_username ?? null,
    ...overrides,
  }) as StoreStockRequest;

describe("dashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates production stage pages into a dashboard payload", async () => {
    const listStageRecords = vi.mocked(productionWorkspaceApi.listStageRecords);

    listStageRecords.mockImplementation(async ({ stage, page }) => {
      if (stage === "AD" && page === 1) {
        return {
          count: 2,
          next: "page-2",
          previous: null,
          results: [makeProductionRecord({ id: 1, production_id: "AD-001" })],
        };
      }

      if (stage === "AD" && page === 2) {
        return {
          count: 2,
          next: null,
          previous: "page-1",
          results: [makeProductionRecord({ id: 2, production_id: "AD-002" })],
        };
      }

      return {
        count: 1,
        next: null,
        previous: null,
        results: [makeProductionRecord({ id: page + stage.charCodeAt(0), production_id: `${stage}-001` })],
      };
    });

    const result = await fetchProductionDashboard();

    expect(result.byStage.AD).toHaveLength(2);
    expect(result.byStage.BL).toHaveLength(1);
    expect(result.byStage.GL).toHaveLength(1);
    expect(result.byStage.PR).toHaveLength(1);
    expect(listStageRecords).toHaveBeenCalledWith({ stage: "AD", page: 2, pageSize: 200 });
  });

  it("splits PR records into active and completed buckets", () => {
    const overview = buildDashboardOverview({
      period: "this-month",
      production: {
        byStage: {
          AD: [makeProductionRecord({ id: 1, production_id: "AD-001" })],
          BL: [makeProductionRecord({ id: 2, production_id: "BL-001" })],
          GL: [makeProductionRecord({ id: 3, production_id: "GL-001" })],
          PR: [
            makeProductionRecord({ id: 4, production_id: "PR-001", workflow_status: "COMPLETED", status: "COMPLETED" }),
            makeProductionRecord({ id: 5, production_id: "PR-002", workflow_status: "OPEN", status: "IN_PROGRESS" }),
          ],
        },
      },
      hasRouteAccess: () => true,
    });

    expect(overview.production.totalBatches).toBe(5);
    expect(overview.production.completionRate).toBe(20);
    expect(overview.production.breakdown.map((item) => [item.label, item.value])).toEqual([
      ["AD - Weightage", 1],
      ["BL - Blending", 1],
      ["GL - Granulation", 1],
      ["PR - Production", 1],
      ["Completed", 1],
    ]);
  });

  it("normalizes GRN and QCR records into dashboard summary buckets", () => {
    const overview = buildDashboardOverview({
      period: "this-month",
      grnActive: makeGrnResponse([makeGrnRecord({ id: 11, trade_name: "Supplier A" })]),
      grnPending: makeGrnResponse([
        makeGrnRecord({
          id: 12,
          grn_no: "GE-012",
          trade_name: "Supplier B",
          supplier_details: { trade_name: "Supplier B", person_name: "B" } as GrnRecord["supplier_details"],
        }),
        makeGrnRecord({
          id: 13,
          grn_no: "GE-013",
          trade_name: "Supplier C",
          supplier_details: { trade_name: "Supplier C", person_name: "C" } as GrnRecord["supplier_details"],
        }),
      ]),
      qcrActive: [
        makeQcrRecord({
          id: 21,
          grn_reference_no: "GRN-021",
          qcr_items: [{ accepted_qty: "25", received_qty: "25", sent_qty: "25" }],
          source_grn_data: {
            process_status: "Moved to QCR",
            grn_date: "2026-07-01",
            supplier_details: { trade_name: "Supplier D" },
            document_requirement_details: { req_date: "2026-07-02" },
          },
        }),
      ],
      qcrCompleted: [
        makeQcrRecord({
          id: 22,
          grn_reference_no: "GRN-022",
          status: "Approved",
          qcr_completed_at: "2026-07-02T11:00:00Z",
          qcr_items: [{ accepted_qty: "40", received_qty: "40", sent_qty: "40" }],
          source_grn_data: {
            process_status: "Approved",
            grn_date: "2026-07-01",
            supplier_details: { trade_name: "Supplier E" },
            document_requirement_details: { req_date: "2026-07-02" },
          },
        }),
        makeQcrRecord({
          id: 23,
          grn_reference_no: "GRN-023",
          status: "Rejected",
          qcr_completed_at: "2026-07-02T12:00:00Z",
          qcr_items: [{ accepted_qty: "0", received_qty: "10", sent_qty: "10", rejected_qty: "10" }],
          source_grn_data: {
            process_status: "Rejected",
            grn_date: "2026-07-01",
            supplier_details: { trade_name: "Supplier F" },
            document_requirement_details: { req_date: "2026-07-03" },
          },
        }),
      ],
      hasRouteAccess: () => true,
    });

    expect(overview.grnOverview.totalGrns).toBe(5);
    expect(overview.grnOverview.totalQtyReceived).toBe("75 Kgs");
    expect(overview.grnOverview.suppliers).toBe("6");
    expect(overview.grnOverview.onTimeRate).toBe("100%");
    expect(overview.grnOverview.breakdown.map((item) => [item.label, item.value])).toEqual([
      ["Completed", 1],
      ["QCR", 1],
      ["Pending", 2],
      ["Rejected", 1],
    ]);
  });

  it("sorts live recent activity newest-first and falls back when there is no data", () => {
    const liveOverview = buildDashboardOverview({
      period: "this-month",
      qcrActive: [
        makeQcrRecord({
          id: 31,
          grn_reference_no: "GRN-031",
          moved_to_qcr_at: "2026-07-02T09:00:00Z",
          updated_at: "2026-07-02T09:00:00Z",
        }),
      ],
      production: {
        byStage: {
          AD: [],
          BL: [],
          GL: [],
          PR: [makeProductionRecord({ id: 32, display_batch_no: "AD01", end_date_time: "2026-07-02T08:00:00Z", workflow_status: "COMPLETED", status: "COMPLETED" })],
        },
      },
      requestActivity: [
        makeStoreRequest({
          id: 33,
          request_no: "SR-0033",
          status: "PENDING_REQUEST_PROCESS",
          approved_at: "2026-07-02T10:30:00Z",
          head_action_by_username: "Vijay K.",
        }),
      ],
      hasRouteAccess: () => true,
    });

    expect(liveOverview.recentActivity[0]?.title).toBe("Store Request SR-0033 approved by Head");
    expect(liveOverview.recentActivity[1]?.title).toContain("moved to QCR");

    const fallbackOverview = buildDashboardOverview({
      period: "this-month",
      hasRouteAccess: () => false,
    });

    expect(fallbackOverview.recentActivity[0]?.title).toBe("GRN - WPE - 0012 moved to QCR");
    expect(fallbackOverview.recentActivity).toHaveLength(4);
  });

  it("filters quick actions using the current permission model", () => {
    const overview = buildDashboardOverview({
      period: "this-month",
      hasRouteAccess: (to) => to.includes("store-request") || to.includes("moved-to-qcr"),
    });

    expect(overview.quickActions.map((item) => item.label)).toEqual(["Store Request", "QCR Queue"]);
  });
});
