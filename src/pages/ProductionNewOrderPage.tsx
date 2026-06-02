import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ProductionStageValue } from "@/features/production/api/productionWorkspaceApi";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import type { CreateProductionOrderPayload } from "@/features/production/components/order-dialog/productionOrderForm";
import { getProductionStageRoute } from "@/features/production/utils/routes";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const STAGE_PRODUCTION_TYPE_DEFAULTS: Record<ProductionStageValue, string> = {
  AD: "WPE Additive Production",
  BL: "WPE Blend Production",
  GL: "WPE Granulated Blend Production",
  PR: "WPE Additive Production",
};

const ProductionNewOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const routeStage = searchParams.get("stage")?.toUpperCase();
  const stage: ProductionStageValue =
    routeStage === "BL" || routeStage === "GL" || routeStage === "PR" || routeStage === "AD"
      ? routeStage
      : "AD";
  const backRoute = getProductionStageRoute(stage);
  const defaultProductionType = STAGE_PRODUCTION_TYPE_DEFAULTS[stage];

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
      navigate(backRoute);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create order.")),
  });

  return (
    <ProductionOrderPageLayout onBack={() => navigate(backRoute)}>
      <ProductionOrderForm
        onSubmit={(values) => createOrderMutation.mutate(values)}
        onCancel={() => navigate(backRoute)}
        isSubmitting={createOrderMutation.isPending}
        machines={machinesQ.data ?? []}
        machinesLoading={machinesQ.isLoading}
        defaultProductionType={defaultProductionType}
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionNewOrderPage;
