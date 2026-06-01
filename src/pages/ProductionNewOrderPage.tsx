import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import type { CreateProductionOrderPayload } from "@/features/production/components/order-dialog/productionOrderForm";
import { PRODUCTION_AD_WEIGHTAGE_ROUTE } from "@/features/production/utils/routes";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const ProductionNewOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const machinesQ = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/machines/");
      return normalizeListResponse<ProductionMachine>(res.data);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (values: CreateProductionOrderPayload) => coreApi.post("/api/production/production/", values),
    onSuccess: () => {
      toast.success("Production order created.");
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-stage-records"] });
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create order.")),
  });

  return (
    <ProductionOrderPageLayout onBack={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}>
      <ProductionOrderForm
        onSubmit={(values) => createOrderMutation.mutate(values)}
        onCancel={() => navigate(PRODUCTION_AD_WEIGHTAGE_ROUTE)}
        isSubmitting={createOrderMutation.isPending}
        machines={machinesQ.data ?? []}
        machinesLoading={machinesQ.isLoading}
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionNewOrderPage;
