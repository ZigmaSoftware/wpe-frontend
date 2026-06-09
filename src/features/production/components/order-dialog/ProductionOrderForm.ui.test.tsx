import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import ProductionOrderForm from "./ProductionOrderForm";

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

vi.mock("./ProductionGeneralTab", () => ({
  default: () => <div>General Section Content</div>,
}));

vi.mock("./ProductionMaterialsTab", () => ({
  default: () => <div>Materials Section Content</div>,
}));

vi.mock("./ProductionOutputTab", () => ({
  default: ({ isActive }: { isActive?: boolean }) => (
    <div data-testid="output-section-state">{isActive ? "Output Section Active" : "Output Section Inactive"}</div>
  ),
}));

vi.mock("./ProductionPlaceholderTab", () => ({
  default: ({ title }: { title: string }) => <div>{title} Placeholder Content</div>,
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

  it("keeps the output section inactive until the output tab is selected", async () => {
    renderForm();

    await waitFor(() => expect(screen.getByText("General Section Content")).toBeVisible());
    expect(screen.getByTestId("output-section-state")).toHaveTextContent("Output Section Inactive");

    fireEvent.click(screen.getByRole("button", { name: /output/i }));

    await waitFor(() => expect(screen.getByTestId("output-section-state")).toHaveTextContent("Output Section Active"));
  });
});
