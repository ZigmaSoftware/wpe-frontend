import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import { useApproveShift, useShiftApprovalEligible } from "@/features/production/extrusion/hooks/useExtrusion";

const ExtrusionShiftApprovalPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [shift, setShift] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [remarks, setRemarks] = useState("");

  const filters = useMemo(
    () => ({ date_from: dateFrom || undefined, date_to: dateTo || undefined, shift: shift || undefined }),
    [dateFrom, dateTo, shift],
  );

  const eligibleQuery = useShiftApprovalEligible(filters);
  const approveMutation = useApproveShift();
  const packets = eligibleQuery.data ?? [];

  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(packets.map((p) => p.id)) : new Set());
  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Shift-End QC Approval"
        description="Packets are eligible once inspection is accepted, weight is accepted, and the sticker has been scanned."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Shift</Label>
            <Input value={shift} onChange={(e) => setShift(e.target.value)} placeholder="e.g. Shift 1" className="w-48" />
          </div>
          <div className="ml-auto flex items-end gap-2">
            <div className="space-y-1">
              <Label>Approval Remarks</Label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" className="w-64" />
            </div>
            <Button
              disabled={selected.size === 0 || approveMutation.isPending}
              onClick={async () => {
                try {
                  const result = await approveMutation.mutateAsync({ packet_ids: Array.from(selected), remarks });
                  toast.success(result.message);
                  setSelected(new Set());
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Failed to approve packets."));
                }
              }}
            >
              Approve Selected ({selected.size})
            </Button>
          </div>
        </div>
      </div>

      {eligibleQuery.isLoading ? (
        <LoadingState label="Loading eligible packets..." />
      ) : eligibleQuery.isError ? (
        <ErrorState description="Eligible packets could not be loaded." action={<Button onClick={() => eligibleQuery.refetch()}>Retry</Button>} />
      ) : packets.length === 0 ? (
        <EmptyState title="No packets pending approval" description="Packets appear here once inspection, weighing, sticker generation and scanning are complete." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selected.size === packets.length} onCheckedChange={(c) => toggleAll(Boolean(c))} />
                </TableHead>
                <TableHead>Packet No</TableHead>
                <TableHead>Work Order</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Actual Weight (kg)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packets.map((packet) => (
                <TableRow key={packet.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(packet.id)} onCheckedChange={(c) => toggleOne(packet.id, Boolean(c))} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{packet.packet_no}</TableCell>
                  <TableCell>{packet.work_order_no}</TableCell>
                  <TableCell>{packet.profile_name}</TableCell>
                  <TableCell>{packet.actual_gross_weight}</TableCell>
                  <TableCell><ExtrusionStatusBadge value={packet.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ExtrusionShiftApprovalPage;
