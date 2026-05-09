import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";

export const useAdminMutation = <TVariables, TResult>({
  mutationFn,
  queryKey,
  successMessage,
  errorMessage,
}: {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  queryKey: QueryKey;
  successMessage: string;
  errorMessage: string;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, errorMessage));
    },
  });
};
