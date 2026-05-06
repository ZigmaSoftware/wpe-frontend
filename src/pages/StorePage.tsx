import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coreApi, grnApi } from "@/lib/api";
import { formatDateTime, formatDecimal } from "@/lib/api-helpers";
import type { QcrRecord, StoreStockRecord, StoreTransactionRecord } from "@/lib/types";

const StorePage = () => {
  const [detailRecord, setDetailRecord] = useState<QcrRecord | null>(null);

  const intakeQuery = useQuery({
    queryKey: ["store", "intake"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/grn/");
      return response.data;
    },
  });

  const stockQuery = useQuery({
    queryKey: ["store", "stock"],
    queryFn: async () => {
      const response = await coreApi.get<StoreStockRecord[]>("/api/store/stock/");
      return response.data;
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["store", "transactions"],
    queryFn: async () => {
      const response = await coreApi.get<StoreTransactionRecord[]>("/api/store/transactions/");
      return response.data;
    },
  });

  const totalStockQuantity = (stockQuery.data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
  const grnInTransactions = (transactionsQuery.data ?? []).filter((row) => row.transaction_type === "GRN_IN").length;

  const renderIntakeTable = (records: QcrRecord[]) => {
    if (!records.length) {
      return (
        <EmptyState
          title="No store intake records"
          description="No QCR rows have been moved to GRN yet, so the store intake queue is empty."
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Moved To QCR</TableHead>
              <TableHead>Moved By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.grn_reference_no}</TableCell>
                <TableCell>{record.status}</TableCell>
                <TableCell>{formatDateTime(record.moved_to_qcr_at)}</TableCell>
                <TableCell>{record.moved_to_qcr_by || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" onClick={() => setDetailRecord(record)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderStockTable = (rows: StoreStockRecord[]) => {
    if (!rows.length) {
      return <EmptyState title="No store stock" description="The core store stock table is currently empty." />;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.item_code}</TableCell>
                <TableCell>{row.item_name}</TableCell>
                <TableCell>{formatDecimal(row.quantity)}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>{formatDateTime(row.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTransactionsTable = (rows: StoreTransactionRecord[]) => {
    if (!rows.length) {
      return <EmptyState title="No store transactions" description="The core store transaction ledger is currently empty." />;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell className="font-mono text-xs">{row.item_code}</TableCell>
                <TableCell>{row.item_name}</TableCell>
                <TableCell>{row.transaction_type}</TableCell>
                <TableCell>{formatDecimal(row.quantity)}</TableCell>
                <TableCell>{row.reference_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const isLoading = intakeQuery.isLoading || stockQuery.isLoading || transactionsQuery.isLoading;
  const isError = intakeQuery.isError || stockQuery.isError || transactionsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Operations"
        description="Store intake now tracks QCR rows moved to GRN, alongside live store stock and transaction history."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Store Intake" value={intakeQuery.data?.length ?? 0} hint="Moved to GRN from QCR" />
        <StatCard label="Store Stock Rows" value={stockQuery.data?.length ?? 0} />
        <StatCard label="Total Stock Qty" value={formatDecimal(totalStockQuantity)} />
        <StatCard label="GRN In Transactions" value={grnInTransactions} />
      </div>

      {isLoading ? <LoadingState label="Loading store workspace..." /> : null}
      {isError ? (
        <ErrorState description="Store data could not be loaded from the core and GRN services." />
      ) : null}

      {!isLoading && !isError ? (
        <Tabs defaultValue="intake" className="space-y-4">
          <TabsList>
            <TabsTrigger value="intake">Store Intake</TabsTrigger>
            <TabsTrigger value="stock">Store Stock</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="intake">{renderIntakeTable(intakeQuery.data ?? [])}</TabsContent>
          <TabsContent value="stock">{renderStockTable(stockQuery.data ?? [])}</TabsContent>
          <TabsContent value="transactions">{renderTransactionsTable(transactionsQuery.data ?? [])}</TabsContent>
        </Tabs>
      ) : null}

      <Dialog open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detailRecord?.grn_reference_no}</DialogTitle>
            <DialogDescription>Store intake detail sourced from the QCR moved-to-GRN queue.</DialogDescription>
          </DialogHeader>
          {detailRecord ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Status" value={detailRecord.status} />
                <StatCard label="Unique Id" value={detailRecord.unique_id} />
                <StatCard label="Moved To QCR" value={formatDateTime(detailRecord.moved_to_qcr_at)} />
                <StatCard label="Moved By" value={detailRecord.moved_to_qcr_by || "-"} />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">source_grn_data</h3>
                  <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(detailRecord.source_grn_data, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">snapshot</h3>
                  <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(detailRecord.snapshot, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePage;
