import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type HeadReviewItem = {
  itemId: number;
  itemName: string;
  itemCode: string;
  requestedQty: string;
  acceptedQty: string;
  unit: string;
  reason: string;
};

type HeadReviewError = {
  acceptedQty?: string;
  reason?: string;
};

const isNonNegativeDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);

const shouldBlockQuantityKey = (key: string) => ["e", "E", "+", "-"].includes(key);

const getAcceptedQtyError = (value: string, requestedQty: string) => {
  if (!value.trim()) return "Accepted Qty is required.";
  if (value.includes("-")) return "Accepted Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Accepted Qty must be numeric.";

  const accepted = Number(value);
  const requested = Number(requestedQty);
  if (!Number.isFinite(accepted)) return "Accepted Qty must be numeric.";
  if (accepted < 0) return "Accepted Qty cannot be negative.";
  if (Number.isFinite(requested) && accepted > requested) {
    return "Accepted Qty cannot exceed Requested Qty.";
  }

  return undefined;
};

const BlendingHeadApprovalPage = () => {
  const queryClient = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [remarks, setRemarks] = useState("");
  const [reviewItems, setReviewItems] = useState<HeadReviewItem[]>([]);
  const [reviewErrors, setReviewErrors] = useState<Record<number, HeadReviewError>>({});

  const approvalsQuery = useQuery({
    queryKey: ["blending", "head-approvals"],
    queryFn: blendingApi.getBlendingHeadApprovals,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
      reviewRemarks,
      items,
    }: {
      requestId: number;
      action: HeadAction;
      reviewRemarks: string;
      items?: Array<{ item: number; accepted_qty: string; remarks: string }>;
    }) =>
      action === "approve"
        ? blendingApi.approveBlendingHeadRequest(requestId, { remarks: reviewRemarks, items })
        : blendingApi.rejectBlendingHeadRequest(requestId, reviewRemarks),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "approve" ? "Request approved for Store issue." : "Request rejected by Blending Head.");
      closeReviewDialog();
      void queryClient.invalidateQueries({ queryKey: ["blending"] });
      void queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to review the Blending Store Request.")),
  });

  const openReview = (request: StoreStockRequest, action: HeadAction) => {
    setReviewTarget({ request, action });
    setRemarks("");
    setReviewErrors({});
    if (action === "approve") {
      const requestItems = request.items?.length
        ? request.items
        : request.item
          ? [
              {
                id: request.id,
                item: request.item,
                item_code: request.item_code ?? "",
                item_name: request.item_name ?? "",
                unit: request.unit ?? "",
                requested_qty: request.quantity,
              },
            ]
          : [];

      setReviewItems(
        requestItems.map((item) => ({
          itemId: item.item,
          itemName: item.item_name,
          itemCode: item.item_code,
          requestedQty: item.requested_qty,
          acceptedQty: item.requested_qty,
          unit: item.unit,
          reason: "",
        })),
      );
    } else {
      setReviewItems([]);
    }
  };

  const closeReviewDialog = () => {
    setReviewTarget(null);
    setRemarks("");
    setReviewItems([]);
    setReviewErrors({});
  };

  const isHeadReviewReady =
    reviewTarget?.action === "approve"
      ? reviewItems.length > 0 &&
        reviewItems.some((item) => Number(item.acceptedQty) > 0) &&
        reviewItems.every((item) => {
          const qtyError = getAcceptedQtyError(item.acceptedQty, item.requestedQty);
          if (qtyError) {
            return false;
          }

          const acceptedQty = Number(item.acceptedQty);
          const requestedQty = Number(item.requestedQty);
          const quantityChanged = Number.isFinite(acceptedQty) && Number.isFinite(requestedQty) && acceptedQty !== requestedQty;
          if (quantityChanged && !item.reason.trim()) {
            return false;
          }

          return true;
        })
      : Boolean(remarks.trim());

  const submitReview = () => {
    if (!reviewTarget) {
      return;
    }

    if (reviewTarget.action === "reject") {
      reviewMutation.mutate({
        requestId: reviewTarget.request.id,
        action: "reject",
        reviewRemarks: remarks.trim(),
      });
      return;
    }

    const nextErrors: Record<number, HeadReviewError> = {};
    let hasErrors = false;
    let acceptedLineCount = 0;

    reviewItems.forEach((item, index) => {
      const acceptedQtyError = getAcceptedQtyError(item.acceptedQty, item.requestedQty);
      const acceptedQty = Number(item.acceptedQty);
      const requestedQty = Number(item.requestedQty);
      const quantityChanged = Number.isFinite(acceptedQty) && Number.isFinite(requestedQty) && acceptedQty !== requestedQty;
      const reasonError = quantityChanged && !item.reason.trim() ? "Reason is required when Accepted Qty is different from Requested Qty." : undefined;

      if (Number.isFinite(acceptedQty) && acceptedQty > 0) {
        acceptedLineCount += 1;
      }

      if (acceptedQtyError || reasonError) {
        nextErrors[index] = {
          acceptedQty: acceptedQtyError,
          reason: reasonError,
        };
        hasErrors = true;
      }
    });

    if (!acceptedLineCount) {
      toast.error("At least one item must have Accepted Qty greater than zero.");
      return;
    }

    if (hasErrors) {
      setReviewErrors(nextErrors);
      return;
    }

    reviewMutation.mutate({
      requestId: reviewTarget.request.id,
      action: "approve",
      reviewRemarks: remarks.trim(),
      items: reviewItems.map((item) => ({
        item: item.itemId,
        accepted_qty: item.acceptedQty,
        remarks: item.reason.trim(),
      })),
    });
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
            closeReviewDialog();
          }
        }}
      >
        <DialogContent className={reviewTarget?.action === "approve" ? "max-w-5xl" : undefined}>
          <DialogHeader>
            <DialogTitle>{reviewTarget?.action === "approve" ? "Blending Head Review" : "Reject request"}</DialogTitle>
            <DialogDescription>
              {reviewTarget?.action === "approve" ? (
                <>
                  Review each requested item for <span className="font-semibold">{reviewTarget.request.request_no || "-"}</span>.
                  Only head accepted quantity will move to Store Request Approval.
                </>
              ) : (
                <>Add rejection reason for {reviewTarget?.request.request_no || "this Blending Store Request"}.</>
              )}
            </DialogDescription>
          </DialogHeader>
          {reviewTarget?.action === "approve" ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Request No</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{reviewTarget.request.request_no ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Department</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{reviewTarget.request.department ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Requested By</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{reviewTarget.request.requested_by_username ?? "-"}</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.no</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="w-44">Requested Qty</TableHead>
                      <TableHead className="w-56">
                        Accepted Qty <span className="text-destructive">*</span>
                      </TableHead>
                      <TableHead className="w-80">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewItems.map((item, index) => {
                      const requestedQtyNumber = Number(item.requestedQty);
                      const acceptedQtyNumber = Number(item.acceptedQty);
                      const reasonRequired =
                        item.acceptedQty.trim() &&
                        Number.isFinite(acceptedQtyNumber) &&
                        Number.isFinite(requestedQtyNumber) &&
                        acceptedQtyNumber !== requestedQtyNumber;

                      return (
                        <TableRow key={`${item.itemId}-${index}`} className="align-top">
                          <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{item.itemName}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.itemCode}
                              {item.unit ? ` | ${item.unit}` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {formatDecimal(item.requestedQty)}{item.unit ? ` ${item.unit}` : ""}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Label htmlFor={`head-accepted-${index}`} className="sr-only">
                                Accepted Qty
                              </Label>
                              <Input
                                id={`head-accepted-${index}`}
                                inputMode="decimal"
                                value={item.acceptedQty}
                                onKeyDown={(event) => {
                                  if (shouldBlockQuantityKey(event.key)) {
                                    event.preventDefault();
                                  }
                                }}
                                onPaste={(event) => {
                                  const pastedValue = event.clipboardData.getData("text");
                                  const pastedError = getAcceptedQtyError(pastedValue, item.requestedQty);
                                  if (pastedError) {
                                    event.preventDefault();
                                    setReviewErrors((current) => ({
                                      ...current,
                                      [index]: {
                                        ...current[index],
                                        acceptedQty: pastedError,
                                      },
                                    }));
                                  }
                                }}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  const nextError = getAcceptedQtyError(nextValue, item.requestedQty);

                                  setReviewItems((current) =>
                                    current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, acceptedQty: nextValue } : entry)),
                                  );
                                  setReviewErrors((current) => {
                                    const nextErrors = { ...current, [index]: { ...current[index], acceptedQty: nextError } };
                                    if (
                                      nextValue.trim() &&
                                      Number.isFinite(Number(nextValue)) &&
                                      Number.isFinite(Number(item.requestedQty)) &&
                                      Number(nextValue) === Number(item.requestedQty)
                                    ) {
                                      nextErrors[index] = { acceptedQty: nextError };
                                    } else if (nextValue.trim() && !nextError && !current[index]?.reason?.trim()) {
                                      nextErrors[index] = {
                                        acceptedQty: nextError,
                                        reason: "Reason is required when Accepted Qty is different from Requested Qty.",
                                      };
                                    } else if (!nextValue.trim()) {
                                      nextErrors[index] = { acceptedQty: nextError };
                                    }
                                    return nextErrors;
                                  });
                                }}
                                placeholder="Enter accepted quantity"
                                className={reviewErrors[index]?.acceptedQty ? "border-destructive" : ""}
                              />
                              {reviewErrors[index]?.acceptedQty ? <p className="text-xs text-destructive">{reviewErrors[index]?.acceptedQty}</p> : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Label htmlFor={`head-reason-${index}`} className="sr-only">
                                Reason{reasonRequired ? " required" : ""}
                              </Label>
                              <Textarea
                                id={`head-reason-${index}`}
                                rows={2}
                                value={item.reason}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setReviewItems((current) =>
                                    current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, reason: nextValue } : entry)),
                                  );
                                  setReviewErrors((current) => ({ ...current, [index]: { ...current[index], reason: undefined } }));
                                }}
                                placeholder="Enter reason"
                                className={reviewErrors[index]?.reason ? "border-destructive" : ""}
                              />
                              {reasonRequired && !reviewErrors[index]?.reason ? (
                                <p className="text-xs text-muted-foreground">Required when accepted qty is different.</p>
                              ) : null}
                              {reviewErrors[index]?.reason ? <p className="text-xs text-destructive">{reviewErrors[index]?.reason}</p> : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <Textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              placeholder="Rejection reason"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeReviewDialog} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={reviewTarget?.action === "reject" ? "destructive" : "default"}
              disabled={reviewMutation.isPending || !reviewTarget || !isHeadReviewReady}
              onClick={submitReview}
            >
              {reviewMutation.isPending ? "Saving..." : reviewTarget?.action === "approve" ? "Submit Review" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingHeadApprovalPage;
