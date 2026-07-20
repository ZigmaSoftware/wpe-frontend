import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import type { AdminMenuMain } from "@/features/admin-master/types";

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const dashboardDataMocks = vi.hoisted(() => ({
  fetchDashboardStoreSnapshot: vi.fn(),
  fetchGrnActiveRecords: vi.fn(),
  fetchGrnPendingRecords: vi.fn(),
  fetchQcrActiveRecords: vi.fn(),
  fetchQcrCompletedRecords: vi.fn(),
  fetchProductionDashboard: vi.fn(),
  fetchDashboardRequestCounts: vi.fn(),
  fetchDashboardRequestActivity: vi.fn(),
}));

vi.mock("@/providers/AuthProvider", () => ({
  useAuth: () => authMocks.useAuth(),
}));

vi.mock("@/components/dashboard/dashboardData", async () => {
  const actual = await vi.importActual<typeof import("@/components/dashboard/dashboardData")>("@/components/dashboard/dashboardData");
  return {
    ...actual,
    ...dashboardDataMocks,
  };
});

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => children,
  AreaChart: () => null,
  Area: () => null,
  PieChart: ({ children }: { children?: unknown }) => children,
  Pie: ({ children }: { children?: unknown }) => children,
  Cell: () => null,
  Tooltip: () => null,
  BarChart: ({ children }: { children?: unknown }) => children,
  Bar: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const makeAdminMenu = (codes: string[]): AdminMenuMain[] => [
  {
    id: 1,
    name: "Workspace",
    code: "workspace",
    order_no: 1,
    sections: [
      {
        id: 11,
        name: "Screens",
        code: "screens",
        order_no: 1,
        screens: codes.map((code, index) => ({
          id: index + 1,
          screen_name: code,
          code,
          order_no: index + 1,
          available_actions: ["list"],
          action_permissions: { list: true },
        })),
      },
    ],
  },
];

const renderDashboard = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/dashboard"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("DashboardPage", () => {
  beforeEach(() => {
    authMocks.useAuth.mockReturnValue({
      user: {
        username: "imran",
        first_name: "Imran",
        role_name: "Administrator",
        email: "imran@example.com",
        is_staff: false,
      },
      adminMenu: makeAdminMenu([
        "dashboard-home",
        "store-stock-workspace",
        "requests-store-request-workspace",
        "grn-process-workspace",
        "production-ad-weightage-workspace",
      ]),
      resolvedPermissions: null,
      isAuthenticated: true,
      isBootstrapping: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      handleForcedLogout: vi.fn(),
      refreshAdminPermissions: vi.fn(),
      can: vi.fn(),
    });

    dashboardDataMocks.fetchDashboardStoreSnapshot.mockResolvedValue({
      storeDashboard: { warehouses: 8 },
      storeInventory: {
        total: 26,
        items: [
          { item_name: "Additive WC", current_stock: 12.4 },
          { item_name: "Benzene Mix", current_stock: 8.7 },
          { item_name: "Base Chem", current_stock: 15.6 },
          { item_name: "Granules White", current_stock: 6.3 },
          { item_name: "Granules Green", current_stock: 9.8 },
          { item_name: "Concentrate Red", current_stock: 4.2 },
          { item_name: "Lube Oil", current_stock: 7.1 },
          { item_name: "Discoloration", current_stock: 5.6 },
        ],
      },
      blendingInventory: {
        total: 5,
        items: [],
      },
    });
    dashboardDataMocks.fetchGrnActiveRecords.mockResolvedValue({
      data: [
        {
          id: 1,
          grn_no: "GRN-0001",
          grn_date: "2026-07-01",
          trade_name: "Supplier A",
          supplier_details: { trade_name: "Supplier A", person_name: "A" },
          document_requirement_details: { req_date: "2026-07-02" },
          updated_at: "2026-07-01T08:00:00Z",
          items: [],
        },
      ],
    });
    dashboardDataMocks.fetchGrnPendingRecords.mockResolvedValue({
      data: [
        {
          id: 2,
          grn_no: "GRN-0002",
          grn_date: "2026-07-01",
          trade_name: "Supplier B",
          supplier_details: { trade_name: "Supplier B", person_name: "B" },
          document_requirement_details: { req_date: "2026-07-02" },
          updated_at: "2026-07-01T08:30:00Z",
          items: [],
        },
        {
          id: 3,
          grn_no: "GRN-0003",
          grn_date: "2026-07-01",
          trade_name: "Supplier C",
          supplier_details: { trade_name: "Supplier C", person_name: "C" },
          document_requirement_details: { req_date: "2026-07-03" },
          updated_at: "2026-07-01T09:00:00Z",
          items: [],
        },
      ],
    });
    dashboardDataMocks.fetchQcrActiveRecords.mockResolvedValue([
      {
        id: 11,
        grn_reference_no: "GRN-0011",
        generated_grn_no: "WPE-GRN-0011",
        status: "Moved to QCR",
        moved_to_qcr_at: "2026-07-02T09:00:00Z",
        moved_to_qcr_by: "Imran",
        updated_at: "2026-07-02T09:00:00Z",
        qcr_items: [{ accepted_qty: "12.4", received_qty: "12.4", sent_qty: "12.4" }],
        source_grn_data: {
          process_status: "Moved to QCR",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier D" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
      {
        id: 12,
        grn_reference_no: "GRN-0012",
        generated_grn_no: "WPE-GRN-0012",
        status: "Moved to QCR",
        moved_to_qcr_at: "2026-07-02T08:30:00Z",
        moved_to_qcr_by: "Imran",
        updated_at: "2026-07-02T08:30:00Z",
        qcr_items: [{ accepted_qty: "8.7", received_qty: "8.7", sent_qty: "8.7" }],
        source_grn_data: {
          process_status: "Moved to QCR",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier E" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
      {
        id: 13,
        grn_reference_no: "GRN-0013",
        generated_grn_no: "WPE-GRN-0013",
        status: "Moved to QCR",
        moved_to_qcr_at: "2026-07-02T08:00:00Z",
        moved_to_qcr_by: "Imran",
        updated_at: "2026-07-02T08:00:00Z",
        qcr_items: [{ accepted_qty: "6.3", received_qty: "6.3", sent_qty: "6.3" }],
        source_grn_data: {
          process_status: "Moved to QCR",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier F" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
    ]);
    dashboardDataMocks.fetchQcrCompletedRecords.mockResolvedValue([
      {
        id: 21,
        grn_reference_no: "GRN-0021",
        generated_grn_no: "WPE-GRN-0021",
        status: "Approved",
        moved_to_qcr_at: "2026-07-01T10:00:00Z",
        moved_to_qcr_by: "Imran",
        qcr_completed_at: "2026-07-02T07:00:00Z",
        qcr_completed_by: "Imran",
        updated_at: "2026-07-02T07:00:00Z",
        qcr_items: [{ accepted_qty: "9.8", received_qty: "9.8", sent_qty: "9.8" }],
        source_grn_data: {
          process_status: "Approved",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier G" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
      {
        id: 22,
        grn_reference_no: "GRN-0022",
        generated_grn_no: "WPE-GRN-0022",
        status: "Approved",
        moved_to_qcr_at: "2026-07-01T11:00:00Z",
        moved_to_qcr_by: "Imran",
        qcr_completed_at: "2026-07-02T06:00:00Z",
        qcr_completed_by: "Imran",
        updated_at: "2026-07-02T06:00:00Z",
        qcr_items: [{ accepted_qty: "4.2", received_qty: "4.2", sent_qty: "4.2" }],
        source_grn_data: {
          process_status: "Approved",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier H" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
      {
        id: 23,
        grn_reference_no: "GRN-0023",
        generated_grn_no: "WPE-GRN-0023",
        status: "Approved",
        moved_to_qcr_at: "2026-07-01T12:00:00Z",
        moved_to_qcr_by: "Imran",
        qcr_completed_at: "2026-07-02T05:00:00Z",
        qcr_completed_by: "Imran",
        updated_at: "2026-07-02T05:00:00Z",
        qcr_items: [{ accepted_qty: "3.9", received_qty: "3.9", sent_qty: "3.9" }],
        source_grn_data: {
          process_status: "Approved",
          grn_date: "2026-07-01",
          supplier_details: { trade_name: "Supplier I" },
          document_requirement_details: { req_date: "2026-07-02" },
        },
        snapshot: {
          grn_date: "2026-07-01",
          document_requirement_details: { req_date: "2026-07-02" },
        },
      },
    ]);
    dashboardDataMocks.fetchProductionDashboard.mockResolvedValue({
      byStage: {
        AD: [{ id: 101, production_id: "AD-001", display_batch_no: "AD01", status: "OPEN", workflow_status: "OPEN", production_date: "2026-07-01T08:00:00Z" }],
        BL: [{ id: 102, production_id: "BL-001", display_batch_no: "BL01", status: "OPEN", workflow_status: "OPEN", production_date: "2026-07-01T08:30:00Z" }],
        GL: [{ id: 103, production_id: "GL-001", display_batch_no: "GL01", status: "OPEN", workflow_status: "OPEN", production_date: "2026-07-01T09:00:00Z" }],
        PR: [
          { id: 104, production_id: "PR-001", display_batch_no: "PR01", status: "OPEN", workflow_status: "OPEN", production_date: "2026-07-01T09:30:00Z" },
          { id: 105, production_id: "PR-002", display_batch_no: "PR02", status: "COMPLETED", workflow_status: "COMPLETED", production_date: "2026-07-01T10:00:00Z", end_date_time: "2026-07-02T04:00:00Z" },
        ],
      },
    });
    dashboardDataMocks.fetchDashboardRequestCounts.mockResolvedValue({
      openBlendingRequests: 3,
      headApprovals: 2,
      requestApprovals: 2,
      releaseStock: 1,
      activeRequests: 7,
    });
    dashboardDataMocks.fetchDashboardRequestActivity.mockResolvedValue([
      {
        id: 301,
        request_no: "SR-0007",
        status: "PENDING_REQUEST_PROCESS",
        approved_at: "2026-07-02T10:15:00Z",
        head_action_by_username: "Vijay K.",
        requested_by_username: "Ajay",
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the dashboard inside AppLayout without breadcrumbs and omits inaccessible quick actions", async () => {
    renderDashboard();

    await screen.findByText("Store Stock Rows");

    expect(document.querySelector(".wpe-crumbbar")).not.toBeInTheDocument();
    expect(screen.getByText("Store Stock Rows")).toBeInTheDocument();
    expect(screen.getByText("Gate Entry (Pending)")).toBeInTheDocument();
    expect(screen.getByText("Production Stage Overview")).toBeInTheDocument();
    expect(screen.getByText("GRN Overview")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("New GRN")).toBeInTheDocument();
    expect(screen.getByText("New Production")).toBeInTheDocument();
    expect(screen.queryByText("Add Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
    expect(screen.queryByText("BOM Variants")).not.toBeInTheDocument();
    expect(screen.getByText("Drive")).toBeInTheDocument();
    expect(screen.getByText("Task Tracker")).toBeInTheDocument();
  });

  it("opens drive in a new browser tab from the dashboard header", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderDashboard();

    await screen.findByRole("button", { name: "Open Drive" });

    fireEvent.click(screen.getByRole("button", { name: "Open Drive" }));

    expect(openSpy).toHaveBeenCalledWith("/app/drive", "_blank", "noopener,noreferrer");
  });

  it("opens the task tracker in a new browser tab from the dashboard header", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderDashboard();

    await screen.findByRole("button", { name: "Open Task Tracker" });

    fireEvent.click(screen.getByRole("button", { name: "Open Task Tracker" }));

    expect(openSpy).toHaveBeenCalledWith("/app/task-tracker", "_blank", "noopener,noreferrer");
  });
});
