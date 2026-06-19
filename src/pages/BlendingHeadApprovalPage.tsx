import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { blendingApi } from "@/features/blending/api/blendingApi";
import { formatDate, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { StoreStockRequest } from "@/lib/types";

type HeadAction = "approve" | "reject";

const getRequestQuantity = (request: StoreStockRequest) => {
  const quantity = request.total_requested_qty ?? request.quantity;
  const unit = request.unit || request.items?.[0]?.unit || "";
  return `${formatDecimal(quantity)}${unit ? ` ${unit}` : ""}`;
};

const BlendingHeadApprovalPage = () => {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<{ request: StoreStockRequest; action: HeadAction } | null>(null);

  const approvalsQuery = useQuery({
    queryKey: ["blending", "head-approvals"],
    queryFn: blendingApi.getBlendingHeadApprovals,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: HeadAction }) =>
      action === "approve"
        ? blendingApi.approveBlendingHeadRequest(requestId, {})
        : blendingApi.rejectBlendingHeadRequest(requestId),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "approve" ? "Request approved." : "Request rejected.");
      setConfirmation(null);
      void queryClient.invalidateQueries({ queryKey: ["blending"] });
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to review the store request.")),
  });

  const rows = approvalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Head Approval's"
        description="Approve or reject pending store requests before they move into request processing."
      />

      {approvalsQuery.isLoading ? <LoadingState label="Loading head approvals..." /> : null}
      {approvalsQuery.isError ? (
        <ErrorState description={getApiErrorMessage(approvalsQuery.error, "Unable to load head approvals.")} />
      ) : null}

      {!approvalsQuery.isLoading && !approvalsQuery.isError ? (
        rows.length ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Reason / Required Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.request_no || `SR-${request.id}`}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(request.request_date || request.requested_at)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.requested_by_username}</TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <div>{request.request_reason || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.require_date ? formatDate(request.require_date) : "No required date"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{getRequestQuantity(request)}</div>
                          <div className="text-xs text-muted-foreground">
                            {(request.items ?? []).map((item) => item.item_name).join(", ") || request.item_name || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => setConfirmation({ request, action: "approve" })}
                            disabled={reviewMutation.isPending}
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setConfirmation({ request, action: "reject" })}
                            disabled={reviewMutation.isPending}
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <EmptyState title="No requests pending Head approval" description="New store requests will appear here for review." />
        )
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && !reviewMutation.isPending) {
            setConfirmation(null);
          }
        }}
        title={confirmation?.action === "approve" ? "Approve request" : "Reject request"}
        description={
          confirmation?.action === "approve"
            ? "Are you sure you want to approve this request?"
            : "Are you sure you want to reject this request?"
        }
        cancelLabel="Cancel"
        confirmLabel={confirmation?.action === "approve" ? "Approve" : "Reject"}
        onConfirm={() => {
          if (!confirmation) {
            return;
          }

          reviewMutation.mutate({
            requestId: confirmation.request.id,
            action: confirmation.action,
          });
        }}
      />
    </div>
  );
};

export default BlendingHeadApprovalPage;
