/**
 * Production API Service
 * Handles all API calls for production module
 */

import { coreApi as apiClient } from '../../../lib/api';
import {
  ProductionOrder,
  ProductionOrderDetail,
  ProductionOrderListResponse,
  ProductionOrderFilters,
  MaterialMovement,
  ProductionTransaction,
  ProductionSummary,
  CostBreakdown,
} from '../types';

const API_BASE_URL = '/api/production';
type ResultsListResponse<T> = { results: T[] };

/**
 * Production Order APIs
 */
export const productionOrderApi = {
  /**
   * Get list of production orders with optional filters
   */
  getList: async (filters?: ProductionOrderFilters): Promise<ProductionOrderListResponse> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.production_type) params.append('production_type', filters.production_type);
      if (filters.batch_number) params.append('batch_number', filters.batch_number);
      if (filters.production_date) params.append('production_date', filters.production_date);
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/production/${queryString ? '?' + queryString : ''}`;

    const response = await apiClient.get<ProductionOrderListResponse>(url);
    return response.data;
  },

  /**
   * Get detailed production order with all related data
   */
  getDetail: async (id: number | string): Promise<ProductionOrderDetail> => {
    const response = await apiClient.get<ProductionOrderDetail>(`${API_BASE_URL}/production/${id}/`);
    return response.data;
  },

  /**
   * Create a new production order
   */
  create: async (data: Partial<ProductionOrder>): Promise<ProductionOrder> => {
    const response = await apiClient.post<ProductionOrder>(`${API_BASE_URL}/production/`, data);
    return response.data;
  },

  /**
   * Update a production order
   */
  update: async (id: number | string, data: Partial<ProductionOrder>): Promise<ProductionOrder> => {
    const response = await apiClient.patch<ProductionOrder>(`${API_BASE_URL}/production/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a production order
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/production/${id}/`);
  },

  /**
   * Get material movements for a production order
   */
  getMaterialMovements: async (id: number | string): Promise<MaterialMovement[]> => {
    const response = await apiClient.get<MaterialMovement[]>(`${API_BASE_URL}/production/${id}/material_movements/`);
    return response.data;
  },

  /**
   * Get transactions for a production order
   */
  getTransactions: async (id: number | string): Promise<ProductionTransaction[]> => {
    const response = await apiClient.get<ProductionTransaction[]>(`${API_BASE_URL}/production/${id}/transactions/`);
    return response.data;
  },

  /**
   * Get summary for a production order
   */
  getSummary: async (id: number | string): Promise<ProductionSummary> => {
    const response = await apiClient.get<ProductionSummary>(`${API_BASE_URL}/production/${id}/summary/`);
    return response.data;
  },

  /**
   * Get cost breakdown for a production order
   */
  getCostBreakdown: async (id: number | string): Promise<CostBreakdown> => {
    const response = await apiClient.get<CostBreakdown>(`${API_BASE_URL}/production/${id}/cost_breakdown/`);
    return response.data;
  },

  /**
   * Close a production order
   */
  close: async (id: number | string): Promise<ProductionOrder> => {
    const response = await apiClient.post<ProductionOrder>(`${API_BASE_URL}/production/${id}/close/`, {});
    return response.data;
  },
};

/**
 * Material Movement APIs
 */
export const materialMovementApi = {
  /**
   * Get list of material movements
   */
  getList: async (filters?: any): Promise<ResultsListResponse<MaterialMovement>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.movement_type) params.append('movement_type', filters.movement_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.production_order) params.append('production_order', filters.production_order);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/material-movements/${queryString ? '?' + queryString : ''}`;

    const response = await apiClient.get<ResultsListResponse<MaterialMovement>>(url);
    return response.data;
  },

  /**
   * Get material movement detail
   */
  getDetail: async (id: number | string): Promise<MaterialMovement> => {
    const response = await apiClient.get<MaterialMovement>(`${API_BASE_URL}/material-movements/${id}/`);
    return response.data;
  },

  /**
   * Create material movement
   */
  create: async (data: Partial<MaterialMovement>): Promise<MaterialMovement> => {
    const response = await apiClient.post<MaterialMovement>(`${API_BASE_URL}/material-movements/`, data);
    return response.data;
  },

  /**
   * Update material movement
   */
  update: async (id: number | string, data: Partial<MaterialMovement>): Promise<MaterialMovement> => {
    const response = await apiClient.patch<MaterialMovement>(`${API_BASE_URL}/material-movements/${id}/`, data);
    return response.data;
  },

  /**
   * Delete material movement
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/material-movements/${id}/`);
  },
};

/**
 * Production Transaction APIs
 */
export const productionTransactionApi = {
  /**
   * Get list of transactions
   */
  getList: async (filters?: any): Promise<ResultsListResponse<ProductionTransaction>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.transaction_date) params.append('transaction_date', filters.transaction_date);
      if (filters.production_order) params.append('production_order', filters.production_order);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/production-transactions/${queryString ? '?' + queryString : ''}`;

    const response = await apiClient.get<ResultsListResponse<ProductionTransaction>>(url);
    return response.data;
  },

  /**
   * Get transaction detail
   */
  getDetail: async (id: number | string): Promise<ProductionTransaction> => {
    const response = await apiClient.get<ProductionTransaction>(`${API_BASE_URL}/production-transactions/${id}/`);
    return response.data;
  },

  /**
   * Create transaction
   */
  create: async (data: Partial<ProductionTransaction>): Promise<ProductionTransaction> => {
    const response = await apiClient.post<ProductionTransaction>(`${API_BASE_URL}/production-transactions/`, data);
    return response.data;
  },

  /**
   * Update transaction
   */
  update: async (id: number | string, data: Partial<ProductionTransaction>): Promise<ProductionTransaction> => {
    const response = await apiClient.patch<ProductionTransaction>(`${API_BASE_URL}/production-transactions/${id}/`, data);
    return response.data;
  },

  /**
   * Delete transaction
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/production-transactions/${id}/`);
  },
};

/**
 * Production Summary APIs
 */
export const productionSummaryApi = {
  /**
   * Get list of summaries
   */
  getList: async (filters?: any): Promise<ResultsListResponse<ProductionSummary>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.is_finalized !== undefined)
        params.append('is_finalized', filters.is_finalized.toString());
      if (filters.production_order) params.append('production_order', filters.production_order);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/production-summaries/${queryString ? '?' + queryString : ''}`;

    const response = await apiClient.get<ResultsListResponse<ProductionSummary>>(url);
    return response.data;
  },

  /**
   * Get summary detail
   */
  getDetail: async (id: number | string): Promise<ProductionSummary> => {
    const response = await apiClient.get<ProductionSummary>(`${API_BASE_URL}/production-summaries/${id}/`);
    return response.data;
  },

  /**
   * Finalize a production summary
   */
  finalize: async (id: number | string): Promise<ProductionSummary> => {
    const response = await apiClient.post<ProductionSummary>(`${API_BASE_URL}/production-summaries/${id}/finalize/`, {});
    return response.data;
  },
};
