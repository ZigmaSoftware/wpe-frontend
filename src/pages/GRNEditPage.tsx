import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { toast } from "@/components/ui/sonner";
import GrnPageLayout from "@/features/grn/components/GrnPageLayout";
import GrnRecordForm from "@/features/grn/components/GrnRecordForm";
import {
  mapRecordToFormValues,
  type GrnFormValues,
  type GrnUpdateResponse,
} from "@/features/grn/grnShared";
import {
  GRN_PROCESS_ROUTE,
  getGrnProcessDetailRoute,
} from "@/features/grn/utils/routes";
import { grnApi } from "@/lib/api";
import { getApiErrorMessage, normalizeGrnResponse } from "@/lib/api-helpers";
import type { GrnListResponse, GrnRecord } from "@/lib/types";

const GRNEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: ["grn-active"],
    queryFn: async () => {
      const response = await grnApi.get<GrnListResponse>("/api/grn/");
      return normalizeGrnResponse(response.data);
    },
  });

  const movedQuery = useQuery({
    queryKey: ["grn-moved"],
    queryFn: async () => {
      const response = await grnApi.get<GrnListResponse>("/api/grn/moved/");
      return normalizeGrnResponse(response.data);
    },
  });

  const record: GrnRecord | null =
    activeQuery.data?.data.find((entry) => entry.id === recordId) ??
    movedQuery.data?.data.find((entry) => entry.id === recordId) ??
    null;

  const updateMutation = useMutation({
    mutationFn: async (values: GrnFormValues) => {
      const response = await grnApi.patch<GrnUpdateResponse>(`/api/grn/${recordId}/`, values);
      return response.data;
    },
    onSuccess: (payload) => {
      toast.success(payload.message || "GRN updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      navigate(getGrnProcessDetailRoute(payload.data.id));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update GRN details.")),
  });

  if (activeQuery.isLoading || movedQuery.isLoading) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <LoadingState label="Loading GRN record..." />
      </GrnPageLayout>
    );
  }

  if (activeQuery.isError || movedQuery.isError || !record) {
    return (
      <GrnPageLayout onBack={() => navigate(GRN_PROCESS_ROUTE)}>
        <ErrorState description="Could not load the GRN record for editing." />
      </GrnPageLayout>
    );
  }

  return (
    <GrnPageLayout onBack={() => navigate(getGrnProcessDetailRoute(record.id))}>
      <GrnRecordForm
        title={`Edit GRN — ${record.grn_no}`}
        subtitle="Update receipt, supplier, item, and valuation values using the same compact GRN workspace."
        submitLabel="Save Changes"
        onSubmit={(values) => updateMutation.mutate(values)}
        onCancel={() => navigate(getGrnProcessDetailRoute(record.id))}
        isSubmitting={updateMutation.isPending}
        initialValues={mapRecordToFormValues(record)}
      />
    </GrnPageLayout>
  );
};

export default GRNEditPage;
