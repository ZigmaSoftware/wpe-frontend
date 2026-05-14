import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RefreshCw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import { itemsInventoryQueryKeys } from "@/features/items/api/queryKeys";
import InventoryHistorySheet from "@/features/items/components/InventoryHistorySheet";
import InventorySummaryTable from "@/features/items/components/InventorySummaryTable";
import {
  INVENTORY_MODULES,
  type InventoryHistoryState,
  type InventoryHistoryTarget,
  type InventoryModule,
  type InventorySummaryRow,
  type InventorySummaryState,
} from "@/features/items/types";
import { getApiErrorMessage } from "@/lib/api-helpers";

const createSummaryState = (): InventorySummaryState => ({
  page: 1,
  pageSize: 20,
  search: "",
});

const createHistoryState = (): InventoryHistoryState => ({
  page: 1,
  pageSize: 10,
  search: "",
  dateFrom: "",
  dateTo: "",
});

const isAccessDeniedError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 403;

const ItemsPage = () => {
  const [activeModule, setActiveModule] = useState<InventoryModule>("store");
  const [summaryState, setSummaryState] = useState<Record<InventoryModule, InventorySummaryState>>({
    store: createSummaryState(),
    blending: createSummaryState(),
  });
  const [historyState, setHistoryState] = useState<InventoryHistoryState>(createHistoryState);
  const [historyTarget, setHistoryTarget] = useState<InventoryHistoryTarget | null>(null);

  const deferredStoreSearch = useDeferredValue(summaryState.store.search.trim());
  const deferredBlendingSearch = useDeferredValue(summaryState.blending.search.trim());
  const deferredHistorySearch = useDeferredValue(historyState.search.trim());

  const storeSummaryQuery = useQuery({
    queryKey: itemsInventoryQueryKeys.summary("store", {
      ...summaryState.store,
      deferredSearch: deferredStoreSearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listSummary("store", {
        page: summaryState.store.page,
        pageSize: summaryState.store.pageSize,
        search: deferredStoreSearch,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const blendingSummaryQuery = useQuery({
    queryKey: itemsInventoryQueryKeys.summary("blending", {
      ...summaryState.blending,
      deferredSearch: deferredBlendingSearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listSummary("blending", {
        page: summaryState.blending.page,
        pageSize: summaryState.blending.pageSize,
        search: deferredBlendingSearch,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (
      activeModule === "store" &&
      isAccessDeniedError(storeSummaryQuery.error) &&
      !blendingSummaryQuery.isError
    ) {
      setActiveModule("blending");
    }
  }, [activeModule, blendingSummaryQuery.isError, storeSummaryQuery.error]);

  const historyQuery = useQuery({
    enabled: Boolean(historyTarget),
    queryKey: itemsInventoryQueryKeys.history(historyTarget?.module ?? activeModule, historyTarget?.row.item_id ?? null, {
      ...historyState,
      deferredSearch: deferredHistorySearch,
    }),
    queryFn: () =>
      itemsInventoryApi.listHistory(historyTarget!.module, historyTarget!.row.item_id, {
        page: historyState.page,
        pageSize: historyState.pageSize,
        search: deferredHistorySearch,
        dateFrom: historyState.dateFrom,
        dateTo: historyState.dateTo,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const summaryQueries = useMemo(
    () => ({
      store: storeSummaryQuery,
      blending: blendingSummaryQuery,
    }),
    [blendingSummaryQuery, storeSummaryQuery],
  );

  const updateSummaryState = (module: InventoryModule, updater: (current: InventorySummaryState) => InventorySummaryState) => {
    setSummaryState((current) => ({
      ...current,
      [module]: updater(current[module]),
    }));
  };

  const updateHistoryState = (updater: (current: InventoryHistoryState) => InventoryHistoryState) => {
    setHistoryState((current) => updater(current));
  };

  const openHistory = (module: InventoryModule, row: InventorySummaryRow) => {
    setHistoryTarget({ module, row });
    setHistoryState(createHistoryState());
  };

  const renderModuleTab = (module: InventoryModule) => {
    const config = INVENTORY_MODULES[module];
    const query = summaryQueries[module];
    const state = summaryState[module];
    const accessDenied = isAccessDeniedError(query.error);

    return (
      <InventorySummaryTable
        rows={query.data?.items ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription={
          accessDenied ? config.accessDescription : getApiErrorMessage(query.error, `Unable to load ${config.label.toLowerCase()}.`)
        }
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
        page={state.page}
        pageSize={state.pageSize}
        total={query.data?.total ?? 0}
        onPageChange={(page) =>
          updateSummaryState(module, (current) => ({
            ...current,
            page,
          }))
        }
        onPageSizeChange={(pageSize) =>
          updateSummaryState(module, (current) => ({
            ...current,
            pageSize,
            page: 1,
          }))
        }
        onRetry={() => {
          void query.refetch();
        }}
        onRowClick={(row) => openHistory(module, row)}
      />
    );
  };

  const activeConfig = INVENTORY_MODULES[activeModule];
  const activeQuery = summaryQueries[activeModule];
  const activeState = summaryState[activeModule];
  const activeAccessDenied = isAccessDeniedError(activeQuery.error);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items Inventory"
        description="Inventory monitoring only. Item master management, imports, and direct movement posting have been removed from this workspace."
      />

      <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as InventoryModule)} className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <TabsList className="h-auto flex-wrap bg-slate-100/80 p-1">
              {(Object.entries(INVENTORY_MODULES) as Array<[InventoryModule, (typeof INVENTORY_MODULES)[InventoryModule]]>).map(
                ([module, config]) => (
                  <TabsTrigger key={module} value={module} className="gap-2">
                    <span>{config.label}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {summaryQueries[module].data?.total ?? 0}
                    </span>
                  </TabsTrigger>
                ),
              )}
            </TabsList>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={activeState.search}
                  onChange={(event) =>
                    updateSummaryState(activeModule, (current) => ({
                      ...current,
                      search: event.target.value,
                      page: 1,
                    }))
                  }
                  placeholder="Search item name, code, or external ID"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => void activeQuery.refetch()} disabled={activeQuery.isFetching}>
                <RefreshCw className={`mr-2 h-4 w-4 ${activeQuery.isFetching ? "animate-spin" : ""}`} />
                {activeQuery.isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <div>Open an item row to inspect detailed inward and outward movement history.</div>
            <div className={activeAccessDenied ? "text-destructive" : ""}>
              {activeAccessDenied
                ? activeConfig.accessDescription
                : `${activeQuery.data?.total ?? 0} monitored item rows in the ${activeConfig.label.toLowerCase()} view.`}
            </div>
          </div>
        </div>

        <TabsContent value="store" className="space-y-0">
          {renderModuleTab("store")}
        </TabsContent>
        <TabsContent value="blending" className="space-y-0">
          {renderModuleTab("blending")}
        </TabsContent>
      </Tabs>

      <InventoryHistorySheet
        open={Boolean(historyTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryTarget(null);
            setHistoryState(createHistoryState());
          }
        }}
        target={historyTarget}
        state={historyState}
        onStateChange={updateHistoryState}
        rows={historyQuery.data?.items ?? []}
        total={historyQuery.data?.total ?? 0}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        errorDescription={getApiErrorMessage(historyQuery.error, "Unable to load inventory history.")}
        onRetry={() => {
          void historyQuery.refetch();
        }}
      />
    </div>
  );
};

export default ItemsPage;
