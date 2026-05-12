import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coreApi, grnApi } from "@/lib/api";
import { formatDateTime, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { QcrRecord, StoreStockRequest, StoreTransactionRecord } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const unwrapResults = <T,>(payload: { data?: { results?: T[] } } | T[]) =>
  Array.isArray(payload) ? payload : payload.data?.results ?? [];

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

const getStoreDepartment = (record: QcrRecord) => {
  const value = getQcrField(record, "req_department");
  return value === null || value === undefined || value === "" ? "Unassigned" : String(value).trim();
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
  const queryClient = useQueryClient();
  const [detailRecord, setDetailRecord] = useState<QcrRecord | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");

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
      const response = await coreApi.get<StoreTransactionRecord[] | { data?: { results?: StoreTransactionRecord[] } }>("/api/store/transactions/");
      return unwrapResults(response.data);
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["store", "requests"],
    queryFn: async () => {
      const response = await coreApi.get<StoreStockRequest[] | { data?: { results?: StoreStockRequest[] } }>("/api/store/requests/");
      return unwrapResults(response.data);
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await coreApi.post(`/api/store/approve-request/${requestId}/`, {});
      return response.data;
    },
    onSuccess: () => {
      toast.success("Store request approved.");
      queryClient.invalidateQueries({ queryKey: ["store", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["store", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["store-stock"] });
      queryClient.invalidateQueries({ queryKey: ["blending-stock"] });
      queryClient.invalidateQueries({ queryKey: ["store-requests"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to approve store request.")),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await coreApi.post(`/api/store/reject-request/${requestId}/`, {});
      return response.data;
    },
    onSuccess: () => {
      toast.success("Store request rejected.");
      queryClient.invalidateQueries({ queryKey: ["store", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["store-requests"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to reject store request.")),
  });

  const departmentOptions = useMemo(
    () => Array.from(new Set((intakeQuery.data ?? []).map((record) => getStoreDepartment(record)))).sort((left, right) => left.localeCompare(right)),
    [intakeQuery.data],
  );

  const filteredIntakeRecords =
    departmentFilter === "all" ? intakeQuery.data ?? [] : (intakeQuery.data ?? []).filter((record) => getStoreDepartment(record) === departmentFilter);

  const grnInTransactions = (transactionsQuery.data ?? []).filter(
    (row) => row.transaction_type === "GRN_IN" || row.transaction_type === "GRN_INWARD",
  ).length;
  const additiveBlendingRequests = (requestsQuery.data ?? []).filter(
    (row) => row.request_type === "ADDITIVE" && row.department.toUpperCase() === "BLENDING",
  );
  const pendingAdditiveRequests = additiveBlendingRequests.filter((row) => row.status === "PENDING").length;

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
              <TableHead className="w-16 text-center">S.No</TableHead>
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
            {records.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
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
              <TableHead className="w-16 text-center">S.No</TableHead>
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
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
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

  const renderRequestsTable = (rows: StoreStockRequest[]) => {
    if (!rows.length) {
      return <EmptyState title="No additive requests" description="No blending additive store requests are waiting in the queue." />;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">S.No</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Requested For</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
                <TableRow key={row.id}>
                <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                <TableCell>{formatDateTime(row.requested_at)}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {(row.items?.length ? row.items : []).map((item) => (
                      <div key={item.id}>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{item.item_code}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDecimal(item.requested_qty)} {item.unit}
                        </div>
                      </div>
                    ))}
                    {!row.items?.length ? (
                      <div>
                        <div className="font-medium">{row.item_name || "-"}</div>
                        {row.item_code ? <div className="font-mono text-xs text-muted-foreground">{row.item_code}</div> : null}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDecimal(row.total_requested_qty ?? row.quantity)} {row.unit || row.items?.[0]?.unit || ""}
                </TableCell>
                <TableCell>{row.requested_for_name}</TableCell>
                <TableCell className="max-w-xs truncate" title={row.request_reason}>
                  {row.request_reason || "-"}
                </TableCell>
                <TableCell>{row.requested_by_username}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.approved_by_username || "-"}</TableCell>
                <TableCell className="text-right">
                  {row.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveRequestMutation.mutate(row.id)}
                        disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectRequestMutation.mutate(row.id)}
                        disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const isLoading = intakeQuery.isLoading || transactionsQuery.isLoading || requestsQuery.isLoading;
  const isError = intakeQuery.isError || transactionsQuery.isError || requestsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Operations"
        description="Store intake tracks QCR rows moved to GRN, along with transaction history."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Store Intake" value={intakeQuery.data?.length ?? 0} hint="Moved to GRN from QCR" />
        <StatCard label="GRN In Transactions" value={grnInTransactions} />
        <StatCard label="Pending Additive Requests" value={pendingAdditiveRequests} />
      </div>

      <div className="flex justify-end">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingState label="Loading store workspace..." /> : null}
      {isError ? (
        <ErrorState description="Store data could not be loaded from the GRN and core services." />
      ) : null}

      {!isLoading && !isError ? (
        <Tabs defaultValue="intake" className="space-y-4">
          <TabsList>
            <TabsTrigger value="intake">Store Intake</TabsTrigger>
            <TabsTrigger value="requests">Additive Requests</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="intake">{renderIntakeTable(filteredIntakeRecords)}</TabsContent>
          <TabsContent value="requests">{renderRequestsTable(additiveBlendingRequests)}</TabsContent>
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
