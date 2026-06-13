/**
 * React Query Key Factory for Production Module
 * Follows the recommended key factory pattern
 */

import {
  ProductionOrderFilters,
  MaterialMovementFilters,
  ProductionTransactionFilters,
  ProductionSummaryFilters,
} from '../types';

export const productionKeys = {
  all: ['production'] as const,

  // Production Orders
  orders: () => [...productionKeys.all, 'orders'] as const,
  ordersList: (filters?: ProductionOrderFilters) =>
    [...productionKeys.orders(), 'list', filters] as const,
  orderDetail: (id: number | string) =>
    [...productionKeys.orders(), 'detail', id] as const,
  orderMaterialMovements: (id: number | string) =>
    [...productionKeys.orders(), id, 'material-movements'] as const,
  orderTransactions: (id: number | string) =>
    [...productionKeys.orders(), id, 'transactions'] as const,
  orderSummary: (id: number | string) =>
    [...productionKeys.orders(), id, 'summary'] as const,
  orderCostBreakdown: (id: number | string) =>
    [...productionKeys.orders(), id, 'cost-breakdown'] as const,

  // Material Movements
  movements: () => [...productionKeys.all, 'material-movements'] as const,
  movementsList: (filters?: MaterialMovementFilters) =>
    [...productionKeys.movements(), 'list', filters] as const,
  movementDetail: (id: number | string) =>
    [...productionKeys.movements(), 'detail', id] as const,

  // Production Transactions
  transactions: () => [...productionKeys.all, 'transactions'] as const,
  transactionsList: (filters?: ProductionTransactionFilters) =>
    [...productionKeys.transactions(), 'list', filters] as const,
  transactionDetail: (id: number | string) =>
    [...productionKeys.transactions(), 'detail', id] as const,

  // Production Summaries
  summaries: () => [...productionKeys.all, 'summaries'] as const,
  summaryDetail: (id: number | string) =>
    [...productionKeys.summaries(), 'detail', id] as const,
};
