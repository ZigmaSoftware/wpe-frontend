import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import type { CreateProductionOrderPayload, NamedOption } from "@/features/production/components/order-dialog/productionOrderForm";
import { getProductionStageUi, type ProductionUiStage } from "@/features/production/components/order-dialog/productionStageUi";
import {
  PRODUCTION_AD_WEIGHTAGE_ROUTE,
  PRODUCTION_BL_BLENDING_ROUTE,
  PRODUCTION_GL_GRANULATION_ROUTE,
  PRODUCTION_PR_PRODUCTION_ROUTE,
  PRODUCTION_ROUTE,
} from "@/features/production/utils/routes";
import { coreApi } from "@/lib/api";
import { getApiErrorMessage, normalizeListResponse } from "@/lib/api-helpers";
import type { ProductionMachine } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const ADDITIVE_PRODUCTION_FACILITY: NamedOption = {
  id: "Unit 1",
  name: "Unit 1",
};

type ProductionNewOrderLocationState = {
  backTo?: string;
  entryStage?: ProductionUiStage;
  defaultWorkCenterName?: string;
};

const ProductionNewOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const locationState = location.state as ProductionNewOrderLocationState | null;
  const backRoute = typeof locationState?.backTo === "string" && locationState.backTo.trim().length > 0
    ? locationState.backTo
    : PRODUCTION_ROUTE;
  const isBlEntry = locationState?.entryStage === "BL" || backRoute === PRODUCTION_BL_BLENDING_ROUTE;
  const isGlEntry = locationState?.entryStage === "GL" || backRoute === PRODUCTION_GL_GRANULATION_ROUTE;
  const isPrEntry = locationState?.entryStage === "PR" || backRoute === PRODUCTION_PR_PRODUCTION_ROUTE;
  const isAdEntry =
    locationState?.entryStage === "AD" ||
    (!isBlEntry && !isGlEntry && !isPrEntry && (backRoute === PRODUCTION_AD_WEIGHTAGE_ROUTE || location.pathname === "/app/production/neworder"));
  const entryStage: ProductionUiStage = isAdEntry ? "AD" : isBlEntry ? "BL" : isGlEntry ? "GL" : isPrEntry ? "PR" : "AD";
  const stageUi = getProductionStageUi(entryStage);

  const machinesQ = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      const res = await coreApi.get<unknown>("/api/production/machines/");
      return normalizeListResponse<ProductionMachine>(res.data);
    },
    staleTime: 5 * 60 * 1000,
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
    <ProductionOrderPageLayout
      onBack={() => navigate(backRoute)}
      backLabel={stageUi.backToListLabel}
    >
      <ProductionOrderForm
        onSubmit={(values) => createOrderMutation.mutate(values)}
        onCancel={() => navigate(backRoute)}
        isSubmitting={createOrderMutation.isPending}
        machines={machinesQ.data ?? []}
        machinesLoading={machinesQ.isLoading}
        formTitle={stageUi.createTitle}
        formSubtitle={stageUi.createSubtitle}
        submitLabel={stageUi.createButtonLabel}
        defaultProductionType={stageUi.defaultProductionType}
        entryStage={entryStage}
        fixedProductionFacility={isAdEntry ? ADDITIVE_PRODUCTION_FACILITY : undefined}
        defaultWorkCenterName={isAdEntry ? locationState?.defaultWorkCenterName ?? "New Line Additive Work Center WIP" : undefined}
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionNewOrderPage;
