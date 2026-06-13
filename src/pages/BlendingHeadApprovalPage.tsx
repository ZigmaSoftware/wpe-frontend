import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { blendingApi } from "@/features/blending/api/blendingApi";
import { getStoreRequestStatusLabel } from "@/features/blending/utils/requestStatus";
import { formatDate, formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { StoreStockRequest } from "@/lib/types";

type HeadAction = "approve" | "reject";

type ReviewTarget = {
  request: StoreStockRequest;
  action: HeadAction;
};

const BlendingHeadApprovalPage = () => {
  const queryClient = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [remarks, setRemarks] = useState("");

  const approvalsQuery = useQuery({
    queryKey: ["blending", "head-approvals"],
    queryFn: blendingApi.getBlendingHeadApprovals,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action, reviewRemarks }: { requestId: number; action: HeadAction; reviewRemarks: string }) =>
      action === "approve"
        ? blendingApi.approveBlendingHeadRequest(requestId, reviewRemarks)
        : blendingApi.rejectBlendingHeadRequest(requestId, reviewRemarks),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "approve" ? "Request approved for Store issue." : "Request rejected by Blending Head.");
      setReviewTarget(null);
      setRemarks("");
      void queryClient.invalidateQueries({ queryKey: ["blending"] });
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to review the Blending Store Request.")),
  });

  const openReview = (request: StoreStockRequest, action: HeadAction) => {
    setReviewTarget({ request, action });
    setRemarks("");
  };

  const rows = approvalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Blending Head Approval"
        description="Approve or reject Blending Store Requests before they enter the Store issue queue."
      />

      {approvalsQuery.isLoading ? <LoadingState label="Loading Blending Head approvals..." /> : null}
      {approvalsQuery.isError ? (
        <ErrorState description={getApiErrorMessage(approvalsQuery.error, "Unable to load Blending Head approvals.")} />
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
                    <TableHead>Reason / Required Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Items / Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.request_no || `SR-${request.id}`}</TableCell>
                      <TableCell>{request.requested_by_username}</TableCell>
                      <TableCell>
                        <div>{request.request_reason || "-"}</div>
                        <div className="text-xs text-muted-foreground">{request.require_date ? formatDate(request.require_date) : "No required date"}</div>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(request.items ?? []).map((item) => (
                            <div key={item.id}>
                              <span className="font-medium">{item.item_name}</span>
                              <span className="ml-2 text-muted-foreground">
                                {formatDecimal(item.requested_qty)} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getStoreRequestStatusLabel(request.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => openReview(request, "approve")}>
                            <Check className="mr-1.5 h-4 w-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openReview(request, "reject")}>
                            <X className="mr-1.5 h-4 w-4" />
                            Reject
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
          <EmptyState title="No requests pending Head approval" description="New Blending Store Requests will appear here for review." />
        )
      ) : null}

      <Dialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => {
          if (!open && !reviewMutation.isPending) {
            setReviewTarget(null);
            setRemarks("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewTarget?.action === "approve" ? "Approve request" : "Reject request"}</DialogTitle>
            <DialogDescription>
              Add remarks for {reviewTarget?.request.request_no || "this Blending Store Request"}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={4}
            placeholder={reviewTarget?.action === "approve" ? "Approval remarks" : "Rejection reason"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={reviewTarget?.action === "reject" ? "destructive" : "default"}
              disabled={reviewMutation.isPending || !remarks.trim() || !reviewTarget}
              onClick={() => {
                if (reviewTarget) {
                  reviewMutation.mutate({
                    requestId: reviewTarget.request.id,
                    action: reviewTarget.action,
                    reviewRemarks: remarks.trim(),
                  });
                }
              }}
            >
              {reviewMutation.isPending ? "Saving..." : reviewTarget?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingHeadApprovalPage;
