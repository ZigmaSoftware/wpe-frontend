import { fireEvent, render, screen } from "@testing-library/react";
import { Shield } from "lucide-react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRouteGuard from "@/features/admin-master/components/AdminRouteGuard";
import DataTable from "@/components/erp/DataTable";
import FormPanel from "@/components/erp/FormPanel";
import PermissionMatrixPage from "@/components/erp/PermissionMatrixPage";

const authState = vi.hoisted(() => ({
  can: vi.fn(() => true),
  isBootstrapping: false,
}));

vi.mock("@/providers/AuthProvider", () => ({
  useAuth: () => ({
    can: authState.can,
    isBootstrapping: authState.isBootstrapping,
  }),
}));

describe("ERP shared shell", () => {
  beforeEach(() => {
    authState.can.mockReset();
    authState.can.mockReturnValue(true);
    authState.isBootstrapping = false;
  });

  it("renders the shared form panel header and body content", () => {
    render(
      <FormPanel open onOpenChange={() => undefined} title="Edit Machine" description="Panel description" size="lg">
        <div>Panel body</div>
      </FormPanel>,
    );

    expect(screen.getByText("Edit Machine")).toBeInTheDocument();
    expect(screen.getByText("Panel description")).toBeInTheDocument();
    expect(screen.getByText("Panel body")).toBeInTheDocument();
  });

  it("renders the shared data table rows and pagination summary", () => {
    render(
      <DataTable
        columns={[{ key: "name", title: "Name", render: (record: { name: string }) => record.name }]}
        records={[{ name: "Machine Alpha" }]}
        isLoading={false}
        isError={false}
        errorDescription="Failed"
        emptyTitle="Empty"
        emptyDescription="No data"
        page={1}
        pageSize={10}
        total={1}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Machine Alpha")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 - 1 of 1")).toBeInTheDocument();
  });

  it("renders the shared permission matrix and triggers save", () => {
    const onSave = vi.fn();

    render(
      <PermissionMatrixPage
        title="Role Permissions"
        description="Shared matrix"
        emptyTitle="No screens"
        emptyDescription="No permissions"
        icon={Shield}
        screens={[{ id: 1, name: "Inventory" }]}
        activeScreen={1}
        onScreenChange={() => undefined}
        matrix={[{ id: 1, label: "Warehouse", access: true }]}
        isLoading={false}
        isSaving={false}
        dirty
        onSave={onSave}
        columns={[{ key: "access", label: "Access", shortLabel: "Access", kind: "toggle" }]}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.label}
        activeScreenName="Inventory"
        allChecked={() => true}
        toggleColumn={() => undefined}
        rowAllChecked={() => true}
        toggleRow={() => undefined}
        getValue={(row) => row.access}
        setView={() => undefined}
        toggleField={() => undefined}
      />,
    );

    expect(screen.getByText("Warehouse")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /save changes/i })[0]);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("renders guarded admin pages when permission is granted", () => {
    authState.can.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRouteGuard screenCode="machine-master"><div>Admin Page</div></AdminRouteGuard>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("redirects guarded admin pages when permission is denied", () => {
    authState.can.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRouteGuard screenCode="machine-master"><div>Admin Page</div></AdminRouteGuard>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});
