import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import GrnPageLayout from "@/features/grn/components/GrnPageLayout";
import GrnRecordForm from "@/features/grn/components/GrnRecordForm";
import {
  GRN_GATE_ENTRY_STATUS,
  mapRecordToFormValues,
  type GrnFormValues,
  type GrnUpdateResponse,
} from "@/features/grn/grnShared";
import {
  GRN_PROCESS_ROUTE,
} from "@/features/grn/utils/routes";
import { grnApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-helpers";
import type { GrnRecord } from "@/lib/types";

const MANUAL_GATE_ENTRY_FLAG = "_manual_gate_entry_entry";

const hasManualGateEntryValues = (record: GrnRecord) => {
  const documentDetails = record.raw_payload?.document_details;
  return Boolean(
    documentDetails &&
      typeof documentDetails === "object" &&
      (documentDetails as Record<string, unknown>)[MANUAL_GATE_ENTRY_FLAG] === true,
  );
};

const buildEditInitialValues = (record: GrnRecord) => {
  const values = mapRecordToFormValues(record);
  if (!hasManualGateEntryValues(record)) {
    values.document_details.gateentry_bookno = "";
    values.document_details.gateentry_bookdate = "";
  }
  return values;
};

type PendingMoveFormItem = {
  lineIndex: number;
  itemName: string;
  sentQty: string;
  receivedQty: string;
  unit: string;
};

const isNonNegativeDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);

const shouldBlockQuantityKey = (key: string) => key === "-";

const getReceivedQtyError = (value: string, sentQty: string) => {
  if (!value.trim()) return "Received Qty is required.";
  if (value.includes("-")) return "Received Qty cannot be negative.";
  if (!isNonNegativeDecimalDraft(value)) return "Received Qty must be numeric.";

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return "Received Qty must be numeric.";
  if (parsedValue < 0) return "Received Qty cannot be negative.";

  const parsedSentQty = sentQty ? Number(sentQty) : Number.NaN;
  if (Number.isFinite(parsedSentQty) && parsedValue > parsedSentQty) {
    return "Received Qty cannot exceed Sent Qty.";
  }
  return undefined;
};

const buildPendingMoveFormItems = (record: GrnRecord): PendingMoveFormItem[] => {
  const sourceItems = record.items.length
    ? record.items
    : [
        {
          item_id: record.item_id ?? "",
          product_description: record.product_description ?? "",
          quantity: record.quantity ?? record.total_quantity ?? "",
          total_quantity: record.total_quantity ?? "",
          unit: record.unit ?? "",
        },
      ];

  return sourceItems.map((item, index) => {
    const sentQty = item.quantity ?? item.total_quantity ?? "";
    return {
      lineIndex: index,
      itemName: String(item.product_description ?? item.item_id ?? `Line ${index + 1}`),
      sentQty: sentQty === null || sentQty === undefined ? "" : String(sentQty),
      receivedQty: "",
      unit: item.unit ? String(item.unit) : "",
    };
  });
};

const GRNEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formInitialValues, setFormInitialValues] = useState<GrnFormValues | null>(null);
  const [pendingMoveTarget, setPendingMoveTarget] = useState<GrnRecord | null>(null);
  const [pendingMoveItems, setPendingMoveItems] = useState<PendingMoveFormItem[]>([]);
  const [pendingMoveErrors, setPendingMoveErrors] = useState<Record<number, { receivedQty?: string }>>({});
  const hasValidRecordId = Number.isFinite(recordId);

  const detailQuery = useQuery({
    queryKey: ["grn-detail", recordId],
    enabled: hasValidRecordId,
    queryFn: async () => {
      const response = await grnApi.get<GrnUpdateResponse>(`/api/grn/${recordId}/`);
      return response.data;
    },
  });

  const record: GrnRecord | null = detailQuery.data?.data ?? null;
  const isActiveRecord = record?.process_status === GRN_GATE_ENTRY_STATUS;

  const updateMutation = useMutation({
    mutationFn: async (values: GrnFormValues) => {
      const response = await grnApi.patch<GrnUpdateResponse>(`/api/grn/${recordId}/`, values);
      return response.data;
    },
    onSuccess: (payload) => {
      setFormInitialValues(mapRecordToFormValues(payload.data));
      queryClient.setQueryData(["grn-detail", payload.data.id], payload);
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update GRN details.")),
  });

  const moveMutation = useMutation({
    mutationFn: async (items: PendingMoveFormItem[]) => {
      const response = await grnApi.post(`/api/grn/${recordId}/move-to-qcr/`, {
        items: items.map((item) => ({
          line_index: item.lineIndex,
          received_qty: item.receivedQty,
        })),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Gate Entry moved to QCR.");
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      setPendingMoveTarget(null);
      setPendingMoveItems([]);
      setPendingMoveErrors({});
      navigate(GRN_PROCESS_ROUTE);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move Gate Entry to QCR.")),
  });

  useEffect(() => {
    if (!record) {
      setFormInitialValues(null);
      return;
    }
    setFormInitialValues(buildEditInitialValues(record));
  }, [record]);

  if (detailQuery.isLoading) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <LoadingState label="Loading GRN record..." />
      </GrnPageLayout>
    );
  }

  if (!hasValidRecordId || detailQuery.isError || !record) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <ErrorState description="Could not load the GRN record for editing." />
      </GrnPageLayout>
    );
  }

  if (!formInitialValues) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <LoadingState label="Preparing GRN form..." />
      </GrnPageLayout>
    );
  }

  const closePendingMoveDialog = () => {
    if (moveMutation.isPending) return;
    setPendingMoveTarget(null);
    setPendingMoveItems([]);
    setPendingMoveErrors({});
  };

  const submitPendingMove = () => {
    const nextErrors = pendingMoveItems.reduce<Record<number, { receivedQty?: string }>>((errors, item, index) => {
      const receivedQtyError = getReceivedQtyError(item.receivedQty, item.sentQty);
      if (receivedQtyError) {
        errors[index] = { receivedQty: receivedQtyError };
      }
      return errors;
    }, {});

    setPendingMoveErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    moveMutation.mutate(pendingMoveItems);
  };

  return (
    <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
      <>
        <GrnRecordForm
          title={`Edit Gate Entry — ${record.grn_no}`}
          subtitle="Update receipt, supplier, item, and valuation values before moving this record to QCR."
          submitLabel="Move to QCR"
          onSubmit={async (values) => {
            const payload = await updateMutation.mutateAsync(values);
            toast.success(payload.message || "Gate Entry saved successfully.");
            setPendingMoveTarget(payload.data);
            setPendingMoveItems(buildPendingMoveFormItems(payload.data));
            setPendingMoveErrors({});
          }}
          onCancel={() => navigate(GRN_PROCESS_ROUTE)}
          isSubmitting={updateMutation.isPending || moveMutation.isPending}
          initialValues={formInitialValues}
          requiredDocumentFields={["gateentry_bookno", "gateentry_bookdate"]}
        />

        <Dialog open={Boolean(pendingMoveTarget) && isActiveRecord} onOpenChange={(open) => !open && closePendingMoveDialog()}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Move to QCR</DialogTitle>
              <DialogDescription>
                Enter received quantity for every item in <span className="font-semibold">{pendingMoveTarget?.grn_no}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ref. No</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{pendingMoveTarget?.grn_no ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Supplier</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{pendingMoveTarget?.supplier_details.trade_name || pendingMoveTarget?.trade_name || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">Quantity Check</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">S.No</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="w-40">Sent Qty</TableHead>
                      <TableHead className="w-64">
                        Received Qty <span className="text-destructive">*</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMoveItems.map((item, index) => (
                      <TableRow key={`${item.lineIndex}-${index}`} className="align-top">
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{item.itemName}</div>
                          {item.unit ? <div className="mt-1 text-xs text-muted-foreground">{item.unit}</div> : null}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {item.sentQty || "-"}{item.unit ? ` ${item.unit}` : ""}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Label htmlFor={`pending-received-${index}`} className="sr-only">
                              Received Qty
                            </Label>
                            <Input
                              id={`pending-received-${index}`}
                              inputMode="decimal"
                              value={item.receivedQty}
                              onKeyDown={(event) => {
                                if (shouldBlockQuantityKey(event.key)) {
                                  event.preventDefault();
                                }
                              }}
                              onPaste={(event) => {
                                const pastedValue = event.clipboardData.getData("text");
                                const pastedError = getReceivedQtyError(pastedValue, item.sentQty);
                                if (pastedError) {
                                  event.preventDefault();
                                  setPendingMoveErrors((current) => ({ ...current, [index]: { receivedQty: pastedError } }));
                                }
                              }}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                const nextError = nextValue.trim() ? getReceivedQtyError(nextValue, item.sentQty) : undefined;
                                if (nextError) {
                                  setPendingMoveErrors((current) => ({ ...current, [index]: { receivedQty: nextError } }));
                                  return;
                                }

                                setPendingMoveItems((current) =>
                                  current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, receivedQty: nextValue } : entry)),
                                );
                                setPendingMoveErrors((current) => ({ ...current, [index]: { receivedQty: undefined } }));
                              }}
                              placeholder="Enter received quantity"
                              className={pendingMoveErrors[index]?.receivedQty ? "border-destructive" : ""}
                            />
                            {pendingMoveErrors[index]?.receivedQty ? <p className="text-xs text-destructive">{pendingMoveErrors[index]?.receivedQty}</p> : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closePendingMoveDialog} disabled={moveMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={submitPendingMove} disabled={moveMutation.isPending}>
                {moveMutation.isPending ? "Moving..." : "Move to QCR"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </GrnPageLayout>
  );
};

export default GRNEditPage;
