/**
 * Production Module Barrel Export
 * Exports all public APIs from the production module
 */

// Pages
export { ProductionPage } from './pages/ProductionPage';

// Components
export { GeneralTab } from './components/GeneralTab';
export { MaterialMovementTab } from './components/MaterialMovementTab';
export { ProductionTransactionTab } from './components/ProductionTransactionTab';
export { SummaryTab } from './components/SummaryTab';

// Hooks
export {
  useProductionOrdersList,
  useProductionOrderDetail,
  useCreateProductionOrder,
  useUpdateProductionOrder,
  useDeleteProductionOrder,
  useProductionMaterialMovements,
  useProductionTransactions,
  useProductionSummary,
  useProductionCostBreakdown,
  useCloseProductionOrder,
  useCreateMaterialMovement,
  useCreateProductionTransaction,
  useFinalizeProductionSummary,
} from './hooks/useProduction';

// APIs
export {
  productionOrderApi,
  materialMovementApi,
  productionTransactionApi,
  productionSummaryApi,
} from './api/productionApi';

// Types
export type {
  ProductionOrder,
  ProductionOrderDetail,
  MaterialMovement,
  ProductionTransaction,
  ProductionSummary,
  ProductionOrderFilters,
  CostBreakdown,
  MaterialFlowCard,
} from './types';

export {
  ProductionStatus,
  ProductionType,
  MaterialMovementType,
  MaterialMovementStatus,
  TransactionType,
} from './types';
