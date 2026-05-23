import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import {
  mapOrderDetailToFormValues,
  type CreateProductionOrderPayload,
  type ProductionOrderDetail,
} from "@/features/production/components/order-dialog/productionOrderForm";
import { Button } from "@/components/ui/button";
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
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["production-order-detail", id] });
      navigate("/app/production");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update order.")),
  });

  if (orderQ.isLoading || machinesQ.isLoading) {
    return (
      <div className="-m-4 min-h-full bg-[#eef3f8] p-4 lg:-m-6 lg:p-6">
        <LoadingState label="Loading production order..." />
      </div>
    );
  }

  if (orderQ.isError) {
    return (
      <div className="-m-4 min-h-full bg-[#eef3f8] p-4 lg:-m-6 lg:p-6">
        <ErrorState description="Could not load production order." />
      </div>
    );
  }

  const machines = machinesQ.data ?? [];
  const order = orderQ.data!;
  const initialValues = mapOrderDetailToFormValues(order, machines);

  return (
    <div className="-m-4 min-h-full bg-[#eef3f8] p-4 lg:-m-6 lg:p-6">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full px-3 text-slate-600 hover:bg-white/70 hover:text-slate-900"
            onClick={() => navigate("/app/production")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Production
          </Button>
        </div>

        <div className="h-[calc(100vh-9rem)]">
          <ProductionOrderForm
            onSubmit={(values) => updateOrderMutation.mutate(values)}
            onCancel={() => navigate("/app/production")}
            isSubmitting={updateOrderMutation.isPending}
            machines={machines}
            machinesLoading={machinesQ.isLoading}
            initialValues={initialValues}
            formTitle={`Edit Order — ${order.production_id}`}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionEditOrderPage;
