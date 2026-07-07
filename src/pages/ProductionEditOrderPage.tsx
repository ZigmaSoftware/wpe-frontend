import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderFormView";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import {
  mapOrderDetailToFormValues,
  type CreateProductionOrderPayload,
  type ProductionDialogTab,
  type ProductionOrderDetail,
} from "@/features/production/components/order-dialog/productionOrderForm";
import {
  PRODUCTION_AD_WEIGHTAGE_ROUTE,
  PRODUCTION_BL_BLENDING_ROUTE,
  PRODUCTION_GL_GRANULATION_ROUTE,
} from "@/features/production/utils/routes";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionBatch, ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const DEFAULT_AD_WORK_CENTER_NAME = "New Line Additive Work Center WIP";

type ProductionEditOrderLocationState = {
  backTo?: string;
  initialTab?: ProductionDialogTab;
  visibleTabs?: ProductionDialogTab[];
  outputStage?: ProductionBatch["stage"];
  outputBatchId?: number | null;
};

const ProductionEditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const locationState = location.state as ProductionEditOrderLocationState | null;
  const searchOutputMode = searchParams.get("mode");
  const searchOutputStage = searchParams.get("stage")?.toUpperCase();
  const searchOutputBatchIdRaw = searchParams.get("batchId");
  const searchOutputBatchId = searchOutputBatchIdRaw ? Number(searchOutputBatchIdRaw) : null;
  const searchVisibleTabs = searchOutputMode === "output" ? (["output"] as ProductionDialogTab[]) : undefined;
  const searchInitialTab = searchOutputMode === "output" ? ("output" as ProductionDialogTab) : undefined;
  const normalizedSearchOutputStage =
    searchOutputStage === "AD" || searchOutputStage === "BL" || searchOutputStage === "GL" || searchOutputStage === "PR"
      ? searchOutputStage
      : null;
  const effectiveInitialTab = locationState?.initialTab ?? searchInitialTab;
  const effectiveVisibleTabs = locationState?.visibleTabs ?? searchVisibleTabs;
  const effectiveOutputStage =
    locationState?.outputStage ?? normalizedSearchOutputStage;
  const effectiveOutputBatchId =
    locationState?.outputBatchId ?? (Number.isInteger(searchOutputBatchId) && searchOutputBatchId && searchOutputBatchId > 0 ? searchOutputBatchId : null);
  const outputOnlyStage =
    effectiveOutputStage &&
    effectiveInitialTab === "output" &&
    effectiveVisibleTabs?.length === 1 &&
    effectiveVisibleTabs[0] === "output"
      ? effectiveOutputStage
      : null;
  const backRoute = typeof locationState?.backTo === "string" && locationState.backTo.trim().length > 0
    ? locationState.backTo
    : outputOnlyStage === "BL"
      ? PRODUCTION_BL_BLENDING_ROUTE
      : outputOnlyStage === "GL"
        ? PRODUCTION_GL_GRANULATION_ROUTE
      : PRODUCTION_AD_WEIGHTAGE_ROUTE;
  const backLabel =
    outputOnlyStage === "AD"
      ? "Back to AD - Manage Batch"
      : outputOnlyStage === "BL"
        ? "Back to BL - Manage Batch"
        : outputOnlyStage === "GL"
          ? "Back to GL - Manage Batch"
          : outputOnlyStage === "PR"
            ? "Back to PR - Manage Batch"
        : undefined;

  const machinesQ = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/machines/");
      return normalizeListResponse<ProductionMachine>(res.data);
    },
  });

  const orderQ = useQuery({
    queryKey: ["production-order-detail", id],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(`/api/production/production/${id}/`);
      const raw = res.data as { data?: unknown } & Record<string, unknown>;
      return (raw.data ?? raw) as ProductionOrderDetail;
    },
    enabled: !!id,
  });

  const updateOrderMutation = useMutation({
    mutationFn: (values: CreateProductionOrderPayload) =>
      coreApi.patch(`/api/production/production/${id}/`, values),
    onSuccess: () => {
      toast.success("Production order updated.");
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-stage-records"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["production-order-detail", id] });
      navigate(backRoute);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update order.")),
  });

  if (orderQ.isLoading || machinesQ.isLoading) {
    return (
      <ProductionOrderPageLayout onBack={() => navigate(backRoute)} backLabel={backLabel}>
        <LoadingState label="Loading production order..." />
      </ProductionOrderPageLayout>
    );
  }

  if (orderQ.isError) {
    return (
      <ProductionOrderPageLayout onBack={() => navigate(backRoute)} backLabel={backLabel}>
        <ErrorState description="Could not load production order." />
      </ProductionOrderPageLayout>
    );
  }

  const machines = machinesQ.data ?? [];
  const order = orderQ.data!;
  const initialValues = mapOrderDetailToFormValues(order, machines);
  const formTitle =
    outputOnlyStage === "AD"
      ? `Batch Creation — ${order.production_id}`
      : outputOnlyStage === "BL"
        ? `Bin Assign — ${order.production_id}`
        : outputOnlyStage === "GL"
          ? `Bag Assign — ${order.production_id}`
          : outputOnlyStage === "PR"
            ? `Line Assign — ${order.production_id}`
        : `Edit Order — ${order.production_id}`;

  return (
    <ProductionOrderPageLayout onBack={() => navigate(backRoute)} backLabel={backLabel}>
      <ProductionOrderForm
        onSubmit={(values) => updateOrderMutation.mutate(values)}
        onCancel={() => navigate(backRoute)}
        isSubmitting={updateOrderMutation.isPending}
        machines={machines}
        machinesLoading={machinesQ.isLoading}
        initialValues={initialValues}
        orderId={Number(id)}
        formTitle={formTitle}
        submitLabel="Save Changes"
        showFooterActions={!(outputOnlyStage === "AD" || outputOnlyStage === "BL" || outputOnlyStage === "GL" || outputOnlyStage === "PR")}
        initialTab={effectiveInitialTab}
        visibleTabs={effectiveVisibleTabs}
        outputContext={{
          stage: effectiveOutputStage,
          batchId: effectiveOutputBatchId,
          requireFinalCaptureConfirmation:
            outputOnlyStage === "AD" || outputOnlyStage === "BL" || outputOnlyStage === "GL" || outputOnlyStage === "PR",
        }}
        defaultWorkCenterName={
          order.production_type?.trim().toLowerCase() === "wpe additive production".toLowerCase()
            ? DEFAULT_AD_WORK_CENTER_NAME
            : undefined
        }
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionEditOrderPage;
