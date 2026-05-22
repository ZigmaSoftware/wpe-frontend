import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductionOrderForm from "@/features/production/components/order-dialog/ProductionOrderForm";
import type { CreateProductionOrderPayload } from "@/features/production/components/order-dialog/productionOrderForm";
import { Button } from "@/components/ui/button";
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
      queryClient.invalidateQueries({ queryKey: ["production-dashboard"] });
      navigate("/app/production");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create order.")),
  });

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

        <div className="min-h-[calc(100vh-9rem)]">
          <ProductionOrderForm
            onSubmit={(values) => createOrderMutation.mutate(values)}
            onCancel={() => navigate("/app/production")}
            isSubmitting={createOrderMutation.isPending}
            machines={machinesQ.data ?? []}
            machinesLoading={machinesQ.isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionNewOrderPage;
