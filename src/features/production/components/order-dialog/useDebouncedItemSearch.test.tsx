import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedItemSearch } from "./useDebouncedItemSearch";

const { lookupMock } = vi.hoisted(() => ({
  lookupMock: vi.fn(async () => []),
}));

vi.mock("@/features/wpe-masters/api/wpeMastersApi", () => ({
  wpeMastersApi: {
    productTypeSubtypes: {
      lookup: lookupMock,
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDebouncedItemSearch", () => {
  beforeEach(() => {
    lookupMock.mockClear();
  });

  it("does not force a category filter when no stage-specific category is provided", async () => {
    renderHook(() => useDebouncedItemSearch("wood"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(lookupMock).toHaveBeenCalled();
    }, {
      timeout: 1500,
    });

    expect(lookupMock).toHaveBeenCalledWith({
      category_id: undefined,
      search: "wood",
    });
  });
});
