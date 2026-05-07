import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coreApi, grnApi } from "@/lib/api";
import { formatDateTime } from "@/lib/api-helpers";
import type { QcrRecord, StoreTransactionRecord } from "@/lib/types";

const readText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const getQcrField = (record: QcrRecord, key: string) => {
  const sourceValue = record.source_grn_data?.[key];
  if (sourceValue !== null && sourceValue !== undefined && sourceValue !== "") {
    return sourceValue;
  }
  return record.snapshot?.[key];
};

const detailFieldGroups: Array<{
  title: string;
  fields: Array<{ label: string; key: string }>;
}> = [
  {
    title: "Material Details",
    fields: [
      { label: "Item Code", key: "item_id" },
      { label: "Item Serial Number", key: "item_serial_number" },
      { label: "Item Name", key: "product_description" },
      { label: "Quantity", key: "quantity" },
      { label: "Total Quantity", key: "total_quantity" },
      { label: "Unit", key: "unit" },
      { label: "HSN Code", key: "hsn_code" },
    ],
  },
  {
    title: "Supplier Details",
    fields: [
      { label: "Supplier", key: "trade_name" },
      { label: "Supplier ID", key: "supplier_id" },
      { label: "Contact Name", key: "contact_name" },
      { label: "Phone Number", key: "phone_number" },
      { label: "GSTIN", key: "gstin" },
      { label: "Location", key: "location" },
    ],
  },
  {
    title: "Document Details",
    fields: [
      { label: "GRN No", key: "grn_no" },
      { label: "GRN Date", key: "grn_date" },
      { label: "PO No", key: "po_no" },
      { label: "PO Date", key: "po_date" },
      { label: "Invoice No", key: "supplier_invoice_no" },
      { label: "Invoice Date", key: "supplier_invoice_date" },
    ],
  },
  {
    title: "Requirement Details",
    fields: [
      { label: "Department", key: "req_department" },
      { label: "Requested By", key: "req_person_name" },
      { label: "Requested Date", key: "req_date" },
      { label: "Reason", key: "req_reason" },
    ],
  },
];

const StorePage = () => {
  const [detailRecord, setDetailRecord] = useState<QcrRecord | null>(null);

  const intakeQuery = useQuery({
    queryKey: ["store", "intake"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/grn/");
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
              <TableHead>Supplier</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Moved To QCR</TableHead>
              <TableHead>Moved By</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.grn_reference_no}</TableCell>
                <TableCell>{readText(getQcrField(record, "trade_name"))}</TableCell>
                <TableCell>{readText(getQcrField(record, "product_description"))}</TableCell>
                <TableCell>{readText(getQcrField(record, "quantity"))}</TableCell>
                <TableCell>{readText(getQcrField(record, "req_department"))}</TableCell>
                <TableCell>{record.status}</TableCell>
                <TableCell>{formatDateTime(record.moved_to_qcr_at)}</TableCell>
                <TableCell>{record.moved_to_qcr_by || "-"}</TableCell>
                <TableCell>{formatDateTime(record.updated_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" onClick={() => setDetailRecord(record)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
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
              <TableHead>Unit</TableHead>
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
                <TableCell>{readText(row.quantity)}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>{row.reference_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const isLoading = intakeQuery.isLoading || transactionsQuery.isLoading;
  const isError = intakeQuery.isError || transactionsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Operations"
        description="Store intake tracks QCR rows moved to GRN, along with transaction history."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Store Intake" value={intakeQuery.data?.length ?? 0} hint="Moved to GRN from QCR" />
        <StatCard label="GRN In Transactions" value={grnInTransactions} />
        <StatCard label="Transactions" value={transactionsQuery.data?.length ?? 0} />
      </div>

      {isLoading ? <LoadingState label="Loading store workspace..." /> : null}
      {isError ? (
        <ErrorState description="Store data could not be loaded from the GRN and core services." />
      ) : null}

      {!isLoading && !isError ? (
        <Tabs defaultValue="intake" className="space-y-4">
          <TabsList>
            <TabsTrigger value="intake">Store Intake</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="intake">{renderIntakeTable(intakeQuery.data ?? [])}</TabsContent>
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

              <div className="rounded-xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{readText(getQcrField(detailRecord, "item_id"))}</TableCell>
                      <TableCell>{readText(getQcrField(detailRecord, "product_description"))}</TableCell>
                      <TableCell>{readText(getQcrField(detailRecord, "quantity"))}</TableCell>
                      <TableCell>{readText(getQcrField(detailRecord, "unit"))}</TableCell>
                      <TableCell>{formatDateTime(detailRecord.created_at)}</TableCell>
                      <TableCell>{formatDateTime(detailRecord.updated_at)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {detailFieldGroups.map((group) => (
                  <div key={group.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">{group.title}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.fields.map((field) => (
                        <div key={field.key} className={field.key === "req_reason" ? "sm:col-span-2" : undefined}>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                          <p className="mt-1 text-sm text-foreground">{readText(getQcrField(detailRecord, field.key))}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePage;
