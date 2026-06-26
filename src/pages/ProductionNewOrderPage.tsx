import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import ProductionOrderPageLayout from "@/features/production/components/order-dialog/ProductionOrderPageLayout";
import type { CreateProductionOrderPayload, NamedOption } from "@/features/production/components/order-dialog/productionOrderForm";
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
  entryStage?: string;
  defaultWorkCenterName?: string;
};

const DEFAULT_PRODUCTION_TYPE_BY_STAGE = {
  AD: "WPE Additive Production",
  BL: "WPE Blend Production",
  GL: "WPE Granulated Blend Production",
  PR: "WPE Production Line",
} as const;

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
  const entryStage = isAdEntry ? "AD" : isBlEntry ? "BL" : isGlEntry ? "GL" : isPrEntry ? "PR" : "AD";
  const backLabel = isAdEntry ? "Back to AD list" : isBlEntry ? "Back to BL List" : isGlEntry ? "Back to GL List" : isPrEntry ? "Back to PR List" : undefined;
  const formTitle = isAdEntry
    ? "New Additive Creation"
    : isBlEntry
      ? "Blending Creation"
      : isGlEntry
        ? "New GL Creation"
        : isPrEntry
          ? "New PR Creation"
          : "New Production Order";
  const submitLabel = isAdEntry ? "Create Additive" : isBlEntry ? "Create Blending" : isGlEntry ? "Create Granulation" : isPrEntry ? "Create Production" : "Create Production Order";

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
      backLabel={backLabel}
    >
      <ProductionOrderForm
        onSubmit={(values) => createOrderMutation.mutate(values)}
        onCancel={() => navigate(backRoute)}
        isSubmitting={createOrderMutation.isPending}
        machines={machinesQ.data ?? []}
        machinesLoading={machinesQ.isLoading}
        formTitle={formTitle}
        submitLabel={submitLabel}
        defaultProductionType={DEFAULT_PRODUCTION_TYPE_BY_STAGE[entryStage]}
        entryStage={entryStage}
        fixedProductionFacility={isAdEntry ? ADDITIVE_PRODUCTION_FACILITY : undefined}
        defaultWorkCenterName={isAdEntry ? locationState?.defaultWorkCenterName ?? "New Line Additive Work Center WIP" : undefined}
      />
    </ProductionOrderPageLayout>
  );
};

export default ProductionNewOrderPage;
