import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grnApi } from "@/lib/api";
import { formatDateTime, getApiErrorMessage } from "@/lib/api-helpers";
import type { QcrRecord } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

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

const getQcrDepartment = (record: QcrRecord) => {
  const value = getQcrField(record, "req_department");
  return value === null || value === undefined || value === "" ? "Unassigned" : String(value).trim();
};

const QCRPage = () => {
  const queryClient = useQueryClient();
  const [detailRecord, setDetailRecord] = useState<QcrRecord | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const activeQuery = useQuery({
    queryKey: ["qcr", "active"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/");
      return response.data;
    },
  });

  const movedQuery = useQuery({
    queryKey: ["qcr", "grn"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/grn/");
      return response.data;
    },
  });

  const rejectedQuery = useQuery({
    queryKey: ["qcr", "cancelled"],
    queryFn: async () => {
      const response = await grnApi.get<QcrRecord[]>("/api/qcr/cancelled/");
      return response.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "move_to_grn" | "reject" }) => {
      const response = await grnApi.post(`/api/qcr/${id}/status/`, { action });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === "move_to_grn" ? "QCR moved to GRN." : "QCR rejected.");
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update QCR status."));
    },
  });

  const departmentOptions = useMemo(() => {
    const records = [...(activeQuery.data ?? []), ...(movedQuery.data ?? []), ...(rejectedQuery.data ?? [])];
    return Array.from(new Set(records.map((record) => getQcrDepartment(record)))).sort((left, right) => left.localeCompare(right));
  }, [activeQuery.data, movedQuery.data, rejectedQuery.data]);

  const filterRecordsByDepartment = (records: QcrRecord[]) =>
    departmentFilter === "all" ? records : records.filter((record) => getQcrDepartment(record) === departmentFilter);

  const renderTable = (records: QcrRecord[], showActions: boolean) => {
    if (!records.length) {
      return <EmptyState title="No QCR records" description="This QCR tab is currently empty." />;
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
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => setDetailRecord(record)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {showActions ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: record.id, action: "move_to_grn" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Move to GRN
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: record.id, action: "reject" })}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QCR Management"
        description="Active, moved-to-GRN, and rejected QCR states using the exact QCR endpoints."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active" value={activeQuery.data?.length ?? 0} />
        <StatCard label="Moved to GRN" value={movedQuery.data?.length ?? 0} />
        <StatCard label="Rejected" value={rejectedQuery.data?.length ?? 0} />
        <StatCard label="Status Updates" value={statusMutation.isPending ? "Working" : "Ready"} />
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

      {activeQuery.isLoading || movedQuery.isLoading || rejectedQuery.isLoading ? <LoadingState label="Loading QCR records..." /> : null}
      {activeQuery.isError || movedQuery.isError || rejectedQuery.isError ? <ErrorState description="QCR records could not be loaded from the GRN service." /> : null}

      {!activeQuery.isLoading && !movedQuery.isLoading && !rejectedQuery.isLoading && !activeQuery.isError && !movedQuery.isError && !rejectedQuery.isError ? (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="moved">Moved to GRN</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="active">{renderTable(filterRecordsByDepartment(activeQuery.data ?? []), true)}</TabsContent>
          <TabsContent value="moved">{renderTable(filterRecordsByDepartment(movedQuery.data ?? []), false)}</TabsContent>
          <TabsContent value="rejected">{renderTable(filterRecordsByDepartment(rejectedQuery.data ?? []), false)}</TabsContent>
        </Tabs>
      ) : null}

      <Dialog open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{detailRecord?.grn_reference_no}</DialogTitle>
            <DialogDescription>Detail drawer with QCR metadata, source GRN data, and snapshot.</DialogDescription>
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

export default QCRPage;
