import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoveRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
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

const GRNEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moveConfirmOpen, setMoveConfirmOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<GrnFormValues | null>(null);
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
      toast.success(payload.message || "GRN updated successfully.");
      setFormInitialValues(mapRecordToFormValues(payload.data));
      queryClient.setQueryData(["grn-detail", payload.data.id], payload);
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update GRN details.")),
  });

  const moveMutation = useMutation({
    mutationFn: async () => {
      const response = await grnApi.post(`/api/grn/${recordId}/move-to-qcr/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("GRN moved to GRN Pending.");
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-pending"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      navigate(GRN_PROCESS_ROUTE);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to move GRN to GRN Pending.")),
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

  return (
    <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
      <>
        <GrnRecordForm
          title={`Edit Gate Entry — ${record.grn_no}`}
          subtitle="Update receipt, supplier, item, and valuation values before sending the record to GRN Pending."
          submitLabel="Save Changes"
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={() => navigate(GRN_PROCESS_ROUTE)}
          isSubmitting={updateMutation.isPending}
          initialValues={formInitialValues}
          requiredDocumentFields={["gateentry_bookno", "gateentry_bookdate"]}
          headerActionsPlacement="side-center"
          headerActions={({ isDirty, setActiveTab, getValue, setFieldError, clearFieldError }) =>
            isActiveRecord ? (
              <Button
                type="button"
                className="h-10 rounded-full bg-[linear-gradient(135deg,#0ea56b_0%,#067647_100%)] px-5 text-white shadow-[0_12px_24px_-16px_rgba(6,118,71,0.85)] hover:opacity-95"
                onClick={() => {
                  setActiveTab("document");
                  const gateEntryBookNo = String(getValue("document_details.gateentry_bookno") ?? "").trim();
                  const gateEntryBookDate = String(getValue("document_details.gateentry_bookdate") ?? "").trim();

                  if (!gateEntryBookNo) {
                    setFieldError("document_details.gateentry_bookno", "Gate Entry Book No is required.");
                  } else {
                    clearFieldError("document_details.gateentry_bookno");
                  }

                  if (!gateEntryBookDate) {
                    setFieldError("document_details.gateentry_bookdate", "Gate Entry Book Date is required.");
                  } else {
                    clearFieldError("document_details.gateentry_bookdate");
                  }

                  if (!gateEntryBookNo || !gateEntryBookDate) {
                    return;
                  }
                  setMoveConfirmOpen(true);
                }}
                disabled={moveMutation.isPending || updateMutation.isPending || isDirty}
                title={isDirty ? "Save changes before moving to GRN Pending." : undefined}
              >
                <MoveRight className="mr-2 h-4 w-4" />
                {moveMutation.isPending ? "Moving..." : "Move to GRN Pending"}
              </Button>
            ) : null
          }
        />

        <ConfirmDialog
          open={moveConfirmOpen}
          onOpenChange={setMoveConfirmOpen}
          title="Move Gate Entry to GRN Pending"
          description={`Move ${record.grn_no} to GRN Pending? This will complete Gate Entry and send the record to the pending handoff queue.`}
          confirmLabel={moveMutation.isPending ? "Moving..." : "Move to GRN Pending"}
          onConfirm={() => moveMutation.mutate()}
        />
      </>
    </GrnPageLayout>
  );
};

export default GRNEditPage;
