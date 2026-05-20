/**
 * Custom React Hooks for Production Module
 * Handles data fetching and mutations with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productionOrderApi,
  materialMovementApi,
  productionTransactionApi,
  productionSummaryApi,
} from '../api/productionApi';
import { productionKeys } from '../api/queryKeys';
import {
  ProductionOrder,
  ProductionOrderDetail,
  ProductionOrderFilters,
  MaterialMovement,
  ProductionTransaction,
  ProductionSummary,
} from '../types';

/**
 * Hook for fetching production orders list
 */
export const useProductionOrdersList = (filters?: ProductionOrderFilters) => {
  return useQuery({
    queryKey: productionKeys.ordersList(filters),
    queryFn: () => productionOrderApi.getList(filters),
    enabled: true,
  });
};

/**
 * Hook for fetching single production order detail
 */
export const useProductionOrderDetail = (id: number | string) => {
  return useQuery({
    queryKey: productionKeys.orderDetail(id),
    queryFn: () => productionOrderApi.getDetail(id),
    enabled: !!id,
  });
};

/**
 * Hook for creating a production order
 */
export const useCreateProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProductionOrder>) =>
      productionOrderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.orders() });
    },
  });
};

/**
 * Hook for updating a production order
 */
export const useUpdateProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<ProductionOrder> }) =>
      productionOrderApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: productionKeys.orders() });
    },
  });
};

/**
 * Hook for deleting a production order
 */
export const useDeleteProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => productionOrderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.orders() });
    },
  });
};

/**
 * Hook for fetching material movements for a production order
 */
export const useProductionMaterialMovements = (id: number | string) => {
  return useQuery({
    queryKey: productionKeys.orderMaterialMovements(id),
    queryFn: () => productionOrderApi.getMaterialMovements(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching transactions for a production order
 */
export const useProductionTransactions = (id: number | string) => {
  return useQuery({
    queryKey: productionKeys.orderTransactions(id),
    queryFn: () => productionOrderApi.getTransactions(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching summary for a production order
 */
export const useProductionSummary = (id: number | string) => {
  return useQuery({
    queryKey: productionKeys.orderSummary(id),
    queryFn: () => productionOrderApi.getSummary(id),
    enabled: !!id,
  });
};

/**
 * Hook for fetching cost breakdown for a production order
 */
export const useProductionCostBreakdown = (id: number | string) => {
  return useQuery({
    queryKey: productionKeys.orderCostBreakdown(id),
    queryFn: () => productionOrderApi.getCostBreakdown(id),
    enabled: !!id,
  });
};

/**
 * Hook for closing a production order
 */
export const useCloseProductionOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => productionOrderApi.close(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: productionKeys.orders() });
    },
  });
};

/**
 * Hook for creating material movement
 */
export const useCreateMaterialMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<MaterialMovement>) =>
      materialMovementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.movements() });
    },
  });
};

/**
 * Hook for creating production transaction
 */
export const useCreateProductionTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProductionTransaction>) =>
      productionTransactionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.transactions() });
    },
  });
};

/**
 * Hook for finalizing production summary
 */
export const useFinalizeProductionSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => productionSummaryApi.finalize(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.summaryDetail(id) });
    },
  });
};
