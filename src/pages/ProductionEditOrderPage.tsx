import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import {
  mapOrderDetailToFormValues,
  type CreateProductionOrderPayload,
  type ProductionOrderDetail,
} from "@/features/production/components/order-dialog/productionOrderForm";
import { PRODUCTION_AD_WEIGHTAGE_ROUTE } from "@/features/production/utils/routes";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const ProductionEditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update order.")),
  });

  if (orderQ.isLoading || machinesQ.isLoading) {
    return (
      <ProductionOrderPageLayout onBack={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
        <LoadingState label="Loading production order..." />
      </ProductionOrderPageLayout>
    );
  }

  if (orderQ.isError) {
    return (
      <ProductionOrderPageLayout onBack={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
        <ErrorState description="Could not load production order." />
      </ProductionOrderPageLayout>
    );
  }

  const machines = machinesQ.data ?? [];
  const order = orderQ.data!;
  const initialValues = mapOrderDetailToFormValues(order, machines);

  return (
    <ProductionOrderPageLayout onBack={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
      <ProductionOrderForm
        onSubmit={(values) => updateOrderMutation.mutate(values)}
        onCancel={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}
        isSubmitting={updateOrderMutation.isPending}
        machines={machines}
        machinesLoading={machinesQ.isLoading}
        initialValues={initialValues}
        formTitle={`Edit Order — ${order.production_id}`}
        submitLabel="Save Changes"
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionEditOrderPage;
