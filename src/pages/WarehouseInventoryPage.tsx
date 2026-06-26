import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { itemsInventoryApi } from "@/features/items/api/inventoryApi";
import type { WarehouseInventoryItemLine, WarehouseInventoryRow } from "@/features/items/types";
import StoreTablePagination from "@/features/store/components/StoreTablePagination";
import StoreTableToolbar, { type StoreExportFormat, type StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";
import { exportTableData, type StoreExportColumn } from "@/features/store/utils/export";
import { toast } from "@/components/ui/sonner";
import { formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";

type WarehouseTabKey = "QC_PENDING_WAREHOUSE" | "REJECTION_WAREHOUSE";

type WarehouseTabDefinition = {
  key: WarehouseTabKey;
  label: string;
  warehouseName: string;
};

type WarehouseTabState = {
  page: number;
  pageSize: number;
  search: string;
};

type WarehouseItemPreviewState = {
  tabKey: WarehouseTabKey;
  title: string;
  description: string;
  rows: WarehouseInventoryItemLine[];
};

const WAREHOUSE_TABS: WarehouseTabDefinition[] = [
  {
    key: "QC_PENDING_WAREHOUSE",
    label: "QC Pending Warehouse - CBE",
    warehouseName: "QC Pending Warehouse - CBE",
  },
  {
    key: "REJECTION_WAREHOUSE",
    label: "Rejected Warehouse",
    warehouseName: "Rejected Warehouse - CBE",
  },
];

const createTabState = (): WarehouseTabState => ({ page: 1, pageSize: 20, search: "" });

const getToolbarPageSizeValue = (pageSize: number): StorePageSizeValue =>
  pageSize === 10 || pageSize === 20 || pageSize === 50 || pageSize === 100
    ? (String(pageSize) as StorePageSizeValue)
    : "20";

const getWarehouseInventoryItemLines = (row: WarehouseInventoryRow) =>
  Array.isArray(row.item_lines) ? row.item_lines.filter((item) => item && item.item_name) : [];

const getWarehouseInventoryItemSummary = (row: WarehouseInventoryRow) => {
  const items = getWarehouseInventoryItemLines(row);
  if (!items.length) {
    return {
      title: row.items || "-",
      subtitle: null as string | null,
      extra: null as string | null,
    };
  }

  const [firstItem, ...restItems] = items;
  return {
    title: firstItem.item_name || firstItem.item_code || firstItem.item_id || "-",
    subtitle: firstItem.item_code || firstItem.item_id || null,
    extra: restItems.length ? `+${restItems.length} more` : null,
  };
};

const getWarehouseInventoryPreviewColumns = (tabKey: WarehouseTabKey) =>
  tabKey === "REJECTION_WAREHOUSE"
    ? [
        { key: "serial", label: "S.No", align: "center" as const },
        { key: "item", label: "Item" },
        { key: "code", label: "Code" },
        { key: "sentQty", label: "Send Qty", align: "right" as const },
        { key: "receivedQty", label: "Received Qty", align: "right" as const },
        { key: "acceptedQty", label: "Accepted Qty", align: "right" as const },
        { key: "rejectedQty", label: "Rejected Qty", align: "right" as const },
      ]
    : [
        { key: "serial", label: "S.No", align: "center" as const },
        { key: "item", label: "Item" },
        { key: "code", label: "Code" },
        { key: "sentQty", label: "Send Qty", align: "right" as const },
        { key: "receivedQty", label: "Received Qty", align: "right" as const },
      ];

const WarehouseInventoryPage = () => {
  const [activeTab, setActiveTab] = useState<WarehouseTabKey>("QC_PENDING_WAREHOUSE");
  const [tabStates, setTabStates] = useState<Record<WarehouseTabKey, WarehouseTabState>>({
    QC_PENDING_WAREHOUSE: createTabState(),
    REJECTION_WAREHOUSE: createTabState(),
  });
  const [itemPreviewState, setItemPreviewState] = useState<WarehouseItemPreviewState | null>(null);

  const activeTabDefinition = WAREHOUSE_TABS.find((tab) => tab.key === activeTab) ?? WAREHOUSE_TABS[0];
  const activeState = tabStates[activeTab];
  const deferredSearch = useDeferredValue(activeState.search.trim());

  const query = useQuery({
    queryKey: [
      "inventory",
      "warehouse-inventory",
      activeTabDefinition.warehouseName,
      activeState.page,
      activeState.pageSize,
      deferredSearch,
    ],
    queryFn: () =>
      itemsInventoryApi.listWarehouseInventory({
        warehouseName: activeTabDefinition.warehouseName,
        page: activeState.page,
        pageSize: activeState.pageSize,
        search: deferredSearch,
      }),
    retry: false,
    placeholderData: (previous) => previous,
  });

  const updateTabState = (tab: WarehouseTabKey, updater: (state: WarehouseTabState) => WarehouseTabState) => {
    setTabStates((current) => ({ ...current, [tab]: updater(current[tab]) }));
  };

  const handleExport = async (tab: WarehouseTabDefinition, format: StoreExportFormat) => {
    try {
      const baseColumns: StoreExportColumn<WarehouseInventoryRow>[] = [
        { label: "S.No", value: (_, index) => index + 1 },
        { label: "GRN Reference", value: (row) => row.grn_reference_no || row.grn_no },
        { label: "Supplier", value: (row) => row.supplier },
        { label: "PO No", value: (row) => row.po_no },
        { label: "Items", value: (row) => row.items },
        { label: "Inward Qty", value: (row) => formatDecimal(row.inward_qty) },
      ];
      const columns: StoreExportColumn<WarehouseInventoryRow>[] =
        tab.key === "REJECTION_WAREHOUSE"
          ? [...baseColumns, { label: "Reason", value: (row) => row.reason || "-" }]
          : [
              ...baseColumns,
              { label: "Outward Qty", value: (row) => formatDecimal(row.outward_qty) },
              { label: "Status", value: (row) => row.status },
            ];
      const rows = await itemsInventoryApi.listAllWarehouseInventory({
        warehouseName: tab.warehouseName,
        search: tabStates[tab.key].search,
      });
      exportTableData({
        title: tab.label,
        filename: `warehouse-inventory-${tab.key.toLowerCase()}`,
        rows,
        columns,
        format,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to export ${tab.label}.`));
    }
  };

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const renderActiveTab = (tab: WarehouseTabDefinition) => {
    const isRejectedWarehouse = tab.key === "REJECTION_WAREHOUSE";

    if (query.isLoading) {
      return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <StoreTableToolbar
            searchValue={activeState.search}
            onSearchChange={(value) => updateTabState(tab.key, (state) => ({ ...state, search: value, page: 1 }))}
            pageSize={getToolbarPageSizeValue(activeState.pageSize)}
            onPageSizeChange={(value) =>
              updateTabState(tab.key, (state) => ({ ...state, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
            }
            pageSizeOptions={["10", "20", "50", "100"]}
            onExport={(format) => {
              void handleExport(tab, format);
            }}
            summaryText={`Loading ${tab.label}...`}
            isFetching
          />
          <div className="py-8 text-sm text-muted-foreground">Loading {tab.label}...</div>
        </div>
      );
    }

    if (query.isError) {
      return <ErrorState description={getApiErrorMessage(query.error, `Unable to load ${tab.label} inventory.`)} />;
    }

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <StoreTableToolbar
          searchValue={activeState.search}
          onSearchChange={(value) => updateTabState(tab.key, (state) => ({ ...state, search: value, page: 1 }))}
          pageSize={getToolbarPageSizeValue(activeState.pageSize)}
          onPageSizeChange={(value) =>
            updateTabState(tab.key, (state) => ({ ...state, pageSize: value === "all" ? 100 : Number(value), page: 1 }))
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onExport={(format) => {
            void handleExport(tab, format);
          }}
          summaryText={total > 0 ? `${total} ${tab.label} rows available` : `No ${tab.label} records found`}
          isFetching={query.isFetching}
        />
        {rows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="max-h-[calc(100vh-26rem)] overflow-auto">
              <Table className={isRejectedWarehouse ? "min-w-[900px]" : "min-w-[980px]"}>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                  <TableRow className="hover:bg-card">
                    <TableHead>S.No</TableHead>
                    <TableHead>GRN Reference</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>PO No</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Inward Qty</TableHead>
                    {isRejectedWarehouse ? (
                      <TableHead>Reason</TableHead>
                    ) : (
                      <>
                        <TableHead className="text-right">Outward Qty</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => {
                    const serialNumber = (activeState.page - 1) * activeState.pageSize + index + 1;
                    const itemSummary = getWarehouseInventoryItemSummary(row);
                    const itemLines = getWarehouseInventoryItemLines(row);
                    return (
                      <TableRow key={`${tab.key}-${row.qcr_id}-${row.grn_id}`}>
                        <TableCell>{serialNumber}</TableCell>
                        <TableCell className="font-medium text-card-foreground">{row.grn_reference_no || row.grn_no || "-"}</TableCell>
                        <TableCell>{row.supplier || "-"}</TableCell>
                        <TableCell>{row.po_no || "-"}</TableCell>
                        <TableCell className="max-w-[24rem] whitespace-normal">
                          <div className="space-y-1">
                            <div className="font-medium text-card-foreground">{itemSummary.title}</div>
                            {itemSummary.subtitle ? (
                              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{itemSummary.subtitle}</div>
                            ) : null}
                            {itemSummary.extra && itemLines.length > 1 ? (
                              <button
                                type="button"
                                className="text-xs font-semibold text-primary transition hover:text-primary/80"
                              onClick={() =>
                                setItemPreviewState({
                                  tabKey: tab.key,
                                  title: `Items for ${row.grn_reference_no || row.grn_no || "warehouse entry"}`,
                                  description: "All items available for the selected warehouse record.",
                                  rows: itemLines,
                                  })
                                }
                              >
                                {itemSummary.extra}
                              </button>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatDecimal(row.inward_qty)}</TableCell>
                        {isRejectedWarehouse ? (
                          <TableCell className="max-w-[24rem] whitespace-normal">{row.reason || "-"}</TableCell>
                        ) : (
                          <>
                            <TableCell className="text-right">{formatDecimal(row.outward_qty)}</TableCell>
                            <TableCell>{row.status || "-"}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <StoreTablePagination
              page={activeState.page}
              pageSize={activeState.pageSize}
              total={total}
              onPageChange={(page) => updateTabState(tab.key, (state) => ({ ...state, page }))}
            />
          </div>
        ) : (
          <EmptyState
            title={`No ${tab.label} records`}
            description={`No warehouse inventory rows were found for ${tab.label}.`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Inventory"
        description="Track warehouse inward and outward quantities routed through QC pending and rejection warehouse flows."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WarehouseTabKey)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max gap-0.5 h-auto flex-wrap">
            {WAREHOUSE_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {WAREHOUSE_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {activeTab === tab.key ? renderActiveTab(tab) : null}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={Boolean(itemPreviewState)} onOpenChange={(open) => !open && setItemPreviewState(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{itemPreviewState?.title || "Warehouse Items"}</DialogTitle>
            <DialogDescription>{itemPreviewState?.description || "All items for the selected warehouse record."}</DialogDescription>
          </DialogHeader>
          {itemPreviewState ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="max-h-[24rem] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-card">
                      {getWarehouseInventoryPreviewColumns(itemPreviewState.tabKey).map((column) => (
                        <TableHead
                          key={column.key}
                          className={
                            column.align === "center"
                              ? "text-center"
                              : column.align === "right"
                                ? "text-right"
                                : undefined
                          }
                        >
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemPreviewState.rows.map((item, index) => (
                      <TableRow key={`${item.item_id || item.item_code || item.item_name}-${index}`}>
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-card-foreground">{item.item_name || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.item_code || "-"}</TableCell>
                        <TableCell className="text-right">{formatDecimal(item.sent_qty)}</TableCell>
                        <TableCell className="text-right">{formatDecimal(item.received_qty ?? item.accepted_qty)}</TableCell>
                        {itemPreviewState.tabKey === "REJECTION_WAREHOUSE" ? (
                          <>
                            <TableCell className="text-right">{formatDecimal(item.accepted_qty)}</TableCell>
                            <TableCell className="text-right">{formatDecimal(item.rejected_qty)}</TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseInventoryPage;
