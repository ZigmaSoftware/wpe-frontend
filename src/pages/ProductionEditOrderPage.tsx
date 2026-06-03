import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import {
  mapOrderDetailToFormValues,
  type CreateProductionOrderPayload,
  type ProductionDialogTab,
  type ProductionOrderDetail,
} from "@/features/production/components/order-dialog/productionOrderForm";
import { PRODUCTION_AD_WEIGHTAGE_ROUTE } from "@/features/production/utils/routes";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const DEFAULT_AD_WORK_CENTER_NAME = "New Line Additive Work Center WIP";

type ProductionEditOrderLocationState = {
  backTo?: string;
  initialTab?: ProductionDialogTab;
  visibleTabs?: ProductionDialogTab[];
  outputStage?: "AD" | "BL";
  outputBatchId?: number | null;
};

const ProductionEditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const locationState = location.state as ProductionEditOrderLocationState | null;
  const backRoute = typeof locationState?.backTo === "string" && locationState.backTo.trim().length > 0
    ? locationState.backTo
    : PRODUCTION_AD_WEIGHTAGE_ROUTE;

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
      <ProductionOrderPageLayout onBack={() => navigate(backRoute)}>
        <LoadingState label="Loading production order..." />
      </ProductionOrderPageLayout>
    );
  }

  if (orderQ.isError) {
    return (
      <ProductionOrderPageLayout onBack={() => navigate(backRoute)}>
        <ErrorState description="Could not load production order." />
      </ProductionOrderPageLayout>
    );
  }

  const machines = machinesQ.data ?? [];
  const order = orderQ.data!;
  const initialValues = mapOrderDetailToFormValues(order, machines);

  return (
    <ProductionOrderPageLayout onBack={() => navigate(backRoute)}>
      <ProductionOrderForm
        onSubmit={(values) => updateOrderMutation.mutate(values)}
        onCancel={() => navigate(backRoute)}
        isSubmitting={updateOrderMutation.isPending}
        machines={machines}
        machinesLoading={machinesQ.isLoading}
        initialValues={initialValues}
        formTitle={`Edit Order — ${order.production_id}`}
        submitLabel="Save Changes"
        initialTab={locationState?.initialTab}
        visibleTabs={locationState?.visibleTabs}
        outputContext={{
          stage: locationState?.outputStage,
          batchId: locationState?.outputBatchId ?? null,
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
