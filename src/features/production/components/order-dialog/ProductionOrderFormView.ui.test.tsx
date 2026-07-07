import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import ProductionOrderForm, { buildWorkCenterOptions } from "./ProductionOrderFormView";
import { createProductionOrderDefaultValues } from "./productionOrderForm";

const { coreApiGet } = vi.hoisted(() => ({
  coreApiGet: vi.fn(async (url: string) => {
    if (url.includes("/next-code/")) {
      return { data: { code: "PROD-1001" } };
    }

    if (url.includes("/work-centre-creations/lookup/")) {
      return { data: [] };
    }

    return { data: [] };
  }),
}));

vi.mock("@/features/wpe-masters/api/wpeMastersApi", () => ({
  wpeMastersApi: {
    locations: {
      lookup: vi.fn(async () => []),
    },
    users: {
      lookup: vi.fn(async () => []),
    },
    productionTypes: {
      lookup: vi.fn(async () => [{ id: 1, name: "WPE Additive Production" }]),
    },
  },
}));

vi.mock("@/lib/api", () => ({
  coreApi: {
    get: coreApiGet,
  },
}));

vi.mock("./GeneralTab", () => ({
  default: () => <div>General Section Content</div>,
}));

vi.mock("./MaterialsTab", () => ({
  default: () => <div>Materials Section Content</div>,
}));

vi.mock("./OutputTab", () => ({
  default: () => <div data-testid="output-section-state">Output Section Active</div>,
}));

vi.mock("./StagesTab", () => ({
  default: () => <div>Stages Placeholder Content</div>,
}));

vi.mock("./ScrapTab", () => ({
  default: () => <div>Scrap Placeholder Content</div>,
}));

vi.mock("./CostTab", () => ({
  default: () => <div>Cost Placeholder Content</div>,
}));

vi.mock("./ResourcesTab", () => ({
  default: () => <div>Resources Placeholder Content</div>,
}));

const renderForm = (props: Partial<ComponentProps<typeof ProductionOrderForm>> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProductionOrderForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        machines={[]}
        {...props}
      />
    </QueryClientProvider>,
  );
};

describe("ProductionOrderForm UI shell", () => {
  it("falls back to location records when dedicated work center master is empty", () => {
    const options = buildWorkCenterOptions(
      [
        { id: 10, name: "Coimbatore Plant" },
        { id: 11, name: "New Line Additive Work Center WIP" },
        { id: 12, name: "Blending Work Center WIP" },
      ],
      [],
    );

    expect(options).toEqual([
      { id: "11", name: "New Line Additive Work Center WIP" },
      { id: "12", name: "Blending Work Center WIP" },
    ]);
  });

  it("shows sidebar navigation in full form mode and does not render the old top tab list", async () => {
    renderForm();

    await waitFor(() => expect(screen.getByText("General Section Content")).toBeVisible());

    expect(screen.getByText("Sections")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /materials/i })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("switches visible sections from the left sidebar navigation", async () => {
    renderForm();

    await waitFor(() => expect(screen.getByText("General Section Content")).toBeVisible());
    expect(screen.queryByText("Materials Section Content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /materials/i }));

    await waitFor(() => expect(screen.getByText("Materials Section Content")).toBeVisible());
    expect(screen.queryByText("General Section Content")).not.toBeInTheDocument();
  });

  it("hides section navigation in focused output-only mode", async () => {
    renderForm({
      visibleTabs: ["output"],
      initialTab: "output",
      showFooterActions: false,
    });

    await waitFor(() => expect(screen.getByTestId("output-section-state")).toHaveTextContent("Output Section Active"));

    expect(screen.queryByText("Sections")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /general/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("output-section-state")).toHaveTextContent("Output Section Active");
  });

  it("shows generated production id state in create mode and saved state in edit mode", async () => {
    const createModeView = renderForm();

    await waitFor(() => expect(screen.getByText("Generated")).toBeVisible());
    expect(screen.getByText("PROD-1001")).toBeInTheDocument();
    createModeView.unmount();

    const initialValues = createProductionOrderDefaultValues();
    initialValues.production_id = "BL08";
    initialValues.production_for = "WPE";
    initialValues.production_type = "WPE Blend Production";
    initialValues.plan_rows = [{ length_mts: "1.000", qty_mts: "2.000", packets: "1" }];
    initialValues.resources.work_center = "20";
    initialValues.resources.shift_incharge = "30";

    renderForm({
      initialValues,
      orderId: 8,
    });

    await waitFor(() => expect(screen.getByText("Saved")).toBeVisible());
    expect(screen.getByText("BL08")).toBeInTheDocument();
  });

  it("does not mount the output section until the output tab is selected", async () => {
    renderForm();

    await waitFor(() => expect(screen.getByText("General Section Content")).toBeVisible());
    expect(screen.queryByTestId("output-section-state")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /output/i }));

    await waitFor(() => expect(screen.getByTestId("output-section-state")).toHaveTextContent("Output Section Active"));
  });
});
