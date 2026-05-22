import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage } from "@/lib/api-helpers";
import { useAuth } from "@/providers/AuthProvider";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { WPE_PRODUCT_TYPES_SCREEN_CODE } from "@/features/wpe-masters/constants";
import type {
  ProductTypeCategoryWritePayload,
  ProductTypeSubtypeWritePayload,
  TableParams,
} from "@/features/wpe-masters/types";


export const productTypeKeys = {
  categoriesRoot: ["wpe-masters", "product-type-categories"] as const,
  subtypesRoot: ["wpe-masters", "product-type-subtypes"] as const,
  categories: (params: TableParams) =>
    [
      "wpe-masters",
      "product-type-categories",
      params.page ?? 1,
      params.pageSize ?? 25,
      params.search ?? "",
      params.ordering ?? "",
      params.is_active ?? "all",
    ] as const,
  subtypes: (params: TableParams) =>
    [
      "wpe-masters",
      "product-type-subtypes",
      params.page ?? 1,
      params.pageSize ?? 25,
      params.search ?? "",
      params.ordering ?? "",
      params.category_id ?? params.category ?? "all",
      params.is_active ?? "all",
    ] as const,
  categoryLookup: ["wpe-masters", "product-type-categories", "lookup"] as const,
  tree: (search = "") => ["wpe-masters", "product-type-categories", "tree", search] as const,
};


const invalidateProductTypeQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: productTypeKeys.categoriesRoot }),
    queryClient.invalidateQueries({ queryKey: productTypeKeys.subtypesRoot }),
    queryClient.invalidateQueries({ queryKey: productTypeKeys.categoryLookup }),
  ]);
};


const useProductTypeMutation = <TVariables, TResult>({
  mutationFn,
  successMessage,
  errorMessage,
}: {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  successMessage: string;
  errorMessage: string;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      toast.success(successMessage);
      await invalidateProductTypeQueries(queryClient);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, errorMessage));
    },
  });
};


export const useProductTypePermissions = () => {
  const { can } = useAuth();
  const canView = can(WPE_PRODUCT_TYPES_SCREEN_CODE, "view") || can(WPE_PRODUCT_TYPES_SCREEN_CODE, "list");
  const canAdd = can(WPE_PRODUCT_TYPES_SCREEN_CODE, "add");
  const canEdit = can(WPE_PRODUCT_TYPES_SCREEN_CODE, "update");
  const canDelete = can(WPE_PRODUCT_TYPES_SCREEN_CODE, "delete");

  return {
    canView,
    canAdd,
    canEdit,
    canDelete,
  };
};


export const useProductTypeCategoriesQuery = (params: TableParams, enabled = true) =>
  useQuery({
    queryKey: productTypeKeys.categories(params),
    queryFn: () => wpeMastersApi.productTypeCategories.list(params),
    enabled,
  });


export const useProductTypeSubtypesQuery = (params: TableParams, enabled = true) =>
  useQuery({
    queryKey: productTypeKeys.subtypes(params),
    queryFn: () => wpeMastersApi.productTypeSubtypes.list(params),
    enabled,
  });


export const useProductTypeCategoryLookupQuery = (enabled = true) =>
  useQuery({
    queryKey: productTypeKeys.categoryLookup,
    queryFn: wpeMastersApi.productTypeCategories.lookup,
    enabled,
  });


export const useProductTypeTreeQuery = (search = "", enabled = true) =>
  useQuery({
    queryKey: productTypeKeys.tree(search),
    queryFn: () => wpeMastersApi.productTypeCategories.tree(search ? { search } : {}),
    enabled,
  });


export const useProductTypeMutations = () => ({
  createCategory: useProductTypeMutation<ProductTypeCategoryWritePayload, unknown>({
    mutationFn: wpeMastersApi.productTypeCategories.create,
    successMessage: "Product type category created.",
    errorMessage: "Unable to create product type category.",
  }),
  updateCategory: useProductTypeMutation<{ id: number; payload: Partial<ProductTypeCategoryWritePayload> }, unknown>({
    mutationFn: ({ id, payload }) => wpeMastersApi.productTypeCategories.update(id, payload),
    successMessage: "Product type category updated.",
    errorMessage: "Unable to update product type category.",
  }),
  toggleCategory: useProductTypeMutation<number, unknown>({
    mutationFn: wpeMastersApi.productTypeCategories.toggle,
    successMessage: "Product type category status updated.",
    errorMessage: "Unable to update product type category status.",
  }),
  deleteCategory: useProductTypeMutation<number, unknown>({
    mutationFn: wpeMastersApi.productTypeCategories.delete,
    successMessage: "Product type category deleted.",
    errorMessage: "Unable to delete product type category.",
  }),
  createSubtype: useProductTypeMutation<ProductTypeSubtypeWritePayload, unknown>({
    mutationFn: wpeMastersApi.productTypeSubtypes.create,
    successMessage: "Product type subtype created.",
    errorMessage: "Unable to create product type subtype.",
  }),
  updateSubtype: useProductTypeMutation<{ id: number; payload: Partial<ProductTypeSubtypeWritePayload> }, unknown>({
    mutationFn: ({ id, payload }) => wpeMastersApi.productTypeSubtypes.update(id, payload),
    successMessage: "Product type subtype updated.",
    errorMessage: "Unable to update product type subtype.",
  }),
  toggleSubtype: useProductTypeMutation<number, unknown>({
    mutationFn: wpeMastersApi.productTypeSubtypes.toggle,
    successMessage: "Product type subtype status updated.",
    errorMessage: "Unable to update product type subtype status.",
  }),
  deleteSubtype: useProductTypeMutation<number, unknown>({
    mutationFn: wpeMastersApi.productTypeSubtypes.delete,
    successMessage: "Product type subtype deleted.",
    errorMessage: "Unable to delete product type subtype.",
  }),
});
