import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import GrnPageLayout from "@/features/grn/components/GrnPageLayout";
import GrnRecordForm from "@/features/grn/components/GrnRecordForm";
import type { GrnFormValues } from "@/features/grn/grnShared";
import { grnApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-helpers";

const GRNCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: GrnFormValues) => {
      const response = await grnApi.post("/api/grn/", values);
      return response.data;
    },
    onSuccess: () => {
      toast.success("GRN stored successfully.");
      queryClient.invalidateQueries({ queryKey: ["grn-active"] });
      queryClient.invalidateQueries({ queryKey: ["grn-moved"] });
      queryClient.invalidateQueries({ queryKey: ["qcr"] });
      navigate("/app/grn");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to create GRN record.")),
  });

  return (
    <GrnPageLayout onBack={() => navigate("/app/grn")}>
      <GrnRecordForm
        title="Create GRN"
        subtitle="Capture document, supplier, item, and valuation data in one compact goods receipt workspace."
        submitLabel="Create GRN"
        onSubmit={(values) => createMutation.mutate(values)}
        onCancel={() => navigate("/app/grn")}
        isSubmitting={createMutation.isPending}
      />
    </GrnPageLayout>
  );
};

export default GRNCreatePage;
